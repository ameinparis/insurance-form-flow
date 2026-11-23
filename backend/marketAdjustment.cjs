/**
 * Phase 3B: Market Price Adjustment per policy fund.
 * Writes ONLY the immutable PolicyMarketAdjustment collection plus the audit log.
 * Never changes units, purchases, allocations, valuations, funding or policies.
 * Adjustment = Units Held × (New Price − Previous Price); New Closing = Previous Closing + Adjustment.
 * Prices come only from the valuation recorded for the exact selected date.
 */
const { createInvestmentGuards } = require("./investmentAccess.cjs");
const { createFundingGuard } = require("./fundingAccess.cjs");
const { validateDate } = require("./fundValuations.cjs");
const Decimal = require("decimal.js").clone({ precision: 80, rounding: 4 });

const full = (v) => new Decimal(String(v)).toSignificantDigits(34).toFixed();
const str = (v) => (v == null ? "" : v.toString());
const fail = (status, code, message) => ({ error: { status, code, message } });

function getMarketAdjustmentModel(mongoose) {
  if (mongoose.models.PolicyMarketAdjustment) return mongoose.models.PolicyMarketAdjustment;
  const D = mongoose.Schema.Types.Decimal128;
  const schema = new mongoose.Schema({
    policyId: { type: String, required: true }, fundId: { type: String, required: true },
    sequence: { type: Number, required: true }, valuationDate: { type: String, required: true },
    unitsHeld: { type: D, required: true }, previousUnitPrice: { type: D, required: true }, newUnitPrice: { type: D, required: true },
    adjustment: { type: D, required: true }, previousClosingBalance: { type: D, required: true }, newClosingBalance: { type: D, required: true },
    previousDate: { type: String, required: true }, purchaseId: { type: String, default: "" },
    valuationId: { type: String, required: true }, valuationRevision: { type: Number, required: true },
    authorisedBy: { id: { type: String, required: true }, name: { type: String, default: "" } },
    confirmedAt: { type: Date, required: true },
    history: { type: [mongoose.Schema.Types.Mixed], default: [] },
  }, { timestamps: true });
  schema.index({ policyId: 1, fundId: 1, valuationDate: 1 }, { unique: true });
  // Sequence uniqueness makes concurrent confirmations built on the same prior row fail safely.
  schema.index({ policyId: 1, fundId: 1, sequence: 1 }, { unique: true });
  return mongoose.model("PolicyMarketAdjustment", schema);
}

const view = (r) => ({
  policyId: r.policyId, fundId: r.fundId, sequence: r.sequence, valuationDate: r.valuationDate,
  unitsHeld: str(r.unitsHeld), previousUnitPrice: str(r.previousUnitPrice), newUnitPrice: str(r.newUnitPrice),
  adjustment: str(r.adjustment), previousClosingBalance: str(r.previousClosingBalance), newClosingBalance: str(r.newClosingBalance),
  previousDate: r.previousDate, valuationId: r.valuationId, valuationRevision: r.valuationRevision,
  authorisedBy: r.authorisedBy, confirmedAt: r.confirmedAt,
});

/** Pure formula on decimal strings. */
function marketAdjustment(unitsHeld, previousPrice, newPrice, previousClosing) {
  const adj = new Decimal(unitsHeld).times(new Decimal(newPrice).minus(previousPrice));
  return { adjustment: full(adj), newClosingBalance: full(new Decimal(previousClosing).plus(adj)) };
}

