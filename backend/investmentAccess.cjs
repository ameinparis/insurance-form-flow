/** Future investment actions only. Does not register routes or change existing access. */
const { canManageFunding } = require("./fundingAccess.cjs");

function investmentPermissionsFor(role, isRootOrganisation, hasPolicyAccess) {
  const value = String(role || "").toLowerCase().trim();
  const isSuper = value === "superuser";
  const recognised = ["superuser", "admin", "user"].includes(value);
  const scoped = recognised && (isSuper || hasPolicyAccess === true);
  const administrator = canManageFunding(value, isRootOrganisation);
  return {
    canViewInvestments: scoped,
    canSubmitInvestmentRequests: scoped && (isSuper || value === "user" || (value === "admin" && isRootOrganisation === true)),
    canAuthoriseInvestmentTransactions: scoped && administrator,
    canExecuteInvestmentTransactions: scoped && administrator,
  };
}

/** Reuses the exact existing client-policy boundary. No browser/token role claims. */
function createInvestmentGuards({ User, Organisation, requireRootOrgAccess, getPolicy }) {
  const requireInvestmentPolicyAccess = async (req, res) => {
    try {
      if (!req.user?.userId) { res.status(401).json({ message: "Authentication required" }); return null; }
      const user = await User.findById(req.user.userId).select("role organisationId").lean();
      if (!user) { res.status(401).json({ message: "User not found" }); return null; }
      if (!["superuser", "admin", "user"].includes(String(user.role || "").toLowerCase().trim())) {
        res.status(403).json({ message: "Investment access denied" }); return null;
      }
      // Currently client policies are shared internally, not externally. Do not widen this rule.
      if (!await requireRootOrgAccess(req, res)) return null;
      const policyId = req.params?.policyId;
      if (typeof policyId !== "string" || !policyId.trim()) {
        res.status(400).json({ message: "Policy ID required" }); return null;
      }
      const policy = await getPolicy().findOne({ id: policyId, status: { $in: ["APPROVED", "ACTIVE"] } }).lean();
      if (!policy?.clientId) { res.status(404).json({ message: "Client policy not found" }); return null; }
      const org = user.organisationId
        ? await Organisation.findById(user.organisationId).select("isRootOrganisation").lean() : null;
      return {
        actorId: String(req.user.userId), policy,
        permissions: investmentPermissionsFor(user.role, org?.isRootOrganisation === true, true),
      };
    } catch (e) {
      console.error("Investment access check error:", e);
      res.status(500).json({ message: "Failed to verify investment access" }); return null;
    }
  };
  const requirePermission = (permission) => async (req, res) => {
    const access = await requireInvestmentPolicyAccess(req, res);
    if (!access) return null;
    if (!access.permissions[permission]) {
      res.status(403).json({ message: "Investment action not permitted" }); return null;
    }
    return access;
  };
  return {
    requireInvestmentPolicyAccess,
    requireInvestmentRequester: requirePermission("canSubmitInvestmentRequests"),
    requireInvestmentAuthoriser: requirePermission("canAuthoriseInvestmentTransactions"),
    requireInvestmentExecutor: requirePermission("canExecuteInvestmentTransactions"),
  };
}

module.exports = { investmentPermissionsFor, createInvestmentGuards };