import { useState, type ReactNode } from "react"
import { ChevronRight, FileText } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { POLICY_DOCUMENTS } from "@/components/policy/DocumentChecklist"
import type { ClientPolicy } from "@/hooks/useClients"
import { readSubmittedPortfolio, splitFundRow, type ReviewRow } from "@/components/policy/policyReview"
import { PolicyReviewContent } from "@/components/policy/PolicyReviewContent"
import { InvestmentFundingCard } from "@/components/client/InvestmentFundingCard"
import { usePolicyFunding } from "@/hooks/usePolicyFunding"
import { PurchasePreviewSection, Row as PurchaseRow, bwp, groupUnits, dmy } from "@/components/client/PurchasePreviewSection"
import { useUnitPurchases } from "@/hooks/useUnitPurchases"
import { useAuth } from "@/lib/authlibrary"

/**
 * Read-only presentation of an approved policy inside the Client context.
 * Deliberately carries no conversion/reviewer controls or metadata.
 */
/** Two-decimal display of full-precision units by string rounding (half-up); never fed back into calculations. */
const unitsDisplay = (u: string) => {
  const [i, d = ""] = u.split(".")
  const cents = BigInt(i + (d + "00").slice(0, 2)) + (Number(d[2] || "0") >= 5 ? 1n : 0n)
  const t = cents.toString().padStart(3, "0")
  return `${t.slice(0, -2)}.${t.slice(-2)}`
}
const SECTIONS: { title: string; fields: { key: string; label: string }[] }[] = [
  {
    title: "Policy Details",
    fields: [
      { key: "policyNumber", label: "Policy Number" },
      { key: "productName", label: "Product Name" },
      { key: "policyStartDate", label: "Policy Start Date" },
      { key: "transitionDate", label: "Transition Date" },
    ],
  },
  {
    title: "Premiums",
    fields: [
      { key: "investmentAmount", label: "Investment Amount" },
      { key: "netInvestment", label: "Net Investment Amount" },
      { key: "purchasePremium", label: "Purchase Premium" },
      { key: "upfrontCommission", label: "Upfront Commission" },
      { key: "administrationFee", label: "Administration Fee" },
      { key: "ongoingAdvisoryFee", label: "Ongoing Advisory Fee" },
      { key: "switchFee", label: "Switch Fee" },
      { key: "funeralPremium", label: "Funeral Premium" },
    ],
  },
]

const card =
  "rounded-[1.75rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-7"

const clickable =
  "cursor-pointer transition hover:border-[#009fe3]/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009fe3]"

const Detail = ({ label, value }: { label: string; value?: ReactNode }) => (
  <div className="py-2.5 border-b border-slate-100 dark:border-slate-700/60">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</p>
    <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1 break-words">
      {value || <span className="text-slate-400 italic font-normal">—</span>}
    </div>
  </div>
)

const ViewHint = () => (
  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
    View details <ChevronRight className="h-3.5 w-3.5" />
  </span>
)

/** Keyboard/mouse props that turn an existing card into an opener without changing its look. */
const opener = (open: () => void) => ({
  role: "button" as const,
  tabIndex: 0,
  onClick: open,
  onKeyDown: (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open() }
  },
})

type Panel = { kind: "section"; title: string } | { kind: "portfolio" } | { kind: "documents" } | { kind: "fund"; row: ReviewRow }

