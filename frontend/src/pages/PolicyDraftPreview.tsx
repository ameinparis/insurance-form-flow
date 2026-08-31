import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRightLeft,
  Check,
  CheckCircle2,
  CloudUpload,
  Download,
  FileText,
  Pencil,
  RotateCcw,
  X,
  XCircle,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AssignApproverDialog } from "@/components/policy/AssignApproverDialog"
import { useNotifications, relativeTime } from "@/hooks/useNotifications"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/authlibrary"
import { canApproveConversion, permissionsFor } from "@/lib/permissions"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  usePolicyDrafts,
  draftStatus,
  STATUS_LABEL,
  STATUS_BADGE,
} from "@/hooks/usePolicyDrafts"
import { POLICY_DOCUMENTS, parseDoc } from "@/components/policy/DocumentChecklist"
import { useSocket } from "@/hooks/useSocket"
import { formatDate } from "@/lib/quoteUtils"

type Field = { key: string; label: string }

const SECTIONS: { title: string; step: number; fields: Field[] }[] = [
  {
    title: "Policyholder Details",
    step: 0,
    fields: [
      { key: "fullName", label: "Full Name" },
      { key: "idNumber", label: "ID Number" },
      { key: "dateOfBirth", label: "Date of Birth" },
      { key: "countryOfOrigin", label: "Country of Origin" },
      { key: "email", label: "Email Address" },
      { key: "contactNumber", label: "Contact Number" },
      { key: "address", label: "Residential Address" },
    ],
  },
  {
    title: "Policy Details",
    step: 1,
    fields: [
      { key: "policyNumber", label: "Policy Number" },
      { key: "productName", label: "Product Name" },
      { key: "policyStartDate", label: "Policy Start Date" },
      { key: "transitionDate", label: "Transition Date" },
    ],
  },
  {
    title: "Premiums",
    step: 2,
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

const PolicyDraftPreview = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { drafts, saveDraft, reassignDraft, approvePolicy, returnPolicy, fetchPolicy, refresh } = usePolicyDrafts()
  const { addNotification, resolveForDraft, supersedeForDraft } = useNotifications()
  const [reassignOpen, setReassignOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectError, setRejectError] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [approveNote, setApproveNote] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [previewDoc, setPreviewDoc] = useState<{ label: string; name: string; type?: string; data?: string } | null>(null)
  const { userRole, userId, userName } = useAuth()
  const { emitApprovalResolve, onNotification } = useSocket()

  useEffect(() => {
    const unsubscribe = onNotification((n) => {
      addNotification(n)
    })
    return unsubscribe
  }, [addNotification, onNotification])

  const draft = useMemo(() => drafts.find((d) => d.id === id), [drafts, id])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetchPolicy(id)
      .then(() => setLoadError(""))
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Failed to load conversion"))
      .finally(() => setLoading(false))
  }, [fetchPolicy, id])

  const [form, setForm] = useState<Record<string, string>>(draft?.form || {})
  const [editing, setEditing] = useState<number | null>(null)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")
  const draftRef = useRef(draft)
  draftRef.current = draft
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (draft && editing === null) setForm(draft.form || {})
  }, [draft, editing])

  // Autosave edits
  useEffect(() => {
    const d = draftRef.current
    if (!d || editing === null) return
    setSaveState("saving")
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      saveDraft({
        id: d.id,
        step: d.step,
        form,
        productType: d.productType,
        optionLabel: d.optionLabel,
        quoteId: d.quoteId,
        premium: d.premium,
      })
      setSaveState("saved")
    }, 600)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, editing])

  if (!draft) {
    return (
      <div className="relative min-h-full -m-6 bg-slate-50 dark:bg-slate-900 p-6">
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {loading ? "Loading conversion…" : loadError || "This conversion no longer exists."}
          </p>
          <Button className="rounded-full mt-5" onClick={() => navigate("/conversions")}>
            Back to Conversions
          </Button>
        </div>
      </div>
    )
  }


  const isApproved = draft?.status === "approved" || draft?.status === "APPROVED"
  const isReturned = !!(draft?.returnReason || draft?.rejectionReason)
  const isPending = draft?.status === "pending_approval" || draft?.status === "PENDING_APPROVAL"
  const isSuper = permissionsFor(userRole).role === "super_admin"
  const isAssignee = String(draft?.assignedTo || "") === String(userId || "")
  const canApprove =
    canApproveConversion(userRole, userId, draft?.initiatedBy) && isPending && (isSuper || isAssignee)
  const isOwner = String(draft?.initiatedBy || "") === String(userId || "")
  const canEdit = isOwner && !isApproved && !isPending
  const canReassign =
    (isPending || isReturned) && (isSuper || isOwner)

  const beneficiaries: Record<string, string>[] = (() => {
    try {
      const parsed = form.beneficiaries ? JSON.parse(form.beneficiaries) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()
  const allocationTotal = beneficiaries.reduce(
    (sum, b) => sum + (Number(String(b.allocation ?? "0").replace(/[^0-9.]/g, "")) || 0),
    0,
  )
  const documents: Record<string, string> = (() => {
    try {
      const parsed = form.documents ? JSON.parse(form.documents) : {}
      return parsed && typeof parsed === "object" ? parsed : {}
    } catch {
      return {}
    }
  })()

  const continueEditing = () =>
    navigate("/policies/convert", {
      state: {
        draftId: draft.id,
        step: draft.step,
        form,
        productType: draft.productType,
        optionLabel: draft.optionLabel,
        quoteId: draft.quoteId,
        premium: draft.premium,
      },
    })

  return (
    <div className="relative min-h-full -m-6 bg-slate-50 dark:bg-slate-900">
      <div className="sticky top-0 z-30 px-6 pt-6 pb-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => navigate("/conversions")}
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Conversions
        </button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {form.fullName || "Unnamed policyholder"}
              </h2>
              <Badge
                variant="outline"
                className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${STATUS_BADGE[draftStatus(draft)]}`}
              >
                {STATUS_LABEL[draftStatus(draft)]}
              </Badge>
              {saveState !== "idle" && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                    saveState === "saving"
                      ? "bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-300"
                      : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                  }`}
                >
                  {saveState === "saving" ? (
                    <>
                      <CloudUpload className="h-3.5 w-3.5 animate-pulse" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Saved
                    </>
                  )}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {[
                draft.optionLabel || draft.productType,
                draft.quoteId,
                draft.initiatedByName ? `Submitted by ${draft.initiatedByName}` : null,
                draft.submittedAt ? relativeTime(draft.submittedAt) : null,
                (draft.attempt || 1) > 1 ? `Attempt ${draft.attempt}` : null,
                draft.assignedToName ? `Assigned to ${draft.assignedToName}` : null,
                `Saved ${formatDate(draft.updatedAt)}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              {isOwner && !isApproved && !canApprove && (
                <Button variant="outline" onClick={continueEditing} className="rounded-full px-6">
                  Continue Editing
                </Button>
              )}

              {isReturned && isOwner && (
                <Button onClick={continueEditing} className="rounded-full px-6">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Resubmit
                </Button>
              )}
              {canReassign && (
                <Button
                  variant="outline"
                  className="rounded-full px-6"
                  onClick={() => setReassignOpen(true)}
                >
                  Reassign
                </Button>
              )}
              {canApprove && (
                <>
                  <Button
                    variant="outline"
                    className="rounded-full px-6 text-red-500 hover:text-red-600"
                    onClick={() => setRejectOpen(true)}
                  >
                Return to Draft
                  </Button>
                  <Button
                    className="rounded-full px-6"
                    onClick={() => setApproveOpen(true)}
                  >
                    Approve Conversion
                  </Button>
                </>
              )}
            </div>
            {isPending && !canApprove && permissionsFor(userRole).canApprove && (
              <p className="text-xs text-amber-600 dark:text-amber-400 max-w-xs text-right">
                {String(draft.initiatedBy || "") === String(userId || "")
                  ? "You initiated this conversion — it needs approval from another Admin or a Super Admin."
                  : `This conversion is assigned to ${draft.assignedToName || "another reviewer"}.`}
              </p>
            )}
            {isApproved && draft.approvedByName && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Approved by {draft.approvedByName}
              </p>
            )}
            {isReturned && (
              <p className="text-xs text-amber-600 max-w-xs text-right">
                Returned by {draft.reviewedByName || draft.rejectedByName || "reviewer"}
                {draft.returnReason || draft.rejectionReason ? ` — ${draft.returnReason || draft.rejectionReason}` : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {SECTIONS.map((section, i) => {
          const isEditing = editing === i
          return (
            <div
              key={section.title}
              className="rounded-[1.75rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-7"
            >
              <div className="flex items-center justify-between gap-4 mb-5">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {section.title}
                </h3>
                {isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setEditing(null)}
                  >
                    <X className="h-4 w-4" />
                    Done
                  </Button>
                ) : canEdit ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setEditing(i)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                {section.fields.map((field) => (
                  <div
                    key={field.key}
                    className="py-2.5 border-b border-slate-100 dark:border-slate-700/60"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {field.label}
                    </p>
                    {isEditing ? (
                      <Input
                        value={form[field.key] || ""}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className="h-9 rounded-lg mt-1.5"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">
                        {form[field.key] || (
                          <span className="text-slate-400 dark:text-slate-500 italic font-normal">
                            Pending
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {section.step <= draft.step && !isEditing && (
                <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  Completed in wizard
                </p>
              )}
            </div>
          )
        })}

        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-[1.75rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-7">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-5">
              Client Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              {[
                { label: "Full Name", value: form.fullName },
                { label: "Relationship", value: form.relationship || "Policyholder" },
                { label: "Product", value: draft.optionLabel || draft.productType },
                { label: "Quote ID", value: draft.quoteId },
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

          <div className="rounded-[1.75rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-7">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Beneficiary Allocation
              </h3>
              <Badge
                variant="outline"
                className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${
                  Math.round(allocationTotal) === 100
                    ? "border-emerald-300 text-emerald-600 dark:text-emerald-400"
                    : "border-amber-300 text-amber-600 dark:text-amber-400"
                }`}
              >
                {Math.round(allocationTotal * 100) / 100}% allocated
              </Badge>
            </div>
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
        </div>

        <div className="lg:col-span-2 rounded-[1.75rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-7">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Documents</h3>
            <Badge
              variant="outline"
              className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap border-slate-300 text-slate-500 dark:text-slate-400"
            >
              {POLICY_DOCUMENTS.filter((d) => documents[d.key]).length} of {POLICY_DOCUMENTS.length} uploaded
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {POLICY_DOCUMENTS.map((d) => {
              const stored = parseDoc(documents[d.key])
              return (
                <button
                  key={d.key}
                  type="button"
                  disabled={!stored}
                  onClick={() => stored && setPreviewDoc({ label: d.label, ...stored })}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                    stored
                      ? "border-emerald-500/50 hover:bg-emerald-500/5"
                      : "border-slate-200 dark:border-slate-700 opacity-70 cursor-default"
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                        {d.label}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                        {stored?.name || (d.conditional ? "Not required" : "Missing")}
                      </span>
                    </span>
                  </span>
                  {stored && <span className="text-xs font-semibold text-[#009fe3]">Preview</span>}
                </button>
              )
            })}
          </div>
        </div>

        {(draft.reviewHistory?.length || 0) > 0 && (
          <div className="lg:col-span-2 rounded-[1.75rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-7">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
              Review History
            </h3>
            <ul className="space-y-3">
              {draft.reviewHistory!.map((r, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  {r.decision === "approved" ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
                  )}
                  <span className="text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {r.byName || "Reviewer"}
                    </span>{" "}
                    {r.decision === "approved" ? "approved" : "rejected"} attempt {r.attempt} ·{" "}
                    {formatDate(r.at)}
                    {r.note ? (
                      <span className="block text-slate-500 dark:text-slate-400">“{r.note}”</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(draft.reassignments?.length || 0) > 0 && (
          <div className="lg:col-span-2 rounded-[1.75rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-7">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
              Reassignment History
            </h3>
            <ul className="space-y-3">
              {draft.reassignments!.map((r, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <ArrowRightLeft className="h-4 w-4 mt-0.5 text-slate-400 flex-shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {r.byName || "Someone"}
                    </span>{" "}
                    reassigned from {r.fromName || "unassigned"} to{" "}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {r.toName || "unassigned"}
                    </span>{" "}
                    · {formatDate(r.at)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <AssignApproverDialog
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        title="Reassign for approval"
        description="Move this pending conversion to a different Admin or Super Admin."
        confirmLabel="Reassign"
        currentAssigneeId={draft.assignedTo}
        onConfirm={async (approver) => {
          try {
            await reassignDraft(draft.id, approver, { id: userId, name: userName })
            supersedeForDraft(draft.id)
            const notification = {
              draftId: draft.id,
              kind: "reassigned" as const,
              status: "pending" as const,
              recipientId: approver.id,
              recipientName: approver.name,
              advisorName: userName || draft.initiatedByName || "A user",
              clientName: form.fullName,
              policyType: form.productName,
            }
            addNotification(notification)
            emitApprovalResolve(notification)
            await refresh()
            toast.success(`Reassigned to ${approver.name}`)
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not reassign conversion")
          }
        }}
      />

       <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>Return to draft</DialogTitle>
           </DialogHeader>
           <Textarea
             value={rejectReason}
             onChange={(e) => setRejectReason(e.target.value)}
             onFocus={() => setRejectError(false)}
             placeholder="Give a reason for returning this conversion…"
             className="rounded-xl min-h-[110px]"
           />
           {rejectError && (
             <p className="text-xs font-semibold text-red-500 -mt-2">
               A return comment is required so the advisor knows what to fix.
             </p>
           )}
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
              <Button
                className="rounded-full bg-red-500 hover:bg-red-600 text-white"
                onClick={async () => {
                  if (!rejectReason.trim()) {
                    setRejectError(true)
                    return
                  }
                  try {
                    await returnPolicy(draft.id, rejectReason.trim())

                  resolveForDraft(
                    draft.id,
                    "rejected",
                    rejectReason.trim()
                  )

                  emitApprovalResolve({
                    draftId: draft.id,
                    kind: "returned",
                    status: "rejected",
                    recipientId: draft.initiatedBy,
                    recipientName: draft.initiatedByName,
                    advisorName: userName,
                    clientName: form.fullName,
                    policyType: form.productName,
                    reason: rejectReason.trim(),
                  })

                    await refresh()
                    setRejectOpen(false)
                    setRejectReason("")
                    toast.success("Policy conversion returned to draft")
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Could not return conversion")
                  }
                                  }}
              >
                Reject
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve conversion</DialogTitle>
          </DialogHeader>
          <Textarea
            value={approveNote}
            onChange={(e) => setApproveNote(e.target.value)}
            placeholder="Add a comment (optional)…"
            className="rounded-xl min-h-[110px]"
          />
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-full"
              onClick={async () => {
                try {
                  await approvePolicy(draft.id, approveNote.trim() || null)
                resolveForDraft(draft.id, "approved", approveNote.trim() || null)
                emitApprovalResolve({
                  draftId: draft.id,
                  kind: "approved",
                  status: "approved",
                  recipientId: draft.initiatedBy,
                  recipientName: draft.initiatedByName,
                  advisorName: userName,
                  clientName: form.fullName,
                  policyType: form.productName,
                  reason: approveNote.trim() || null,
                })
                  await refresh()
                  setApproveOpen(false)
                  setApproveNote("")
                  toast.success("Policy conversion approved")
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not approve conversion")
                }
              }}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewDoc?.label}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">{previewDoc?.name}</p>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900">
            {previewDoc?.data && previewDoc.type?.startsWith("image/") ? (
              <img src={previewDoc.data} alt={previewDoc.name} className="w-full max-h-[65vh] object-contain" />
            ) : previewDoc?.data && previewDoc.type === "application/pdf" ? (
              <iframe title={previewDoc.name} src={previewDoc.data} className="w-full h-[65vh]" />
            ) : (
              <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
                Inline preview isn’t available for this file.
              </div>
            )}
          </div>
          <DialogFooter>
            {previewDoc?.data ? (
              <a href={previewDoc.data} download={previewDoc.name} target="_blank" rel="noreferrer">
                <Button variant="outline" className="rounded-full">
                  <Download className="h-4 w-4" />
                  Download / open in new tab
                </Button>
              </a>
            ) : (
              <span className="text-xs text-slate-500">The original file was not stored for preview.</span>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PolicyDraftPreview
