/**
 * Phase 2: confirmed INITIAL unit purchase per policy fund.
 * Writes ONLY the PolicyUnitPurchase collection (immutable, unique per policy/fund/type)
 * plus the audit log. Never writes policies, allocations, funding or valuations,
 * and never changes policy status. Future corrections must append to `history`.
 */
const { createInvestmentGuards } = require("./investmentAccess.cjs");
const { createFundingGuard } = require("./fundingAccess.cjs");
const { validateDate } = require("./fundValuations.cjs");
const { computeInitialPurchase } = require("./purchasePreview.cjs");

function getUnitPurchaseModel(mongoose) {
  if (mongoose.models.PolicyUnitPurchase) return mongoose.models.PolicyUnitPurchase;
  const D = mongoose.Schema.Types.Decimal128;
  const schema = new mongoose.Schema({
    policyId: { type: String, required: true }, fundId: { type: String, required: true },
    fundName: { type: String, default: "" }, assetManagerName: { type: String, default: "" },
    type: { type: String, enum: ["INITIAL"], required: true },
    purchaseDate: { type: String, required: true },
    investmentAmount: { type: D, required: true }, unitPrice: { type: D, required: true },
    units: { type: D, required: true }, closingBalance: { type: D, required: true },
    valuationId: { type: String, required: true }, valuationRevision: { type: Number, required: true },
    inputHash: { type: String, required: true },
    authorisedBy: { id: { type: String, required: true }, name: { type: String, default: "" } },
    confirmedAt: { type: Date, required: true },
    history: { type: [mongoose.Schema.Types.Mixed], default: [] },
  }, { timestamps: true });
  schema.index({ policyId: 1, fundId: 1, type: 1 }, { unique: true });
  return mongoose.model("PolicyUnitPurchase", schema);
}

// Decimal128 holds 34 significant digits: the maximum precision Mongo can store.
const Decimal = require("decimal.js").clone({ precision: 80, rounding: 4 });
const storedUnits = (u) => new Decimal(u).toSignificantDigits(34).toFixed();
const str = (v) => (v == null ? "" : v.toString());
const view = (r) => ({
  policyId: r.policyId, fundId: r.fundId, fundName: r.fundName, assetManagerName: r.assetManagerName, type: r.type,
  status: "PURCHASED", purchaseDate: r.purchaseDate, investmentAmount: str(r.investmentAmount), unitPrice: str(r.unitPrice),
  units: str(r.units), closingBalance: str(r.closingBalance), valuationId: r.valuationId, valuationRevision: r.valuationRevision,
  authorisedBy: r.authorisedBy, confirmedAt: r.confirmedAt,
});

function createUnitPurchaseHandlers({ PolicyUnitPurchase, toDecimal = (v) => v, User, Organisation, requireRootOrgAccess, getPolicy, PolicyFunding, AssetManagerFund, Valuation, logAudit, isValidId = () => true }) {
  const { requireInvestmentPolicyAccess } = createInvestmentGuards({ User, Organisation, requireRootOrgAccess, getPolicy });
  const { requireFundingManager } = createFundingGuard({ User, Organisation });

  const listPurchases = async (req, res) => {
    const access = await requireInvestmentPolicyAccess(req, res); if (!access) return;
    try {
      const rows = await PolicyUnitPurchase.find({ policyId: access.policy.id }).lean();
      res.json(rows.map(view));
    } catch (e) { console.error("Purchase list error:", e); res.status(500).json({ message: "Failed to load unit purchases" }); }
  };

  const confirmInitialPurchase = async (req, res) => {
    const actor = await requireFundingManager(req, res); if (!actor) return;
    const access = await requireInvestmentPolicyAccess(req, res); if (!access) return;
    const b = req.body || {};
    if (b.confirmed !== true) return res.status(400).json({ code: "NOT_CONFIRMED", message: "Tick the confirmation before recording the purchase" });
    let date;
    try { date = validateDate(b.purchaseDate); } catch { return res.status(400).json({ code: "INVALID_DATE", message: "Select a valid purchase date" }); }
    try {
      const policy = access.policy;
      const r = await computeInitialPurchase({ policy, fundId: req.params.fundId, date, PolicyFunding, AssetManagerFund, Valuation, isValidId });
      if (r.error) return res.status(r.error.status).json({ code: r.error.code, message: r.error.message });
      const p = r.result;
      if (String(b.approvedAmount) !== p.approvedAmount || String(b.unitPrice) !== p.unitPrice || String(b.valuationId) !== p.valuationId ||
          Number(b.valuationRevision) !== p.valuationRevision || String(b.inputHash) !== p.inputHash) {
        return res.status(409).json({ code: "PREVIEW_STALE", message: "The amount, unit price or valuation has changed since the preview. Preview again before confirming." });
      }
      const now = new Date();
      const record = await PolicyUnitPurchase.create({
        policyId: policy.id, fundId: p.fundId, fundName: p.fundName, assetManagerName: p.assetManagerName, type: "INITIAL",
        purchaseDate: date, investmentAmount: toDecimal(p.approvedAmount), unitPrice: toDecimal(p.unitPrice),
        units: toDecimal(storedUnits(p.estimatedUnits)), closingBalance: toDecimal(p.closingBalance),
        valuationId: p.valuationId, valuationRevision: p.valuationRevision, inputHash: p.inputHash,
        authorisedBy: { id: actor.id, name: actor.name }, confirmedAt: now, history: [],
      });
      await logAudit({
        userId: actor.id, userName: actor.name, action: "INITIAL_UNITS_PURCHASED",
        details: `Initial unit purchase confirmed for ${p.fundName} on policy ${policy.id}`,
        metadata: { policyId: policy.id, fundId: p.fundId, purchaseDate: date, investmentAmount: p.approvedAmount, unitPrice: p.unitPrice,
          units: storedUnits(p.estimatedUnits), closingBalance: p.closingBalance, valuationId: p.valuationId, valuationRevision: p.valuationRevision }, req,
      });
      res.status(201).json(view(record.toObject ? record.toObject() : record));
    } catch (e) {
      if (e?.code === 11000) return res.status(409).json({ code: "ALREADY_PURCHASED", message: "Initial units have already been purchased for this fund" });
      console.error("Initial purchase error:", e);
      res.status(500).json({ message: "Failed to record unit purchase" });
    }
  };
  return { listPurchases, confirmInitialPurchase };
}

function registerUnitPurchases({ app, mongoose, authenticateToken, ...deps }) {
  const PolicyUnitPurchase = getUnitPurchaseModel(mongoose);
  const h = createUnitPurchaseHandlers({ PolicyUnitPurchase, ...deps,
    toDecimal: (v) => mongoose.Types.Decimal128.fromString(String(v)), isValidId: (id) => mongoose.Types.ObjectId.isValid(id) });
  app.get("/api/policies/:policyId/purchases", authenticateToken, h.listPurchases);
  app.post("/api/policies/:policyId/funds/:fundId/initial-purchase", authenticateToken, h.confirmInitialPurchase);
  return { PolicyUnitPurchase };
}

module.exports = { storedUnits, getUnitPurchaseModel, createUnitPurchaseHandlers, registerUnitPurchases };