/** Shared read-only resolution for preview and confirmation. */
async function computeMarketAdjustment({ policy, fundId, date, PolicyFunding, PolicyUnitPurchase, PolicyMarketAdjustment, Valuation }) {
  if (!["APPROVED", "ACTIVE"].includes(String(policy.status || "").toUpperCase())) return fail(409, "NOT_APPROVED", "Adjustments are only available for approved or active policies");
  const funding = await PolicyFunding.findOne({ policyId: policy.id }).lean();
  if (funding?.status !== "confirmed") return fail(409, "FUNDING_NOT_CONFIRMED", "Funds must be confirmed first");
  const fid = String(fundId);
  const purchase = await PolicyUnitPurchase.findOne({ policyId: policy.id, fundId: fid, type: "INITIAL" }).lean();
  if (!purchase) return fail(409, "NO_PURCHASE", "Initial units must be purchased before a market adjustment");
  const adjustments = (await PolicyMarketAdjustment.find({ policyId: policy.id, fundId: fid }).lean())
    .sort((a, b) => a.sequence - b.sequence);
  const last = adjustments[adjustments.length - 1];
  const prior = last
    ? { date: last.valuationDate, price: str(last.newUnitPrice), balance: str(last.newClosingBalance), sequence: last.sequence }
    : { date: purchase.purchaseDate, price: str(purchase.unitPrice), balance: str(purchase.closingBalance), sequence: 0 };
  if (adjustments.some((a) => a.valuationDate === date)) return fail(409, "DUPLICATE_ADJUSTMENT", `A market adjustment already exists for ${date}`);
  if (date <= prior.date) return fail(409, "OUT_OF_ORDER", `Select a valuation date after the latest transaction (${prior.date})`);
  const valuation = await Valuation.findOne({ fundId: fid, valuationDate: date }).lean();
  if (!valuation) return fail(404, "PRICE_NOT_FOUND", `No unit price recorded for this fund on ${date}. Record it in Investment Managers first.`);
  const unitsHeld = str(purchase.units);
  const newUnitPrice = full(str(valuation.unitPrice));
  const m = marketAdjustment(unitsHeld, prior.price, newUnitPrice, prior.balance);
  return { result: {
    policyId: policy.id, fundId: fid, valuationDate: date, previousDate: prior.date, sequence: prior.sequence + 1,
    unitsHeld, previousUnitPrice: full(prior.price), newUnitPrice, previousClosingBalance: full(prior.balance), ...m,
    valuationId: String(valuation._id), valuationRevision: valuation.revision, purchaseId: String(purchase._id || ""),
  } };
}