export const PolicyRecordView = ({ policy }: { policy: ClientPolicy }) => {
  const form = policy.form || {}
  const portfolio = readSubmittedPortfolio(form)
  const [panel, setPanel] = useState<Panel | null>(null)
  const funding = usePolicyFunding(policy.id)
  const purchases = useUnitPurchases(policy.id)
  const { permissions } = useAuth()
  const fundIdFor = (row: ReviewRow): string | null => {
    try {
      const list = JSON.parse(String(form.selectedFunds || "[]"))
      const hits = Array.isArray(list) ? list.filter((f: any) => f?.name === row.name && (f?.assetManagerName || "") === (row.detail || "")) : []
      return hits.length === 1 && hits[0].id ? String(hits[0].id) : null
    } catch { return null }
  }
  const fundingLabel = funding.data?.status === "confirmed" ? "Funds Confirmed" : funding.data ? "Awaiting funds confirmation" : "Not yet available"


  const beneficiaries: Record<string, string>[] = (() => {
    try {
      const parsed = form.beneficiaries ? JSON.parse(form.beneficiaries) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()

  const documents: Record<string, string> = (() => {
    try {
      const parsed = form.documents ? JSON.parse(form.documents) : {}
      return parsed && typeof parsed === "object" ? parsed : {}
    } catch {
      return {}
    }
  })()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {SECTIONS.map((section) => (
        <div key={section.title} className={`${card} ${clickable}`} {...opener(() => setPanel({ kind: "section", title: section.title }))}>
          <div className="flex items-center justify-between gap-4 mb-5">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{section.title}</h3>
            <ViewHint />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
            {section.fields.map((field) => (
              <div key={field.key} className="py-2.5 border-b border-slate-100 dark:border-slate-700/60">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {field.label}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">
                  {form[field.key] || <span className="text-slate-400 italic font-normal">—</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className={card}>
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-5">
          Product
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          {[
            { label: "Product", value: policy.productType },
            { label: "Option / Plan", value: policy.optionLabel },
            { label: "Quote ID", value: policy.quoteId },
            {
              label: "Premium",
              value: policy.premium != null ? `BWP ${Number(policy.premium).toLocaleString()}` : "",
            },
          ].map((item) => (
            <div key={item.label} className="py-2.5 border-b border-slate-100 dark:border-slate-700/60">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {item.label}
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">
                {item.value || "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-5">
          Beneficiaries
        </h3>
        <div className="space-y-2">
          {beneficiaries.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No beneficiaries captured.</p>
          ) : (
            beneficiaries.map((b, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {b.name || "—"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {[b.relationship, b.benefitOption].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Submitted portfolio: never resolve historical funds through the live catalogue. */}
      <div className={`lg:col-span-2 ${card} ${clickable}`} data-client-portfolio {...opener(() => setPanel({ kind: "portfolio" }))}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <h3 className="text-xl font-bold text-foreground">Investment Portfolio</h3>
          <div className="flex items-center gap-3">
            {portfolio?.badge && <Badge variant="secondary">{portfolio.badge}</Badge>}
            <ViewHint />
          </div>
        </div>
        {portfolio ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <PolicyReviewContent section={{ ...portfolio, rows: undefined, emptyText: portfolio.rows ? undefined : portfolio.emptyText }} />
          {portfolio.rows && <div className="space-y-2 sm:col-span-2">
            {portfolio.rows.map((row, index) => (
              <button
                key={index}
                type="button"
                data-fund-row
                onClick={(e) => { e.stopPropagation(); setPanel({ kind: "fund", row }) }}
                onKeyDown={(e) => e.stopPropagation()}
                className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition hover:border-[#009fe3]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009fe3]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-medium">{row.name}</span>
                  {row.detail && <span className="block break-words text-xs text-muted-foreground">{row.detail}</span>}
                </span>
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {row.value}<ChevronRight className="h-4 w-4 text-muted-foreground" />
                </span>
              </button>
            ))}
            {portfolio.rows.length === 0 && <p className="text-sm text-muted-foreground">{portfolio.emptyText}</p>}
          </div>}
        </div> : <p className="text-sm text-muted-foreground">No saved investment portfolio details available.</p>}
      </div>

      <InvestmentFundingCard form={form} funding={funding} className={`lg:col-span-2 ${card}`} />

      <div className={`lg:col-span-2 ${card} ${clickable}`} {...opener(() => setPanel({ kind: "documents" }))}>
        <div className="flex items-center justify-between gap-4 mb-5">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Documents</h3>
          <div className="flex items-center gap-3"><ViewHint />
          <Badge
            variant="outline"
            className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap border-slate-300 text-slate-500 dark:text-slate-400"
          >
            {POLICY_DOCUMENTS.filter((d) => documents[d.key]).length} of {POLICY_DOCUMENTS.length} on file
          </Badge></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {POLICY_DOCUMENTS.map((d) => {
            const present = !!documents[d.key]
            return (
              <div
                key={d.key}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                  present ? "border-emerald-500/50" : "border-slate-200 dark:border-slate-700 opacity-70"
                }`}
              >
                <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                    {d.label}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                    {present ? "On file" : d.conditional ? "Not required" : "Missing"}
                  </span>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <Sheet open={!!panel} onOpenChange={(open) => !open && setPanel(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {panel?.kind === "section" && (() => {
            const section = SECTIONS.find((s) => s.title === panel.title)!
            return <>
              <SheetHeader><SheetTitle>{section.title}</SheetTitle><SheetDescription>As approved for this policy.</SheetDescription></SheetHeader>
              <div className="mt-4">{section.fields.map((f) => <Detail key={f.key} label={f.label} value={form[f.key]} />)}</div>
            </>
          })()}
          {panel?.kind === "portfolio" && <>
            <SheetHeader><SheetTitle>Investment Portfolio</SheetTitle><SheetDescription>Approved allocations as submitted. Select a fund for its details.</SheetDescription></SheetHeader>
            <div className="mt-4">
              {portfolio?.fields?.map((f) => <Detail key={f.label} label={f.label} value={f.value} />)}
              <div className="mt-4 space-y-2">
                {portfolio?.rows?.map((row, i) => (
                  <button key={i} type="button" onClick={() => setPanel({ kind: "fund", row })}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left hover:border-[#009fe3]/60">
                    <span className="min-w-0"><span className="block text-sm font-medium">{row.name}</span>
                      {row.detail && <span className="block text-xs text-muted-foreground">{row.detail}</span>}</span>
                    <span className="flex items-center gap-2 text-sm font-semibold">{row.value}<ChevronRight className="h-4 w-4" /></span>
                  </button>
                ))}
                {!portfolio && <p className="text-sm text-muted-foreground">No saved investment portfolio details available.</p>}
              </div>
            </div>
          </>}
          {panel?.kind === "fund" && (() => {
            const { percent, amount } = splitFundRow(panel.row.value)
            const fid = fundIdFor(panel.row)
            const bought = fid ? purchases.data.find((p) => p.fundId === fid) : undefined
            return <div data-policy-fund-details>
              <SheetHeader><SheetTitle>{panel.row.name}</SheetTitle><SheetDescription>{panel.row.detail || "Asset manager not recorded"}</SheetDescription></SheetHeader>
              <div className="mt-4">
                <Detail label="Fund" value={panel.row.name} />
                <Detail label="Asset Manager" value={panel.row.detail} />
                <Detail label="Approved Allocation" value={percent} />
                <Detail label="Approved Allocation Amount" value={amount} />
                <Detail label="Funding Status" value={fundingLabel} />
                {!bought && <Detail label="Units Purchased" value="Not yet available" />}
              </div>
              {bought && <div data-initial-purchase className="mt-6 rounded-xl border border-border p-4">
                <p className="text-sm font-semibold mb-2">Initial Unit Purchase</p>
                <PurchaseRow label="Purchase Status" value="Purchased" />
                <PurchaseRow label="Purchase Date" value={dmy(bought.purchaseDate)} />
                <PurchaseRow label="Investment Amount" value={bwp(bought.investmentAmount)} />
                <PurchaseRow label="Initial Unit Price" value={`BWP ${bought.unitPrice}`} />
                <PurchaseRow label="Units Purchased" value={groupUnits(unitsDisplay(bought.units))} />
                <PurchaseRow label="Unit Holdings" value={groupUnits(unitsDisplay(bought.units))} />
                <PurchaseRow label="Initial Closing Balance" value={bwp(bought.closingBalance)} />
                <PurchaseRow label="Authorised By" value={bought.authorisedBy?.name || "—"} />
                <PurchaseRow label="Confirmation Date" value={new Date(bought.confirmedAt).toLocaleString()} />
              </div>}
              {!bought && permissions?.canManageFunding && funding.data?.status === "confirmed" && ["APPROVED", "ACTIVE"].includes(String(policy.status).toUpperCase()) &&
                <PurchasePreviewSection key={panel.row.name} policyId={policy.id} fundId={fid} onConfirm={purchases.confirm} />}
              <div className="mt-6 space-y-2">
                {(bought ? ["Portfolio Valuation", "Performance History", "Growth Chart"] : ["Unit Holdings", "Applicable Unit Price", "Portfolio Valuation", "Performance History", "Growth Chart"]).map((t) => (
                  <div key={t} className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-4 py-3">
                    <span className="text-sm font-medium">{t}</span>
                    <span className="text-xs text-muted-foreground">Available after investment activation</span>
                  </div>
                ))}
              </div>
            </div>
          })()}
          {panel?.kind === "documents" && <>
            <SheetHeader><SheetTitle>Documents</SheetTitle><SheetDescription>Documents submitted with this policy.</SheetDescription></SheetHeader>
            <div className="mt-4">
              {POLICY_DOCUMENTS.map((d) => {
                let name = ""
                try { name = documents[d.key] ? JSON.parse(documents[d.key]).name || "On file" : "" } catch { name = documents[d.key] ? "On file" : "" }
                return <Detail key={d.key} label={d.label} value={name || (d.conditional ? "Not required" : "Missing")} />
              })}
            </div>
          </>}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default PolicyRecordView
