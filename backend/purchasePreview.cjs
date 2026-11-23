/**
 * Read-only Initial Unit Purchase Preview. Writes NOTHING: no policy, funding,
 * valuation, purchase, activation or audit writes. Works for any fund/policy.
 * Units = approved fund amount (saved snapshot) ÷ price recorded for EXACTLY the chosen date.
 */
const { createInvestmentGuards } = require("./investmentAccess.cjs");
const { createFundingGuard } = require("./fundingAccess.cjs");
const { validateDate } = require("./fundValuations.cjs");
const Decimal = require("decimal.js").clone({ precision: 80, rounding: 4 /* ROUND_HALF_UP */ });
const { previewInitialUnits, readApprovedActivationInput } = require("./investmentPreview.cjs");

const fail = (status, code, message) => ({ error: { status, code, message } });

/** Shared read-only resolution used by both preview and confirmation (no writes). */
async function computeInitialPurchase({ policy, fundId, date, PolicyFunding, AssetManagerFund, Valuation, isValidId = () => true }) {
  if (!["APPROVED", "ACTIVE"].includes(String(policy.status || "").toUpperCase())) return fail(409, "NOT_APPROVED", "Purchases are only available for approved or active policies");
  const funding = await PolicyFunding.findOne({ policyId: policy.id }).lean();
  if (funding?.status !== "confirmed") return fail(409, "FUNDING_NOT_CONFIRMED", "Funds must be confirmed before a unit purchase");
  let selected = [];
  try { selected = JSON.parse(policy.form?.selectedFunds || "[]"); } catch { selected = []; }
  const ids = (Array.isArray(selected) ? selected : []).map((f) => String(f?.id || "")).filter(isValidId);
  const funds = ids.length ? await AssetManagerFund.find({ _id: { $in: ids } }).select("_id assetManagerId").lean() : [];
  const identities = funds.map((f) => ({ id: String(f._id), assetManagerId: String(f.assetManagerId) }));
  let input;
  try { input = readApprovedActivationInput(policy, identities); }
  catch (e) { return fail(422, "SNAPSHOT_REVIEW", e.message); }
  const fund = input.funds.find((f) => f.fundId === String(fundId));
  if (!fund) return fail(404, "FUND_NOT_IN_POLICY", "This fund is not part of the approved policy allocation");
  const valuation = await Valuation.findOne({ fundId: fund.fundId, valuationDate: date }).lean();
  if (!valuation) return fail(404, "PRICE_NOT_FOUND", `No unit price recorded for this fund on ${date}. Record it in Investment Managers first.`);
  const preview = previewInitialUnits(fund.approvedAmount, valuation.unitPrice.toString());
  const closingBalance = new Decimal(preview.unitsPreview).times(preview.appliedPrice).toFixed(2);
  return { result: {
    policyId: policy.id, fundId: fund.fundId, fundName: fund.fundName,
    assetManagerName: fund.assetManagerName, approvedPercent: fund.approvedPercent, purchaseDate: date,
    approvedAmount: preview.approvedAmount, unitPrice: preview.appliedPrice, valuationDate: valuation.valuationDate,
    valuationId: String(valuation._id), valuationRevision: valuation.revision,
    estimatedUnits: preview.unitsPreview, displayedUnits: preview.displayedUnits, closingBalance, inputHash: input.provenance.inputHash,
  } };
}

function createPurchasePreviewHandler({ User, Organisation, requireRootOrgAccess, getPolicy, PolicyFunding, AssetManagerFund, Valuation, isValidId = () => true }) {
  const { requireInvestmentPolicyAccess } = createInvestmentGuards({ User, Organisation, requireRootOrgAccess, getPolicy });
  const { requireFundingManager } = createFundingGuard({ User, Organisation });

  return async (req, res) => {
    const actor = await requireFundingManager(req, res); if (!actor) return;
    const access = await requireInvestmentPolicyAccess(req, res); if (!access) return;
    let date;
    try { date = validateDate(req.query?.date); } catch { return res.status(400).json({ code: "INVALID_DATE", message: "Select a valid purchase date" }); }
    try {
      const r = await computeInitialPurchase({ policy: access.policy, fundId: req.params.fundId, date, PolicyFunding, AssetManagerFund, Valuation, isValidId });
      if (r.error) return res.status(r.error.status).json({ code: r.error.code, message: r.error.message });
      res.json({ status: "PREVIEW_NOT_ACTIVATED", ...r.result });
    } catch (e) {
      console.error("Purchase preview error:", e);
      res.status(500).json({ message: "Could not prepare purchase preview" });
    }
  };
}

function registerPurchasePreview({ app, authenticateToken, mongoose, ...deps }) {
  const handler = createPurchasePreviewHandler({ ...deps, isValidId: (id) => mongoose.Types.ObjectId.isValid(id) });
  app.get("/api/policies/:policyId/funds/:fundId/purchase-preview", authenticateToken, handler);
}

module.exports = { computeInitialPurchase, createPurchasePreviewHandler, registerPurchasePreview };
