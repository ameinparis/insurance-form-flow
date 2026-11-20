import { useCallback, useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/api"

export interface PolicyFundingStatus {
  status: "awaiting" | "confirmed" | "reversed"
  confirmedBy?: string; confirmedByName?: string; confirmedAt?: string; canConfirm?: boolean
}

/** Reads/creates the one-time funding confirmation. Authority is decided server-side only. */
export function usePolicyFunding(policyId: string) {
  const [data, setData] = useState<PolicyFundingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const url = `${API_BASE_URL}/policies/${encodeURIComponent(policyId)}/funding`
  const headers = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token") || ""}` })

  const load = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const res = await fetch(url, { headers: headers() })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.message || "Failed to load funding status")
      setData(body)
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load funding status") }
    finally { setLoading(false) }
  }, [url])

  useEffect(() => { load() }, [load])

  const confirm = async () => {
    const res = await fetch(`${url}/confirm`, { method: "POST", headers: headers(), body: JSON.stringify({ confirmed: true }) })
    const body = await res.json().catch(() => ({}))
    await load()
    if (!res.ok) throw new Error(body.message || "Failed to confirm funds")
  }
  return { data, loading, error, confirm }
}
