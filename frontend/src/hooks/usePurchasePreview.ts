import { useState } from "react"
import { API_BASE_URL } from "@/lib/api"

export interface PurchasePreview {
  status: "PREVIEW_NOT_ACTIVATED"; purchaseDate: string; approvedAmount: string; unitPrice: string
  valuationDate: string; estimatedUnits: string; displayedUnits: string; fundName: string
  closingBalance: string; valuationId: string; valuationRevision: number; inputHash: string
}

/** Read-only server preview. Nothing is purchased or saved. */
export function usePurchasePreview(policyId: string, fundId: string | null) {
  const [data, setData] = useState<PurchasePreview | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const run = async (date: string) => {
    if (!fundId) { setError("This fund has no saved fund ID, so a preview isn't possible."); return }
    setLoading(true); setError(""); setData(null)
    try {
      const res = await fetch(`${API_BASE_URL}/policies/${encodeURIComponent(policyId)}/funds/${encodeURIComponent(fundId)}/purchase-preview?date=${encodeURIComponent(date)}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` } })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.message || "Could not prepare purchase preview")
      setData(body)
    } catch (e) { setError(e instanceof Error ? e.message : "Could not prepare purchase preview") }
    finally { setLoading(false) }
  }
  return { data, error, loading, run }
}
