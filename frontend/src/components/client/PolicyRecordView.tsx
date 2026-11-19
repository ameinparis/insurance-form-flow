import { FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { POLICY_DOCUMENTS } from "@/components/policy/DocumentChecklist"
import type { ClientPolicy } from "@/hooks/useClients"
import { useInvestmentManagers } from "@/hooks/useInvestmentManagers"
import { formatCurrency } from "@/lib/quoteUtils"
import type { Fund } from "@/components/admin/assetManagerModel"
import { useState, useEffect } from "react"

/**
 * Read-only presentation of an approved policy inside the Client context.
 * Deliberately carries no conversion/reviewer controls or metadata.
 */
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

export const PolicyRecordView = ({ policy, allFunds = [] }: { policy: ClientPolicy; allFunds?: Array<{ id: string; name: string; assetManagerName: string }> }) => {
  const { fetchAllFunds } = useInvestmentManagers()
  const [funds, setFunds] = useState<Array<{ id: string; name: string; assetManagerName: string }>>(allFunds)

  const form = policy.form || {}

  useEffect(() => {
    fetchAllFunds().then(setFunds).catch(() => setFunds([]))
  }, [fetchAllFunds])


  const beneficiaries: Record<string, string>[] = (() => {
    try {
      const parsed = form.beneficiaries ? JSON.parse(form.beneficiaries) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()

  const netInvestment = Number(String(form.netInvestment).replace(/[^0-9.]/g, "")) || 0

  const fundAllocations: Array<{
    id: string
    name: string
    assetManagerName: string
    allocationPercent: number
    allocatedAmount: number
  }> = (() => {
    try {
      const raw = form.portfolioAllocations
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return Object.entries(parsed).map(([fundId, pct]) => {
          const fund = funds.find((f) => f.id === fundId)
          const allocationPercent = Number(pct) || 0
          return {
            id: fundId,
            name: fund?.name || "Unknown Fund",
            assetManagerName: fund?.assetManagerName || "Unknown Manager",
            allocationPercent,
            allocatedAmount: netInvestment * (allocationPercent / 100),
          }
        })
      }
      return []
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

  const totalAllocationPercent = fundAllocations.reduce((sum, f) => sum + f.allocationPercent, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {SECTIONS.map((section) => (
        <div key={section.title} className={card}>
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-5">
            {section.title}
          </h3>
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

      {/* Investment Portfolio */}
      <div className={`lg:col-span-2 ${card}`}>
        <div className="flex items-center justify-between gap-4 mb-5">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Investment Portfolio
          </h3>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {fundAllocations.length} {fundAllocations.length === 1 ? "fund" : "funds"}
          </span>
        </div>
        {fundAllocations.length === 0 ? (
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/30 p-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No investment portfolio configured.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Net Investment Amount
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {netInvestment > 0 ? formatCurrency(netInvestment) : "—"}
                </span>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-3">
                <div className="flex items-center gap-3">
                  <span className="w-24 text-xs font-medium text-slate-500 dark:text-slate-400">
                    Total Allocated
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-blue-600 rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(totalAllocationPercent, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {totalAllocationPercent}%
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/50">
                    <th className="px-4 py-3 text-left">Fund</th>
                    <th className="px-4 py-3 text-left">Asset Manager</th>
                    <th className="px-4 py-3 text-right">Allocation %</th>
                    <th className="px-4 py-3 text-right">Allocated Amount (BWP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-slate-200 dark:border-slate-700/50">
                  {fundAllocations.map((f) => (
                    <tr key={f.id} className="text-sm">
                      <td className="px-4 py-3">
                        <div className="font-medium">{f.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {f.assetManagerName}
                        </div>
                      </td>
                      <td className="px-4 py-3">{f.assetManagerName}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium">{f.allocationPercent}%</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium">
                          {netInvestment > 0 ? formatCurrency(f.allocatedAmount) : "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className={`lg:col-span-2 ${card}`}>
        <div className="flex items-center justify-between gap-4 mb-5">
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Documents</h3>
          <Badge
            variant="outline"
            className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap border-slate-300 text-slate-500 dark:text-slate-400"
          >
            {POLICY_DOCUMENTS.filter((d) => documents[d.key]).length} of {POLICY_DOCUMENTS.length} on file
          </Badge>
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
    </div>
  )
}

export default PolicyRecordView
