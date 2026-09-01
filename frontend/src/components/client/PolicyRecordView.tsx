import { FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { POLICY_DOCUMENTS } from "@/components/policy/DocumentChecklist"
import type { ClientPolicy } from "@/hooks/useClients"

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
      { key: "investmentAmount", label: "Investment Amount Premium" },
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

export const PolicyRecordView = ({ policy }: { policy: ClientPolicy }) => {
  const form = policy.form || {}

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
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {Number(String(b.allocation ?? "0").replace(/[^0-9.]/g, "")) || 0}%
                </span>
              </div>
            ))
          )}
        </div>
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
