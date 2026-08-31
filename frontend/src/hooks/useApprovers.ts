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

const CACHE_KEY = "approvers:cache:v1"
const CACHE_TTL = 5 * 60 * 1000

let memoryCache: { at: number; data: Approver[] } | null = null
let inFlight: Promise<Approver[]> | null = null

const readSessionCache = (): Approver[] | null => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.data) return null
    memoryCache = memoryCache || parsed
    return parsed.data as Approver[]
  } catch {
    return null
  }
}

const mapUsers = (users: any[]): Approver[] =>
  (users || [])
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

const fetchApprovers = (): Promise<Approver[]> => {
  if (inFlight) return inFlight
  const token = localStorage.getItem("token")
  inFlight = axios
    .get("http://localhost:5002/api/users", {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    })
    .then((res) => {
      const mapped = mapUsers(res.data)
      memoryCache = { at: Date.now(), data: mapped }
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(memoryCache))
      } catch {
        /* ignore quota errors */
      }
      return mapped
    })
    .catch(() => memoryCache?.data ?? readSessionCache() ?? [])
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

/** Warm the cache early (e.g. on page load) so dialogs open with reviewers ready. */
export const prefetchApprovers = () => {
  if (!memoryCache || Date.now() - memoryCache.at > CACHE_TTL) void fetchApprovers()
}

/** All users who can review a policy conversion (Admin / Super Admin). */
export const useApprovers = () => {
  const cached = memoryCache?.data ?? readSessionCache()
  const [approvers, setApprovers] = useState<Approver[]>(cached ?? [])
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    let active = true
    const fresh = memoryCache && Date.now() - memoryCache.at < CACHE_TTL
    if (fresh) {
      setApprovers(memoryCache!.data)
      setLoading(false)
      return
    }
    fetchApprovers().then((list) => {
      if (!active) return
      setApprovers(list)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  return { approvers, loading }
}
