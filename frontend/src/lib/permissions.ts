export type AppRole = "super_admin" | "admin" | "advisor" | "none"

/**
 * Stored backend role values -> app roles.
 *
 * A missing or unrecognised role resolves to "none" (no role) and never to
 * "advisor": an unknown role must not silently inherit Advisor permissions.
 */
export const normalizeRole = (raw?: string | null): AppRole => {
  const value = String(raw || "").toLowerCase().trim()
  if (value === "superuser" || value === "super_admin" || value === "superadmin") return "super_admin"
  if (value === "admin") return "admin"
  if (value === "user" || value === "advisor") return "advisor"
  return "none"
}

/** App role -> value persisted by the API */
export const toStoredRole = (role: AppRole): string =>
  role === "super_admin" ? "superuser" : role === "admin" ? "admin" : "user"

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  advisor: "Advisor",
  none: "Signed out",
}

export const roleLabel = (raw?: string | null) => ROLE_LABELS[normalizeRole(raw)]

export interface Permissions {
  role: AppRole
  canManageUsers: boolean
  canManageSuperAdmins: boolean
  canConfigureFees: boolean
  canManageInvestments: boolean
  canApprove: boolean
  canApproveOwn: boolean
}

export const permissionsFor = (raw?: string | null): Permissions => {
  const role = normalizeRole(raw)
  const isSuper = role === "super_admin"
  const isAdmin = role === "admin"
  // role === "none" (missing/unknown role) grants nothing: fail closed.
  return {
    role,
    canManageUsers: isSuper || isAdmin,
    canManageSuperAdmins: isSuper,
    canConfigureFees: isSuper || isAdmin,
    canManageInvestments: isSuper || isAdmin,
    canApprove: isSuper || isAdmin,
    canApproveOwn: isSuper,
  }
}

/**
 * Returns true if the actor role is allowed to assign `targetRole` to another user.
 *
 * Actor	Can change Advisor's role	Can change another Admin's role	Can change Super Admin's role
 * Super Admin	Yes	Yes	Yes
 * Admin	Yes	No	No
 * Advisor	No	No	No
 */
export const canAssignRole = (actorRaw?: string | null, targetRoleRaw?: string | null): boolean => {
  const actor = normalizeRole(actorRaw)
  const target = normalizeRole(targetRoleRaw)

  if (actor === "super_admin") return true
  if (actor === "admin") return target === "advisor"
  return false
}

/** Roles a given user is allowed to assign to others */
export const assignableRoles = (raw?: string | null): AppRole[] => {
  const { canManageUsers, canManageSuperAdmins } = permissionsFor(raw)
  if (!canManageUsers) return []
  if (canManageSuperAdmins) return ["super_admin", "admin", "advisor"]
  return ["advisor"]
}

export const canApproveConversion = (
  raw: string | null | undefined,
  currentUserId: string | null | undefined,
  initiatedBy?: string | null,
): boolean => {
  const p = permissionsFor(raw)
  if (!p.canApprove) return false
  if (p.canApproveOwn) return true
  if (!initiatedBy) return true
  return String(initiatedBy) !== String(currentUserId || "")
}