function createMarketAdjustmentHandlers({ PolicyMarketAdjustment, PolicyUnitPurchase, toDecimal = (v) => v, User, Organisation, requireRootOrgAccess, getPolicy, PolicyFunding, Valuation, logAudit }) {
  const { requireInvestmentPolicyAccess } = createInvestmentGuards({ User, Organisation, requireRootOrgAccess, getPolicy });
  const { requireFundingManager } = createFundingGuard({ User, Organisation });
  const deps = { PolicyFunding, PolicyUnitPurchase, PolicyMarketAdjustment, Valuation };

  const list = async (req, res) => {
    const access = await requireInvestmentPolicyAccess(req, res); if (!access) return;
    try { res.json((await PolicyMarketAdjustment.find({ policyId: access.policy.id }).lean()).map(view)); }
    catch (e) { console.error("Adjustment list error:", e); res.status(500).json({ message: "Failed to load market adjustments" }); }
  };

  const preview = async (req, res) => {
    const actor = await requireFundingManager(req, res); if (!actor) return;
    const access = await requireInvestmentPolicyAccess(req, res); if (!access) return;
    let date;
    try { date = validateDate(req.query?.date); } catch { return res.status(400).json({ code: "INVALID_DATE", message: "Select a valid valuation date" }); }
    try {
      const r = await computeMarketAdjustment({ policy: access.policy, fundId: req.params.fundId, date, ...deps });
      if (r.error) return res.status(r.error.status).json({ code: r.error.code, message: r.error.message });
      res.json({ status: "PREVIEW", ...r.result });
    } catch (e) { console.error("Adjustment preview error:", e); res.status(500).json({ message: "Could not prepare adjustment preview" }); }
  };

  const confirm = async (req, res) => {
    const actor = await requireFundingManager(req, res); if (!actor) return;
    const access = await requireInvestmentPolicyAccess(req, res); if (!access) return;
    const b = req.body || {};
    if (b.confirmed !== true) return res.status(400).json({ code: "NOT_CONFIRMED", message: "Tick the confirmation before recording the adjustment" });
    let date;
    try { date = validateDate(b.valuationDate); } catch { return res.status(400).json({ code: "INVALID_DATE", message: "Select a valid valuation date" }); }
    try {
      const policy = access.policy;
      const r = await computeMarketAdjustment({ policy, fundId: req.params.fundId, date, ...deps });
      if (r.error) return res.status(r.error.status).json({ code: r.error.code, message: r.error.message });
      const p = r.result;
      const same = (k) => String(b[k]) === String(p[k]);
      if (!["previousUnitPrice", "newUnitPrice", "previousClosingBalance", "unitsHeld", "valuationId", "previousDate"].every(same) || Number(b.valuationRevision) !== p.valuationRevision) {
        return res.status(409).json({ code: "PREVIEW_STALE", message: "Prices, balance or holdings changed since the preview. Preview again before confirming." });
      }
      const D = (k) => toDecimal(p[k]);
      const record = await PolicyMarketAdjustment.create({
        policyId: policy.id, fundId: p.fundId, sequence: p.sequence, valuationDate: date, previousDate: p.previousDate,
        unitsHeld: D("unitsHeld"), previousUnitPrice: D("previousUnitPrice"), newUnitPrice: D("newUnitPrice"), adjustment: D("adjustment"),
        previousClosingBalance: D("previousClosingBalance"), newClosingBalance: D("newClosingBalance"), purchaseId: p.purchaseId,
        valuationId: p.valuationId, valuationRevision: p.valuationRevision,
        authorisedBy: { id: actor.id, name: actor.name }, confirmedAt: new Date(), history: [],
      });
      await logAudit({
        userId: actor.id, userName: actor.name, action: "MARKET_PRICE_ADJUSTMENT_RECORDED",
        details: `Market price adjustment on ${date} recorded for fund ${p.fundId} on policy ${policy.id}`,
        metadata: { policyId: policy.id, fundId: p.fundId, valuationDate: date, unitsHeld: p.unitsHeld, previousUnitPrice: p.previousUnitPrice,
          newUnitPrice: p.newUnitPrice, adjustment: p.adjustment, previousClosingBalance: p.previousClosingBalance,
          newClosingBalance: p.newClosingBalance, valuationId: p.valuationId, valuationRevision: p.valuationRevision }, req,
      });
      res.status(201).json(view(record.toObject ? record.toObject() : record));
    } catch (e) {
      if (e?.code === 11000) return res.status(409).json({ code: "DUPLICATE_ADJUSTMENT", message: "Another adjustment was recorded first. Preview again." });
      console.error("Adjustment confirm error:", e); res.status(500).json({ message: "Failed to record market adjustment" });
    }
  };
  return { list, preview, confirm };
}

function registerMarketAdjustments({ app, mongoose, authenticateToken, PolicyUnitPurchase, ...deps }) {
  const PolicyMarketAdjustment = getMarketAdjustmentModel(mongoose);
  const h = createMarketAdjustmentHandlers({ PolicyMarketAdjustment, PolicyUnitPurchase, ...deps,
    toDecimal: (v) => mongoose.Types.Decimal128.fromString(String(v)) });
  app.get("/api/policies/:policyId/market-adjustments", authenticateToken, h.list);
  app.get("/api/policies/:policyId/funds/:fundId/market-adjustment-preview", authenticateToken, h.preview);
  app.post("/api/policies/:policyId/funds/:fundId/market-adjustments", authenticateToken, h.confirm);
  return { PolicyMarketAdjustment };
}

module.exports = { marketAdjustment, computeMarketAdjustment, getMarketAdjustmentModel, createMarketAdjustmentHandlers, registerMarketAdjustments };
