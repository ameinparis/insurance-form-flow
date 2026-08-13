import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, CheckCircle2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { usePolicyDrafts, type PolicyDraft } from "@/hooks/usePolicyDrafts"
import { useAuth } from "@/lib/authlibrary"
import { permissionsFor } from "@/lib/permissions"
import { formatDate } from "@/lib/quoteUtils"

type StatusKey = "pending" | "approved" | "rejected"

const statusOf = (d: PolicyDraft): StatusKey | "draft" => {
  if (d.status === "approved") return "approved"
  if (d.status === "rejected") return "rejected"
  if (d.status === "pending_approval") return "pending"
  return "draft"
}

const STATUS_STYLES: Record<string, string> = {
  pending: "border-amber-300 text-amber-600 dark:text-amber-400",
  approved: "border-emerald-300 text-emerald-600 dark:text-emerald-400",
  rejected: "border-red-300 text-red-600 dark:text-red-400",
  draft: "border-slate-300 text-slate-500 dark:text-slate-400",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  draft: "Draft",
}

const Approvals = () => {
  const navigate = useNavigate()
  const { drafts } = usePolicyDrafts()
  const { userRole, userId } = useAuth()
  const role = permissionsFor(userRole).role
  const isAdvisor = role === "advisor"

  const scoped = useMemo(() => {
    const submitted = drafts.filter((d) => statusOf(d) !== "draft")
    if (!isAdvisor) return submitted
    return submitted.filter((d) => String(d.initiatedBy || "") === String(userId || ""))
  }, [drafts, isAdvisor, userId])

  const tallies = useMemo(
    () => ({
      pending: scoped.filter((d) => statusOf(d) === "pending").length,
      approved: scoped.filter((d) => statusOf(d) === "approved").length,
      rejected: scoped.filter((d) => statusOf(d) === "rejected").length,
    }),
    [scoped],
  )

  const assignedToMePending = useMemo(
    () =>
      scoped.filter(
        (d) => statusOf(d) === "pending" && String(d.assignedTo || "") === String(userId || ""),
      ).length,
    [scoped, userId],
  )

  const tabs = isAdvisor
    ? (["pending", "approved", "rejected"] as const)
    : (["all", "assigned", "pending", "approved", "rejected"] as const)
  const [tab, setTab] = useState<string>(isAdvisor ? "pending" : "all")

  const rows = useMemo(() => {
    const list = scoped.filter((d) => {
      if (tab === "all") return true
      if (tab === "assigned") return String(d.assignedTo || "") === String(userId || "")
      return statusOf(d) === tab
    })
    return [...list].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  }, [scoped, tab, userId])

  const cards = [
    { key: "pending", label: "Pending", value: tallies.pending, icon: Clock, tone: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" },
    { key: "approved", label: "Approved", value: tallies.approved, icon: CheckCircle2, tone: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" },
    { key: "rejected", label: "Rejected", value: tallies.rejected, icon: XCircle, tone: "text-red-500 bg-red-50 dark:bg-red-500/10" },
  ]

  const tabLabel = (t: string) =>
    t === "all" ? "All" : t === "assigned" ? "Assigned to me" : STATUS_LABELS[t]

  return (
    <div className="relative min-h-full -m-6 bg-slate-50 dark:bg-slate-900">
      <div className="sticky top-0 z-30 px-6 pt-6 pb-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isAdvisor ? "My Submissions" : "Approvals"}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isAdvisor
            ? "Track the review status of policy conversions you submitted."
            : "Review and action policy conversion submissions."}
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.key}
              className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {c.label}
                </p>
                <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                  {c.value}
                </p>
              </div>
              <span className={`h-11 w-11 rounded-xl grid place-items-center ${c.tone}`}>
                <c.icon className="h-5 w-5" />
              </span>
            </div>
          ))}
        </div>

        {!isAdvisor && (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Assigned to you:{" "}
            <span className="font-bold text-slate-900 dark:text-white">
              {assignedToMePending} pending
            </span>
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                tab === t
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tabLabel(t)}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-200 dark:bg-slate-700">
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  <th className="px-6 py-3 font-bold">Client</th>
                  <th className="px-6 py-3 font-bold">Product</th>
                  {!isAdvisor && <th className="px-6 py-3 font-bold">Submitted by</th>}
                  <th className="px-6 py-3 font-bold">Assigned to</th>
                  <th className="px-6 py-3 font-bold">Date</th>
                  <th className="px-6 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {rows.map((d) => {
                  const s = statusOf(d)
                  return (
                    <tr
                      key={d.id}
                      onClick={() => navigate(`/policies/drafts/${d.id}`)}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {d.form?.fullName || "Unnamed policyholder"}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {d.optionLabel || d.productType || "—"}
                      </td>
                      {!isAdvisor && (
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {d.initiatedByName || "—"}
                        </td>
                      )}
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {d.assignedToName || "Unassigned"}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(d.updatedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="outline"
                          className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${STATUS_STYLES[s]}`}
                        >
                          {STATUS_LABELS[s]}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={isAdvisor ? 5 : 6}
                      className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      Nothing to show here yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Approvals
