/**
 * Stage 3: one-time "Funds Received" confirmation for approved client policies.
 * Writes ONLY to the PolicyFunding collection plus the audit log. It never touches
 * policies, allocations, net investment, valuations, unit purchases or activation.
 * Extensible: status/revision/history allow a future reason-required reversal,
 * which is intentionally NOT implemented here.
 */
const { createInvestmentGuards } = require("./investmentAccess.cjs");
const { createFundingGuard } = require("./fundingAccess.cjs");

const FUNDING_STATUSES = ["confirmed", "reversed"]; // "reversed" reserved for a future stage

function getPolicyFundingModel(mongoose) {
  if (mongoose.models.PolicyFunding) return mongoose.models.PolicyFunding;
  const historySchema = new mongoose.Schema({
    action: { type: String, required: true },
    status: { type: String, enum: FUNDING_STATUSES, required: true },
    actorId: { type: String, required: true },
    actorName: { type: String, default: "" },
    at: { type: Date, required: true },
    reason: { type: String, default: "" },
  }, { _id: false });
  const schema = new mongoose.Schema({
    policyId: { type: String, required: true, unique: true },
    status: { type: String, enum: FUNDING_STATUSES, required: true },
    confirmedBy: { type: String, required: true },
    confirmedByName: { type: String, default: "" },
    confirmedAt: { type: Date, required: true },
    revision: { type: Number, default: 1 },
    history: { type: [historySchema], default: [] },
  }, { timestamps: true });
  return mongoose.model("PolicyFunding", schema);
}

const view = (r) => r ? {
  policyId: r.policyId, status: r.status, confirmedBy: r.confirmedBy,
  confirmedByName: r.confirmedByName, confirmedAt: r.confirmedAt, revision: r.revision,
} : { status: "awaiting" };

function createFundingConfirmationHandlers({ PolicyFunding, User, Organisation, requireRootOrgAccess, getPolicy, logAudit }) {
  const { requireInvestmentPolicyAccess } = createInvestmentGuards({ User, Organisation, requireRootOrgAccess, getPolicy });
  const { requireFundingManager } = createFundingGuard({ User, Organisation });

  const getFunding = async (req, res) => {
    const access = await requireInvestmentPolicyAccess(req, res);
    if (!access) return;
    try {
      const record = await PolicyFunding.findOne({ policyId: access.policy.id }).lean();
      res.json({ ...view(record), canConfirm: !record && access.permissions.canAuthoriseInvestmentTransactions === true });
    } catch (e) {
      console.error("Funding status error:", e);
      res.status(500).json({ message: "Failed to load funding status" });
    }
  };

  const confirmFunding = async (req, res) => {
    const actor = await requireFundingManager(req, res);
    if (!actor) return;
    const access = await requireInvestmentPolicyAccess(req, res);
    if (!access) return;
    if (req.body?.confirmed !== true) {
      return res.status(400).json({ message: "Tick the confirmation that the client's investment funds have been received" });
    }
    const now = new Date();
    try {
      const record = await PolicyFunding.create({
        policyId: access.policy.id, status: "confirmed",
        confirmedBy: actor.id, confirmedByName: actor.name, confirmedAt: now, revision: 1,
        history: [{ action: "CONFIRMED", status: "confirmed", actorId: actor.id, actorName: actor.name, at: now, reason: "" }],
      });
      await logAudit({
        userId: actor.id, userName: actor.name, action: "FUNDS_CONFIRMED",
        details: `Funds received confirmed for policy ${access.policy.id}`,
        metadata: { policyId: access.policy.id, confirmedAt: now.toISOString() }, req,
      });
      res.status(201).json(view(record.toObject ? record.toObject() : record));
    } catch (e) {
      if (e?.code === 11000) return res.status(409).json({ message: "Funds have already been confirmed for this policy" });
      console.error("Funding confirmation error:", e);
      res.status(500).json({ message: "Failed to confirm funds" });
    }
  };

  return { getFunding, confirmFunding };
}

function registerFundingConfirmation({ app, mongoose, authenticateToken, ...deps }) {
  const PolicyFunding = getPolicyFundingModel(mongoose);
  const { getFunding, confirmFunding } = createFundingConfirmationHandlers({ PolicyFunding, ...deps });
  app.get("/api/policies/:policyId/funding", authenticateToken, getFunding);
  app.post("/api/policies/:policyId/funding/confirm", authenticateToken, confirmFunding);
  return { PolicyFunding };
}

module.exports = { FUNDING_STATUSES, getPolicyFundingModel, createFundingConfirmationHandlers, registerFundingConfirmation };
