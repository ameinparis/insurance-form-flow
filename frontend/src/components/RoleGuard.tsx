import { useEffect } from "react"
import { Navigate } from "react-router-dom"
import { toast } from "sonner"
import { usePermissions } from "@/lib/authlibrary"
import type { Permissions } from "@/lib/permissions"

interface RoleGuardProps {
  require: keyof Omit<Permissions, "role">
  children: React.ReactNode
  redirectTo?: string
}

/** Blocks a route when the current user's role lacks the required permission. */
export const RoleGuard = ({ require, children, redirectTo = "/dashboard" }: RoleGuardProps) => {
  const permissions = usePermissions()
  const allowed = Boolean(permissions[require])

  useEffect(() => {
    if (!allowed) toast.error("You do not have access to that page")
  }, [allowed])

  if (!allowed) return <Navigate to={redirectTo} replace />
  return <>{children}</>
}

export default RoleGuard
