import { useEffect, useState } from "react"
import axios from "axios"
import { normalizeRole, roleLabel } from "@/lib/permissions"

export interface Approver {
  id: string
  name: string
  email: string
  role: string
  roleLabel: string
}

/** All users who can review a policy conversion (Admin / Super Admin). */
export const useApprovers = () => {
  const [approvers, setApprovers] = useState<Approver[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await axios.get("http://localhost:5002/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        })
        const mapped: Approver[] = (res.data || [])
          .filter((u: any) => {
            const r = normalizeRole(u.role)
            return (r === "admin" || r === "super_admin") && u.isActive !== false
          })
          .map((u: any) => ({
            id: String(u._id),
            name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
            email: u.email,
            role: u.role,
            roleLabel: roleLabel(u.role),
          }))
        if (active) setApprovers(mapped)
      } catch {
        if (active) setApprovers([])
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  return { approvers, loading }
}
