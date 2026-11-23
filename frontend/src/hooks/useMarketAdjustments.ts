import { useCallback, useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/api"

export interface MarketAdjustment {
  policyId: string; fundId: string; sequence: number; valuationDate: string; previousDate: string
  unitsHeld: string; previousUnitPrice: string; newUnitPrice: string; adjustment: string
  previousClosingBalance: string; newClosingBalance: string; valuationId: string; valuationRevision: number
  authorisedBy?: { id: string; name: string }; confirmedAt?: string
}
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` })
const base = (policyId: string) => `${API_BASE_URL}/policies/${encodeURIComponent(policyId)}`

/** Recorded market adjustments plus server-side preview/confirm. No calculations happen here. */
export function useMarketAdjustments(policyId: string) {
  const [data, setData] = useState<MarketAdjustment[]>([])
  const refresh = useCallback(async () => {
    try { const res = await fetch(`${base(policyId)}/market-adjustments`, { headers: auth() }); if (res.ok) setData(await res.json()) } catch { /* keep */ }
  }, [policyId])
  useEffect(() => { refresh() }, [refresh])
  const preview = async (fundId: string, date: string) => {
    const res = await fetch(`${base(policyId)}/funds/${encodeURIComponent(fundId)}/market-adjustment-preview?date=${encodeURIComponent(date)}`, { headers: auth() })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.message || "Could not prepare the preview")
    return body as MarketAdjustment
  }
  const confirm = async (fundId: string, p: MarketAdjustment) => {
    const res = await fetch(`${base(policyId)}/funds/${encodeURIComponent(fundId)}/market-adjustments`, {
      method: "POST", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify({ ...p, confirmed: true }) })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.message || "Could not record the adjustment")
    await refresh()
    return body as MarketAdjustment
  }
  return { data, refresh, preview, confirm }
}
