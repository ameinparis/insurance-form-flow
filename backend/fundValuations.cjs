const PRICE = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;
function validatePrice(value) {
  if (typeof value !== "string" || value.length > 35 || !PRICE.test(value) || value.replace(".", "").length > 34 || BigInt(value.replace(".", "")) === 0n)
    throw new Error("Unit price must be a positive decimal with up to 6 decimal places");
  return value;
}
function validateDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)
    throw new Error("A valid valuation date is required");
  return value;
}
const text = (value, max = 2000) => typeof value === "string" ? value.trim().slice(0, max) : "";

function registerFundValuations({ app, mongoose, authenticateToken, requireRootOrgAccess, User, AssetManager, AssetManagerFund, getPolicy }) {
  const revisionSchema = new mongoose.Schema({
    revision: Number, previousPrice: { type: mongoose.Schema.Types.Decimal128, default: null },
    replacementPrice: { type: mongoose.Schema.Types.Decimal128, required: true },
    reason: String, source: String, notes: String,
    administratorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    administratorName: String, recordedAt: { type: Date, required: true },
  }, { _id: false });
  const schema = new mongoose.Schema({
    fundId: { type: mongoose.Schema.Types.ObjectId, ref: "AssetManagerFund", required: true },
    assetManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "AssetManager", required: true },
    fundName: String, assetManagerName: String,
    valuationDate: { type: String, required: true },
    unitPrice: { type: mongoose.Schema.Types.Decimal128, required: true },
    source: String, notes: String, revision: { type: Number, required: true, default: 1 },
    history: { type: [revisionSchema], required: true },
  }, { timestamps: true });
  schema.index({ fundId: 1, valuationDate: 1 }, { unique: true });
  const Valuation = mongoose.models.FundValuation || mongoose.model("FundValuation", schema);
  let indexReady;
  const ensureIndex = () => {
    if (!indexReady) indexReady = Valuation.createIndexes().catch((error) => { indexReady = undefined; throw error; });
    return indexReady;
  };
  const serialize = (entry) => ({ ...entry, unitPrice: entry.unitPrice.toString(),
    history: entry.history.map((item) => ({ ...item, previousPrice: item.previousPrice?.toString() || null,
      replacementPrice: item.replacementPrice.toString() })) });
  const authorize = async (req, res) => {
    const user = await User.findById(req.user.userId).select("role firstName lastName email organisationId").lean();
    if (!user) { res.status(401).json({ message: "User not found" }); return null; }
    if (!["admin", "superuser"].includes(user.role)) { res.status(403).json({ message: "Only authorised administrators may manage valuations" }); return null; }
    if (!await requireRootOrgAccess(req, res)) return null;
    return { id: req.user.userId, name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email };
  };
  const fundFor = async (req, res) => {
    for (const key of ["managerId", "fundId", ...(req.params.valuationId ? ["valuationId"] : [])]) {
      if (!mongoose.Types.ObjectId.isValid(req.params[key])) { res.status(400).json({ message: "Invalid ID format" }); return null; }
    }
    const fund = await AssetManagerFund.findOne({ _id: req.params.fundId, assetManagerId: req.params.managerId }).lean();
    const manager = await AssetManager.findById(req.params.managerId).lean();
    if (!fund || !manager) { res.status(404).json({ message: "Fund not found under this asset manager" }); return null; }
    return { fund, manager };
  };
  const fail = (res, error) => res.status(error.code === 11000 ? 409 : error.validation ? 400 : 500)
    .json({ message: error.code === 11000 ? "A valuation already exists for this fund and date. Use Correct Valuation instead." : error.validation ? error.message : "Could not complete valuation operation" });
  const input = (body, correction = false) => {
    try {
      const unitPrice = validatePrice(body.unitPrice);
      const valuationDate = correction ? undefined : validateDate(body.valuationDate);
      const reason = text(body.reason);
      if (correction && !reason) throw new Error("A correction reason is required");
      if (correction && (!Number.isInteger(body.revision) || body.revision < 1)) throw new Error("A valid valuation revision is required");
      return { unitPrice: mongoose.Types.Decimal128.fromString(unitPrice), valuationDate, reason,
        source: text(body.source, 500), notes: text(body.notes) };
    } catch (error) { error.validation = true; throw error; }
  };
  const base = "/api/asset-managers/:managerId/funds/:fundId";
  app.get(base, authenticateToken, async (req, res) => {
    try {
      if (!await authorize(req, res)) return;
      const records = await fundFor(req, res); if (!records) return;
      const valuations = await Valuation.find({ fundId: req.params.fundId }).sort({ valuationDate: -1 }).lean();
      res.json({ fund: records.fund, assetManager: records.manager, valuations: valuations.map(serialize) });
    } catch (error) { fail(res, error); }
  });
  app.post(`${base}/valuations`, authenticateToken, async (req, res) => {
    try {
      const actor = await authorize(req, res); if (!actor) return;
      const records = await fundFor(req, res); if (!records) return;
      const values = input(req.body || {});
      await ensureIndex();
      const recordedAt = new Date();
      const saved = await Valuation.create({ fundId: records.fund._id, assetManagerId: records.manager._id,
        fundName: records.fund.name, assetManagerName: records.manager.name,
        valuationDate: values.valuationDate, unitPrice: values.unitPrice, source: values.source, notes: values.notes, revision: 1,
        history: [{ revision: 1, previousPrice: null, replacementPrice: values.unitPrice, reason: "",
          source: values.source, notes: values.notes, administratorId: actor.id, administratorName: actor.name, recordedAt }] });
      res.status(201).json(serialize(saved.toObject()));
    } catch (error) { fail(res, error); }
  });
  app.patch(`${base}/valuations/:valuationId`, authenticateToken, async (req, res) => {
    try {
      const actor = await authorize(req, res); if (!actor) return;
      if (!await fundFor(req, res)) return;
      const values = input(req.body || {}, true);
      const query = { _id: req.params.valuationId, fundId: req.params.fundId, assetManagerId: req.params.managerId };
      const previous = await Valuation.findOne(query).lean();
      if (!previous) return res.status(404).json({ message: "Valuation not found" });
      if (previous.revision !== req.body.revision) return res.status(409).json({ message: "This valuation was corrected by another administrator. Reload and try again." });
      const saved = await Valuation.findOneAndUpdate({ ...query, revision: req.body.revision }, {
        $set: { unitPrice: values.unitPrice, source: values.source, notes: values.notes }, $inc: { revision: 1 },
        $push: { history: { revision: previous.revision + 1, previousPrice: previous.unitPrice,
          replacementPrice: values.unitPrice, reason: values.reason, source: values.source, notes: values.notes,
          administratorId: actor.id, administratorName: actor.name, recordedAt: new Date() } },
      }, { new: true, runValidators: true }).lean();
      if (!saved) return res.status(409).json({ message: "This valuation was corrected by another administrator. Reload and try again." });
      res.json(serialize(saved));
    } catch (error) { fail(res, error); }
  });

  // Historical financial relationships must outlive catalogue administration.
  const hasRelationships = async (fundIds) => {
    if (!fundIds.length) return false;
    if (await Valuation.exists({ fundId: { $in: fundIds } })) return true;
    const Purchase = mongoose.models.PolicyUnitPurchase;
    if (Purchase && await Purchase.exists({ fundId: { $in: fundIds.map(String) } })) return true;
    const Adjustment = mongoose.models.PolicyMarketAdjustment;
    if (Adjustment && await Adjustment.exists({ fundId: { $in: fundIds.map(String) } })) return true;
    const Batch = mongoose.models.PolicyMonthlyBatch;
    if (Batch && await Batch.exists({ fundId: { $in: fundIds.map(String) } })) return true;
    const ids = new Set(fundIds.map(String));
    const policies = await getPolicy().find({}).select("form fundAllocations").lean();
    return policies.some((policy) => {
      if (policy.fundAllocations?.some((entry) => ids.has(String(entry.fundId)))) return true;
      const form = policy.form || {};
      try { if (Object.keys(JSON.parse(form.portfolioAllocations || "{}")).some((id) => ids.has(id))) return true; } catch { /* legacy */ }
      try { if (JSON.parse(form.selectedFunds || "[]").some((fund) => ids.has(String(fund.id)))) return true; } catch { /* legacy */ }
      return false;
    });
  };
  const protectDeletion = (manager) => async (req, res, next) => {
    try {
      if (!await authorize(req, res)) return;
      const id = manager ? req.params.id : req.params.fundId;
      if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid ID format" });
      const funds = manager ? await AssetManagerFund.find({ assetManagerId: id }).select("_id").lean() : [{ _id: id }];
      if (await hasRelationships(funds.map((fund) => fund._id))) return res.status(409).json({ message: "This record has valuation history or policy relationships. Set its status to Inactive instead of deleting it." });
      next();
    } catch (error) { fail(res, error); }
  };
  return { protectFundDeletion: protectDeletion(false), protectManagerDeletion: protectDeletion(true), Valuation };
}
module.exports = { registerFundValuations, validatePrice, validateDate };