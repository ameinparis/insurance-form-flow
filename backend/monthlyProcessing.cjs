/**
 * Phase 3C: Monthly Portfolio Processing per policy fund.
 * One immutable PolicyMonthlyBatch holds three rows (market adjustment, funeral premium,
 * administration fee) so no partial batch can exist. Writes ONLY that collection + audit log.
 * Never changes units, purchases, valuations, funding, allocations or policies.
 * Money is rounded half-up to cents at each step; units and prices keep full precision.
 */
const crypto = require("node:crypto");
const { createInvestmentGuards } = require("./investmentAccess.cjs");
const { createFundingGuard } = require("./fundingAccess.cjs");
const { validateDate } = require("./fundValuations.cjs");
const Decimal = require("decimal.js").clone({ precision: 80, rounding: 4 });

const full = (v) => new Decimal(String(v)).toSignificantDigits(34).toFixed();
const r2 = (v) => new Decimal(String(v)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
const str = (v) => (v == null ? "" : v.toString());
const fail = (status, code, message) => ({ error: { status, code, message } });
const DEC = /^\d+(\.\d+)?$/;

/** Pure monthly calculation on decimal strings. Returns 2dp money strings. */
function monthlyCalculation({ unitsHeld, previousUnitPrice, newUnitPrice, previousClosingBalance, funeralPremium, allocationPercent, adminFeePercent }) {
  const ma = r2(new Decimal(unitsHeld).times(new Decimal(newUnitPrice).minus(previousUnitPrice)));
  const cb1 = r2(new Decimal(previousClosingBalance).plus(ma));
  const fp = r2(new Decimal(funeralPremium).times(allocationPercent).div(100));
  const cb2 = cb1.minus(fp);
  const af = r2(cb1.times(adminFeePercent).div(100));
  const cb3 = cb2.minus(af);
  return {
    marketAdjustment: ma.toFixed(2), closingBalance1: cb1.toFixed(2),
    funeralPremium: fp.negated().toFixed(2), closingBalance2: cb2.toFixed(2),
    administrationFee: af.negated().toFixed(2), closingBalance3: cb3.toFixed(2),
  };
}

function getMonthlyBatchModel(mongoose) {
  if (mongoose.models.PolicyMonthlyBatch) return mongoose.models.PolicyMonthlyBatch;
  const D = mongoose.Schema.Types.Decimal128;
  const row = new mongoose.Schema({ type: { type: String, required: true }, description: { type: String, required: true },
    movement: { type: D, required: true }, closingBalance: { type: D, required: true } }, { _id: false });
  const schema = new mongoose.Schema({
    policyId: { type: String, required: true }, fundId: { type: String, required: true },
    sequence: { type: Number, required: true }, valuationDate: { type: String, required: true },
    previousDate: { type: String, required: true }, previousTransaction: { type: String, required: true },
    unitsHeld: { type: D, required: true }, previousUnitPrice: { type: D, required: true }, newUnitPrice: { type: D, required: true },
    previousClosingBalance: { type: D, required: true },
    funeralPremium: { type: D, required: true }, allocationPercent: { type: D, required: true }, adminFeePercent: { type: D, required: true },
    rows: { type: [row], required: true, validate: (v) => v.length === 3 },
    valuationId: { type: String, required: true }, valuationRevision: { type: Number, required: true },
    purchaseId: { type: String, default: "" }, inputHash: { type: String, required: true },
    authorisedBy: { id: { type: String, required: true }, name: { type: String, default: "" } },
    confirmedAt: { type: Date, required: true },
    history: { type: [mongoose.Schema.Types.Mixed], default: [] },
  }, { timestamps: true });
  schema.index({ policyId: 1, fundId: 1, valuationDate: 1 }, { unique: true });
  schema.index({ policyId: 1, fundId: 1, sequence: 1 }, { unique: true });
  return mongoose.model("PolicyMonthlyBatch", schema);
}

const view = (b) => ({
  policyId: b.policyId, fundId: b.fundId, sequence: b.sequence, valuationDate: b.valuationDate, previousDate: b.previousDate,
  unitsHeld: str(b.unitsHeld), previousUnitPrice: str(b.previousUnitPrice), newUnitPrice: str(b.newUnitPrice),
  previousClosingBalance: str(b.previousClosingBalance), funeralPremium: str(b.funeralPremium),
  allocationPercent: str(b.allocationPercent), adminFeePercent: str(b.adminFeePercent),
  rows: (b.rows || []).map((r) => ({ type: r.type, description: r.description, movement: str(r.movement), closingBalance: str(r.closingBalance) })),
  valuationId: b.valuationId, valuationRevision: b.valuationRevision, authorisedBy: b.authorisedBy, confirmedAt: b.confirmedAt,
});

async function computeMonthlyBatch({ policy, fundId, date, PolicyFunding, PolicyUnitPurchase, PolicyMarketAdjustment, PolicyMonthlyBatch, Valuation, AssetManagerFund, FeeConfig }) {
  if (!["APPROVED", "ACTIVE"].includes(String(policy.status || "").toUpperCase())) return fail(409, "NOT_APPROVED", "Monthly processing is only available for approved or active policies");
  const funding = await PolicyFunding.findOne({ policyId: policy.id }).lean();
  if (funding?.status !== "confirmed") return fail(409, "FUNDING_NOT_CONFIRMED", "Funds must be confirmed first");
  const fid = String(fundId);
  const purchase = await PolicyUnitPurchase.findOne({ policyId: policy.id, fundId: fid, type: "INITIAL" }).lean();
  if (!purchase) return fail(409, "NO_PURCHASE", "Initial units must be purchased before monthly processing");

  // Prior state = latest stored transaction (purchase, legacy adjustment or monthly batch).
  const legacy = PolicyMarketAdjustment ? await PolicyMarketAdjustment.find({ policyId: policy.id, fundId: fid }).lean() : [];
  const batches = await PolicyMonthlyBatch.find({ policyId: policy.id, fundId: fid }).lean();
  const candidates = [
    { date: purchase.purchaseDate, price: str(purchase.unitPrice), balance: str(purchase.closingBalance), sequence: 0, ref: `purchase:${purchase._id}` },
    ...legacy.map((a) => ({ date: a.valuationDate, price: str(a.newUnitPrice), balance: str(a.newClosingBalance), sequence: a.sequence, ref: `adjustment:${a._id || a.sequence}` })),
    ...batches.map((b) => ({ date: b.valuationDate, price: str(b.newUnitPrice), balance: str(b.rows[2].closingBalance), sequence: b.sequence, ref: `batch:${b._id || b.sequence}` })),
  ].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.sequence - b.sequence));
  const prior = candidates[candidates.length - 1];
  const nextSequence = Math.max(0, ...legacy.map((a) => a.sequence), ...batches.map((b) => b.sequence)) + 1;
  if (batches.some((b) => b.valuationDate === date)) return fail(409, "DUPLICATE_BATCH", `Monthly processing already exists for ${date}`);
  if (date <= prior.date) return fail(409, "OUT_OF_ORDER", `Select a valuation date after the latest transaction (${prior.date})`);

  const valuation = await Valuation.findOne({ fundId: fid, valuationDate: date }).lean();
  if (!valuation) return fail(404, "PRICE_NOT_FOUND", `No unit price recorded for this fund on ${date}. Record it in Investment Managers first.`);

  const form = policy.form || {};
  const premiumRaw = String(form.funeralPremium ?? "").replace(/,/g, "").trim();
  if (!DEC.test(premiumRaw)) return fail(422, "FUNERAL_PREMIUM_MISSING", "Funeral premium not configured for this policy");
  let allocations = {};
  try { allocations = JSON.parse(form.portfolioAllocations || "{}"); } catch { allocations = {}; }
  const allocRaw = String(allocations?.[fid] ?? "").trim();
  if (!DEC.test(allocRaw) || new Decimal(allocRaw).gt(100)) return fail(422, "ALLOCATION_MISSING", "Approved allocation for this fund could not be read from the policy");
  let feeRaw = "";
  if (FeeConfig) {
    const feeConfig = await FeeConfig.findOne({ key: "global" }).lean();
    feeRaw = String(feeConfig?.administrationFeePct ?? "").trim();
  } else if (AssetManagerFund) {
    const fund = await AssetManagerFund.findById(fid).select("monthlyAdminFeePct").lean();
    feeRaw = String(fund?.monthlyAdminFeePct ?? "").trim();
  }
  if (!DEC.test(feeRaw)) return fail(422, "ADMIN_FEE_MISSING", "Administration fee not configured for this fund");

  const inputs = {
    unitsHeld: str(purchase.units), previousUnitPrice: full(prior.price), newUnitPrice: full(str(valuation.unitPrice)),
    previousClosingBalance: r2(prior.balance).toFixed(2), funeralPremium: full(premiumRaw),
    allocationPercent: full(allocRaw), adminFeePercent: full(feeRaw),
  };
  const calc = monthlyCalculation(inputs);
  const hashSource = { ...inputs, policyId: policy.id, fundId: fid, date, previousTransaction: prior.ref,
    valuationId: String(valuation._id), valuationRevision: valuation.revision };
  const inputHash = crypto.createHash("sha256").update(JSON.stringify(hashSource)).digest("hex");
  return { result: {
    policyId: policy.id, fundId: fid, valuationDate: date, previousDate: prior.date, previousTransaction: prior.ref,
    sequence: nextSequence, ...inputs,
    rows: [
      { type: "MARKET_ADJUSTMENT", description: "Market Price Adjustment", movement: calc.marketAdjustment, closingBalance: calc.closingBalance1 },
      { type: "FUNERAL_PREMIUM", description: "Funeral Cover Premium", movement: calc.funeralPremium, closingBalance: calc.closingBalance2 },
      { type: "ADMIN_FEE", description: "Administration Fee", movement: calc.administrationFee, closingBalance: calc.closingBalance3 },
    ],
    valuationId: String(valuation._id), valuationRevision: valuation.revision, purchaseId: String(purchase._id || ""), inputHash,
  } };
}

