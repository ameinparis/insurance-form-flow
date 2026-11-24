import { useCallback, useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/api"

export interface MonthlyRow { type: string; description: string; movement: string; closingBalance: string }
export interface MonthlyBatch {
  policyId: string; fundId: string; sequence: number; valuationDate: string; previousDate: string
  unitsHeld: string; previousUnitPrice: string; newUnitPrice: string; previousClosingBalance: string
  funeralUnits?: string | null; unitsHeldAfter?: string | null
  funeralPremium: string; allocationPercent: string; adminFeePercent: string; rows: MonthlyRow[]
  valuationId: string; valuationRevision: number; inputHash?: string
  authorisedBy?: { id: string; name: string }; confirmedAt?: string
}
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` })
const base = (policyId: string) => `${API_BASE_URL}/policies/${encodeURIComponent(policyId)}`

/** Stored monthly batches plus server-side preview/confirm. No calculations happen here. */
export function useMonthlyProcessing(policyId: string) {
  const [data, setData] = useState<MonthlyBatch[]>([])
  const refresh = useCallback(async () => {
    try { const res = await fetch(`${base(policyId)}/monthly-batches`, { headers: auth() }); if (res.ok) setData(await res.json()) } catch { /* keep */ }
  }, [policyId])
  useEffect(() => { refresh() }, [refresh])
  const preview = async (fundId: string, date: string) => {
    const res = await fetch(`${base(policyId)}/funds/${encodeURIComponent(fundId)}/monthly-preview?date=${encodeURIComponent(date)}`, { headers: auth() })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.message || "Could not prepare the preview")
    return body as MonthlyBatch
  }
  const confirm = async (fundId: string, p: MonthlyBatch) => {
    const res = await fetch(`${base(policyId)}/funds/${encodeURIComponent(fundId)}/monthly-batches`, {
      method: "POST", headers: { ...auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ valuationDate: p.valuationDate, inputHash: p.inputHash, confirmed: true }) })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.message || "Could not record monthly processing")
    await refresh()
    return body as MonthlyBatch
  }
  return { data, refresh, preview, confirm }
}
