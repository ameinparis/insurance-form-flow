import { useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useClient } from "@/hooks/useClients"
import { usePolicyFunding } from "@/hooks/usePolicyFunding"
import { useUnitPurchases } from "@/hooks/useUnitPurchases"
import { useMarketAdjustments } from "@/hooks/useMarketAdjustments"
import { useAuth } from "@/lib/authlibrary"
import { readSubmittedPortfolio, splitFundRow } from "@/components/policy/policyReview"
import { PurchasePreviewSection } from "@/components/client/PurchasePreviewSection"
import { InvestmentStatementSection } from "@/components/client/InvestmentStatementSection"
import { MarketAdjustmentSection } from "@/components/client/MarketAdjustmentSection"
import { buildStatement, formatDate, formatMoney, formatPrice, formatUnits, latestClosingBalance } from "@/lib/investmentStatement"

const card = "rounded-[1.75rem] bg-card border border-border shadow-sm p-6"
const Item = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="py-2.5 border-b border-border">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm font-semibold mt-1 break-words">{value || "—"}</p>
  </div>
)

/** Full-width per-fund tracking for one policy. Figures come from stored records only. */
const PortfolioTracking = () => {
  const { id, policyId = "", fundId = "" } = useParams()
  const navigate = useNavigate()
  const { client, policies, loading } = useClient(id)
  const policy = policies.find((p) => p.id === policyId)
  const funding = usePolicyFunding(policyId)
  const purchases = useUnitPurchases(policyId)
  const adjustments = useMarketAdjustments(policyId)
  const { permissions } = useAuth()
  const back = () => navigate(`/clients/${id}/policies/${policyId}`)

  const fund = useMemo(() => {
    const form = policy?.form || {}
    let selected: any
    try { selected = (JSON.parse(String(form.selectedFunds || "[]")) as any[]).find((f) => String(f?.id) === fundId) } catch { selected = undefined }
    if (!selected) return null
    const row = readSubmittedPortfolio(form)?.rows?.find((r) => r.name === selected.name && (r.detail || "") === (selected.assetManagerName || ""))
    return { name: String(selected.name || ""), manager: String(selected.assetManagerName || row?.detail || ""), ...(row ? splitFundRow(row.value) : { percent: "", amount: "" }) }
  }, [policy, fundId])

  if (loading) return <div className={card}><p className="text-sm text-muted-foreground">Loading…</p></div>
  if (!client || !policy || !fund) return <div className={card}>
    <p className="text-sm text-muted-foreground">This fund is not part of an approved policy you can view.</p>
    <Button variant="outline" className="mt-4 rounded-full" onClick={back}><ArrowLeft className="h-4 w-4" /> Back to Client Policy</Button>
  </div>

  const bought = purchases.data.find((p) => p.fundId === fundId)
  const rows = buildStatement(purchases.data, fundId, adjustments.data)
  const latest = latestClosingBalance(rows)
  const canManage = !!permissions?.canManageFunding
  const eligible = funding.data?.status === "confirmed" && ["APPROVED", "ACTIVE"].includes(String(policy.status).toUpperCase())

  return (
    <div className="space-y-6" data-portfolio-tracking>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" className="rounded-full" onClick={back}><ArrowLeft className="h-4 w-4" /> Back to Client Policy</Button>
        <Badge variant="secondary" className="whitespace-nowrap">{bought ? "Purchased" : "Not yet purchased"}</Badge>
      </div>
      <div className={card}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Portfolio Tracking</p>
        <h1 className="font-heading text-2xl font-bold mt-1">{fund.name}</h1>
        <p className="text-sm text-muted-foreground">{fund.manager || "Asset manager not recorded"}</p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8">
          <Item label="Client" value={client.fullName} />
          <Item label="Policy" value={String(policy.form?.policyNumber || policy.id)} />
          <Item label="Approved Allocation" value={fund.percent} />
          <Item label="Approved Investment Amount" value={fund.amount} />
          <Item label="Funding Status" value={funding.data?.status === "confirmed" ? "Funds Confirmed" : funding.data ? "Awaiting funds confirmation" : "Not yet available"} />
          <Item label="Purchase Status" value={bought ? "Purchased" : "Not yet purchased"} />
          <Item label="Initial Purchase Date" value={bought ? formatDate(bought.purchaseDate) : null} />
          <Item label="Initial Unit Price" value={bought ? formatPrice(bought.unitPrice) : null} />
          <Item label="Initial Units Purchased" value={bought ? formatUnits(bought.units) : null} />
          <Item label="Current Units Held" value={bought ? formatUnits(bought.units) : null} />
          <Item label="Latest Closing Balance" value={latest ? formatMoney(latest) : null} />
        </div>
      </div>
      {!bought && canManage && eligible && <div className={card}><PurchasePreviewSection policyId={policyId} fundId={fundId} onConfirm={purchases.confirm} /></div>}
      {bought && canManage && eligible && <MarketAdjustmentSection fundId={fundId} preview={adjustments.preview} confirm={adjustments.confirm} />}
      <div className={card}><InvestmentStatementSection purchases={purchases.data} fundId={fundId} adjustments={adjustments.data} /></div>
    </div>
  )
}
export default PortfolioTracking
