/**
 * Investment funding authorisation. Grants ONLY funding management; it never
 * widens requireRootOrgAccess or any other Root Organisation permission.
 * Super Admin: any organisation. Admin: Root Organisation only. Everyone else: denied.
 */
function canManageFunding(role, isRootOrganisation) {
  const value = String(role || "").toLowerCase().trim();
  if (value === "superuser") return true;
  return value === "admin" && isRootOrganisation === true;
}

function createFundingGuard({ User, Organisation }) {
  /** Resolves the actor or sends 401/403; always reads role and organisation from the database, never the token or client. */
  const requireFundingManager = async (req, res) => {
    try {
      const user = await User.findById(req.user?.userId).select("role firstName lastName email organisationId").lean();
      if (!user) { res.status(401).json({ message: "User not found" }); return null; }
      let isRoot = false;
      if (user.organisationId) {
        const org = await Organisation.findById(user.organisationId).select("isRootOrganisation").lean();
        isRoot = org?.isRootOrganisation === true;
      }
      if (!canManageFunding(user.role, isRoot)) {
        res.status(403).json({ message: "Only Root Organisation Admins and Super Admins may manage investment funding" });
        return null;
      }
      return { id: String(req.user.userId), role: user.role, name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email };
    } catch (e) {
      console.error("Funding access check error:", e);
      res.status(500).json({ message: "Failed to verify funding access" });
      return null;
    }
  };
  return { requireFundingManager };
}

module.exports = { canManageFunding, createFundingGuard };
