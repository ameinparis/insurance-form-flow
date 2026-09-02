import { useCallback, useEffect, useState } from "react"

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:5002"

const authHeaders = (): HeadersInit => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const apiError = async (res: Response, fallback: string) => {
  let message = fallback
  try {
    const body = await res.json()
    if (body?.message) message = body.detail ? `${body.message}: ${body.detail}` : body.message
  } catch {
    /* non-JSON */
  }
  return new Error(message)
}

/** Permanent customer record — the source of truth for client identity. */
export interface ClientRecord {
  _id: string
  clientNumber: string
  fullName: string
  idNumber?: string
  email?: string
  contactNumber?: string
  dateOfBirth?: string
  status?: string
  createdFromPolicy?: string | null
  createdFromQuote?: string | null
  createdAt?: string
  updatedAt?: string
}

/** An approved/active policy belonging to a client (Policy.clientId === Client._id). */
export interface ClientPolicy {
  id: string
  status?: string
  clientId?: string
  productType?: string
  optionLabel?: string
  quoteId?: string
  premium?: number
  form?: Record<string, string>
  approvedAt?: string
  createdAt?: string
  updatedAt?: string
}

/** GET /api/clients — one row per client, never per policy. */
export const useClients = () => {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/clients`, { headers: authHeaders() })

      if (!res.ok) throw await apiError(res, "Failed to load clients")
      const data = await res.json()
      setClients(Array.isArray(data) ? data : [])
      setError("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load clients")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { clients, loading, error, refresh }
}

/** GET /api/clients/:id plus GET /api/clients/:id/policies. */
export const useClient = (id?: string) => {
  const [client, setClient] = useState<ClientRecord | null>(null)
  const [policies, setPolicies] = useState<ClientPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [clientRes, policiesRes] = await Promise.all([
        fetch(`${API_BASE}/api/clients/${encodeURIComponent(id)}`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/clients/${encodeURIComponent(id)}/policies`, { headers: authHeaders() }),
      ])
      if (!clientRes.ok) throw await apiError(clientRes, "Failed to load client")
      setClient(await clientRes.json())
      setPolicies(policiesRes.ok ? ((await policiesRes.json()) as ClientPolicy[]) : [])
      setError("")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load client")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  return { client, policies, loading, error, refresh: load }
}