function createMonthlyProcessingHandlers({ PolicyMonthlyBatch, PolicyMarketAdjustment, PolicyUnitPurchase, AssetManagerFund, FeeConfig, toDecimal = (v) => v,
  User, Organisation, requireRootOrgAccess, getPolicy, PolicyFunding, Valuation, logAudit }) {
  const { requireInvestmentPolicyAccess } = createInvestmentGuards({ User, Organisation, requireRootOrgAccess, getPolicy });
  const { requireFundingManager } = createFundingGuard({ User, Organisation });
  const deps = { PolicyFunding, PolicyUnitPurchase, PolicyMarketAdjustment, PolicyMonthlyBatch, Valuation, AssetManagerFund, FeeConfig };
  const badDate = (res) => res.status(400).json({ code: "INVALID_DATE", message: "Select a valid valuation date" });

  const list = async (req, res) => {
    const access = await requireInvestmentPolicyAccess(req, res); if (!access) return;
    try { res.json((await PolicyMonthlyBatch.find({ policyId: access.policy.id }).lean()).map(view)); }
    catch (e) { console.error("Monthly batch list error:", e); res.status(500).json({ message: "Failed to load monthly processing" }); }
  };

  const preview = async (req, res) => {
    const actor = await requireFundingManager(req, res); if (!actor) return;
    const access = await requireInvestmentPolicyAccess(req, res); if (!access) return;
    let date; try { date = validateDate(req.query?.date); } catch { return badDate(res); }
    try {
      const r = await computeMonthlyBatch({ policy: access.policy, fundId: req.params.fundId, date, ...deps });
      if (r.error) return res.status(r.error.status).json({ code: r.error.code, message: r.error.message });
      res.json({ status: "PREVIEW", ...r.result });
    } catch (e) { console.error("Monthly preview error:", e); res.status(500).json({ message: "Could not prepare monthly processing preview" }); }
  };

  const confirm = async (req, res) => {
    const actor = await requireFundingManager(req, res); if (!actor) return;
    const access = await requireInvestmentPolicyAccess(req, res); if (!access) return;
    const b = req.body || {};
    if (b.confirmed !== true) return res.status(400).json({ code: "NOT_CONFIRMED", message: "Tick the confirmation before processing the month" });
    let date; try { date = validateDate(b.valuationDate); } catch { return badDate(res); }
    try {
      const policy = access.policy;
      const r = await computeMonthlyBatch({ policy, fundId: req.params.fundId, date, ...deps });
      if (r.error) return res.status(r.error.status).json({ code: r.error.code, message: r.error.message });
      const p = r.result;
      if (b.inputHash !== p.inputHash) return res.status(409).json({ code: "PREVIEW_STALE", message: "Prices, balances, fees or premiums changed since the preview. Preview again before confirming." });
      const D = (v) => toDecimal(v);
      const record = await PolicyMonthlyBatch.create({
        policyId: policy.id, fundId: p.fundId, sequence: p.sequence, valuationDate: date, previousDate: p.previousDate,
        previousTransaction: p.previousTransaction, unitsHeld: D(p.unitsHeld), previousUnitPrice: D(p.previousUnitPrice),
        newUnitPrice: D(p.newUnitPrice), previousClosingBalance: D(p.previousClosingBalance), funeralPremium: D(p.funeralPremium),
        allocationPercent: D(p.allocationPercent), adminFeePercent: D(p.adminFeePercent),
        rows: p.rows.map((row) => ({ ...row, movement: D(row.movement), closingBalance: D(row.closingBalance) })),
        valuationId: p.valuationId, valuationRevision: p.valuationRevision, purchaseId: p.purchaseId, inputHash: p.inputHash,
        authorisedBy: { id: actor.id, name: actor.name }, confirmedAt: new Date(), history: [],
      });
      await logAudit({
        userId: actor.id, userName: actor.name, action: "MONTHLY_PROCESSING_RECORDED",
        details: `Monthly processing on ${date} recorded for fund ${p.fundId} on policy ${policy.id}`,
        metadata: { policyId: policy.id, fundId: p.fundId, valuationDate: date, inputHash: p.inputHash, unitsHeld: p.unitsHeld,
          previousUnitPrice: p.previousUnitPrice, newUnitPrice: p.newUnitPrice, previousClosingBalance: p.previousClosingBalance,
          funeralPremium: p.funeralPremium, allocationPercent: p.allocationPercent, adminFeePercent: p.adminFeePercent,
          rows: p.rows, valuationId: p.valuationId, valuationRevision: p.valuationRevision }, req,
      });
      res.status(201).json(view(record.toObject ? record.toObject() : record));
    } catch (e) {
      if (e?.code === 11000) return res.status(409).json({ code: "DUPLICATE_BATCH", message: "Another monthly batch was recorded first. Preview again." });
      console.error("Monthly confirm error:", e); res.status(500).json({ message: "Failed to record monthly processing" });
    }
  };
  return { list, preview, confirm };
}

function registerMonthlyProcessing({ app, mongoose, authenticateToken, ...deps }) {
  const PolicyMonthlyBatch = getMonthlyBatchModel(mongoose);
  const h = createMonthlyProcessingHandlers({ PolicyMonthlyBatch, PolicyMarketAdjustment: mongoose.models.PolicyMarketAdjustment, ...deps,
    toDecimal: (v) => mongoose.Types.Decimal128.fromString(String(v)) });
  app.get("/api/policies/:policyId/monthly-batches", authenticateToken, h.list);
  app.get("/api/policies/:policyId/funds/:fundId/monthly-preview", authenticateToken, h.preview);
  app.post("/api/policies/:policyId/funds/:fundId/monthly-batches", authenticateToken, h.confirm);
  return { PolicyMonthlyBatch };
}

module.exports = { monthlyCalculation, computeMonthlyBatch, getMonthlyBatchModel, createMonthlyProcessingHandlers, registerMonthlyProcessing };
