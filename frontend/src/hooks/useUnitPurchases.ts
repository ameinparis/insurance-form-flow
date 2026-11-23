import { useCallback, useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/api"

export interface UnitPurchase {
  policyId: string; fundId: string; fundName: string; status: "PURCHASED"; purchaseDate: string
  investmentAmount: string; unitPrice: string; units: string; closingBalance: string
  authorisedBy: { id: string; name: string }; confirmedAt: string
}
export interface ConfirmPurchaseInput {
  purchaseDate: string; approvedAmount: string; unitPrice: string; valuationId: string; valuationRevision: number; inputHash: string
}
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("token") || ""}` })

/** Recorded initial purchases for a policy. Authority and calculations are server-side only. */
export function useUnitPurchases(policyId: string) {
  const [data, setData] = useState<UnitPurchase[]>([])
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/policies/${encodeURIComponent(policyId)}/purchases`, { headers: auth() })
      if (res.ok) setData(await res.json())
    } catch { /* leave previous */ }
  }, [policyId])
  useEffect(() => { refresh() }, [refresh])
  const confirm = async (fundId: string, input: ConfirmPurchaseInput) => {
    const res = await fetch(`${API_BASE_URL}/policies/${encodeURIComponent(policyId)}/funds/${encodeURIComponent(fundId)}/initial-purchase`,
      { method: "POST", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify({ ...input, confirmed: true }) })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.message || "Could not record the unit purchase")
    await refresh()
    return body as UnitPurchase
  }
  return { data, refresh, confirm }
}
