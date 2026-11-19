import { useCallback, useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/api"
import type { Fund } from "@/components/admin/assetManagerModel"

export interface ValuationRevision {
  revision: number; previousPrice: string | null; replacementPrice: string; reason: string
  source: string; notes: string; administratorId: string; administratorName: string; recordedAt: string
}
export interface FundValuation {
  _id: string; valuationDate: string; unitPrice: string; revision: number; source: string; notes: string
  history: ValuationRevision[]
}
export interface FundDetailsData { fund: Fund & { _id: string }; assetManager: { _id: string; name: string }; valuations: FundValuation[] }
export interface ValuationInput { unitPrice: string; valuationDate: string; source: string; notes: string; reason: string; revision?: number }

export function useFundValuations(managerId: string, fundId: string) {
  const [data, setData] = useState<FundDetailsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const base = `${API_BASE_URL}/asset-managers/${encodeURIComponent(managerId)}/funds/${encodeURIComponent(fundId)}`
  const request = useCallback(async (url: string, init?: RequestInit) => {
    const token = localStorage.getItem("token")
    const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || "Could not load fund valuations")
    return result
  }, [])
  const refresh = useCallback(async () => {
    setLoading(true)
    try { setData(await request(base)); setError("") }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load fund") }
    finally { setLoading(false) }
  }, [base, request])
  useEffect(() => { void refresh() }, [refresh])
  const save = async (input: ValuationInput, valuation?: FundValuation) => {
    await request(`${base}/valuations${valuation ? `/${valuation._id}` : ""}`, {
      method: valuation ? "PATCH" : "POST", body: JSON.stringify(input),
    })
    await refresh()
  }
  return { data, loading, error, refresh, save }
}