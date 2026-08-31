import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Clock, CheckCircle2, XCircle, RotateCcw, FileClock, Eye, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  usePolicyDrafts,
  draftStatus,
  STATUS_LABEL,
  STATUS_BADGE,
  type PolicyDraft,
} from "@/hooks/usePolicyDrafts"
import { useAuth } from "@/lib/authlibrary"
import { permissionsFor } from "@/lib/permissions"
import { formatDate } from "@/lib/quoteUtils"

const Conversions = () => {
  const navigate = useNavigate()
  const { drafts, removeDraft, syncError } = usePolicyDrafts()
  const { userRole, userId } = useAuth()
  const role = permissionsFor(userRole).role
  const isAdvisor = role === "advisor"

  // Unsubmitted drafts stay private to whoever started them.
  const pipeline = useMemo(() => {
    const advisorOwn = (d: PolicyDraft) =>
      !d.initiatedBy || String(d.initiatedBy) === String(userId || "")
    const isDraft = (d: PolicyDraft) => {
      const s = draftStatus(d)
      return s === "draft" || s === "DRAFT"
    }
    return drafts
      .filter((d) => (isDraft(d) || isAdvisor ? advisorOwn(d) : true))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  }, [drafts, isAdvisor, userId])

  const byStatus = (list: PolicyDraft[], ...statuses: string[]) =>
    list.filter((d) => statuses.includes(String(draftStatus(d)).toLowerCase()))

  const myDrafts = useMemo(() => byStatus(pipeline, "draft"), [pipeline])
  const pending = useMemo(() => byStatus(pipeline, "pending_approval"), [pipeline])
  const approved = useMemo(() => byStatus(pipeline, "approved"), [pipeline])
  const rejected = useMemo(() => byStatus(pipeline, "rejected"), [pipeline])

  const tallies = useMemo(
    () => ({
      drafts: myDrafts.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
    }),
    [myDrafts, pending, approved, rejected],
  )

  const assignedToMePending = useMemo(
    () =>
      pending.filter(
        (d) => String(d.assignedTo || "") === String(userId || ""),
      ).length,
    [pending, userId],
  )

  const tabs = isAdvisor
    ? (["all", "drafts", "pending", "approved", "rejected"] as const)
    : (["all", "assigned", "drafts", "pending", "approved", "rejected"] as const)
  const [tab, setTab] = useState<string>("all")

  const rows = useMemo(() => {
    const list = pipeline.filter((d) => {
      const s = String(draftStatus(d)).toLowerCase()
      if (tab === "all") return true
      if (tab === "assigned") return String(d.assignedTo || "") === String(userId || "")
      if (tab === "pending") return s === "pending_approval"
      if (tab === "approved") return s === "approved"
      if (tab === "rejected") return s === "rejected"
      return s === "draft"
    })
    return [...list].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
  }, [pipeline, tab, userId])

  const cards = [
    { key: "drafts", label: "Drafts", value: tallies.drafts, icon: FileClock, tone: "text-slate-500 bg-slate-100 dark:bg-slate-700/50" },
    { key: "pending", label: "Pending", value: tallies.pending, icon: Clock, tone: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" },
    { key: "approved", label: "Approved", value: tallies.approved, icon: CheckCircle2, tone: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" },
    { key: "rejected", label: "Rejected", value: tallies.rejected, icon: XCircle, tone: "text-red-500 bg-red-50 dark:bg-red-500/10" },
  ]

  const tabLabel = (t: string) =>
    t === "drafts"
      ? "Drafts"
      : t === "all"
        ? "All"
        : t === "assigned"
          ? "Assigned to me"
          : t === "approved"
            ? "Approved"
            : t === "rejected"
              ? "Rejected"
              : "Pending"


  const continueEditing = (d: PolicyDraft) =>
    navigate("/policies/convert", {
      state: {
        draftId: d.id,
        step: d.step,
        form: d.form,
        productType: d.productType,
        optionLabel: d.optionLabel,
        quoteId: d.quoteId,
        premium: d.premium,
      },
    })

  return (
    <div className="relative min-h-full -m-6 bg-slate-50 dark:bg-slate-900">
      <div className="sticky top-0 z-30 px-6 pt-6 pb-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Conversions
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isAdvisor
            ? "Draft, submit and track quote-to-policy conversions you started."
            : "Draft, submit and review quote-to-policy conversions."}
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {syncError && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            Can't reach the server — this list may be out of date and recent changes are not synced.
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

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

        {tab === "drafts" ? (
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                In Progress
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Conversions you started but have not submitted for review yet.
              </p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {myDrafts.map((draft) => (
                <div key={draft.id} className="group/row flex items-center justify-between gap-4 px-6 py-4">
                  <button
                    className="min-w-0 text-left group"
                    onClick={() => navigate(`/policies/drafts/${draft.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <FileClock className="h-4 w-4 text-amber-500 shrink-0" />
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:underline">
                        {draft.form?.fullName || "Unnamed policyholder"}
                      </p>
                      <Badge
                        variant="outline"
                        className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${STATUS_BADGE[draftStatus(draft)]}`}
                      >
                        {STATUS_LABEL[draftStatus(draft)]}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {[draft.optionLabel, draft.quoteId, `Saved ${formatDate(draft.updatedAt)}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition-opacity"
                      onClick={() => navigate(`/policies/drafts/${draft.id}`)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full opacity-0 group-hover/row:opacity-100 focus:opacity-100 transition-opacity"
                      onClick={() => continueEditing(draft)}
                    >
                      Continue Editing
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-slate-400 hover:text-red-500"
                      onClick={() => {
                        removeDraft(draft.id)
                        toast.success("Draft discarded.")
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {myDrafts.length === 0 && (
                <p className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                  No conversions in progress. Start one from an annuity quote option.
                </p>
              )}
            </div>
          </div>
        ) : (
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
                    {isAdvisor && <th className="px-6 py-3 font-bold text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {rows.map((d) => {
                    const s = draftStatus(d)
                    const normalizedStatus = String(s).toLowerCase()    
                    return (
                      <tr
                        key={d.id}
                        onClick={() => navigate(`/policies/drafts/${d.id}`)}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                          {d.form?.fullName || "Unnamed policyholder"}
                          {(d.attempt || 1) > 1 && (
                            <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              Attempt {d.attempt}
                            </span>
                          )}
                          {normalizedStatus === "rejected" && d.rejectionReason && (
                             <p className="mt-1 text-xs font-normal text-red-500 max-w-sm">
                               Reason: {d.rejectionReason}
                             </p>
                           )}
                           {(d.returnReason || d.reviewNote) && normalizedStatus === "draft" && (
                             <p className="mt-1 text-xs font-normal text-amber-600 max-w-sm">
                               Returned: {d.returnReason || d.reviewNote}
                             </p>
                           )}
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
                            className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${STATUS_BADGE[s]}`}
                          >
                            {STATUS_LABEL[s]}
                          </Badge>
                        </td>
                        {isAdvisor && (
                          <td className="px-6 py-4 text-right">
                            {normalizedStatus === "draft" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  continueEditing(d)
                                }}
                              >
                                Continue Editing
                              </Button>
                            )}
                           {normalizedStatus === "rejected" &&
                              String(d.initiatedBy || "") === String(userId || "") && (
                                <Button
                                  size="sm"
                                  className="rounded-full"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    continueEditing(d)
                                  }}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Resubmit
                                </Button>
                              )}

                          </td>
                        )}
                      </tr>
                    )
                  })}
                  {rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
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
        )}
      </div>
    </div>
  )
}

export default Conversions
