import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Check, CheckCircle2, CloudUpload, Pencil, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/authlibrary"
import { canApproveConversion, permissionsFor } from "@/lib/permissions"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { usePolicyDrafts } from "@/hooks/usePolicyDrafts"
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
      { key: "upfrontCommission", label: "Upfront Commission %" },
      { key: "administrationFee", label: "Administration Fee" },
      { key: "ongoingAdvisoryFee", label: "Ongoing Advisory Fee %" },
      { key: "switchFee", label: "Switch Fee" },
      { key: "funeralPremium", label: "Funeral Premium" },
    ],
  },
]

const PolicyDraftPreview = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { drafts, saveDraft, approveDraft } = usePolicyDrafts()
  const { userRole, userId, userName } = useAuth()
  const draft = useMemo(() => drafts.find((d) => d.id === id), [drafts, id])

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
          <p className="text-sm text-slate-500 dark:text-slate-400">This draft no longer exists.</p>
          <Button className="rounded-full mt-5" onClick={() => navigate("/clients")}>
            Back to Clients
          </Button>
        </div>
      </div>
    )
  }


  const isApproved = draft?.status === "approved"
  const canApprove = canApproveConversion(userRole, userId, draft?.initiatedBy)

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
          onClick={() => navigate("/clients")}
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {form.fullName || "Unnamed policyholder"}
              </h2>
              <Badge
                variant="outline"
                className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${
                  isApproved
                    ? "border-emerald-300 text-emerald-600 dark:text-emerald-400"
                    : "border-amber-300 text-amber-600 dark:text-amber-400"
                }`}
              >
                {isApproved ? "Approved" : "Draft"}
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
              {[draft.optionLabel, draft.quoteId, `Saved ${formatDate(draft.updatedAt)}`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={continueEditing} className="rounded-full px-6">
                Continue Editing
              </Button>
              {!isApproved && canApprove && (
                <Button
                  className="rounded-full px-6"
                  onClick={() => {
                    approveDraft(draft.id, { id: userId, name: userName })
                    toast.success("Policy conversion approved")
                  }}
                >
                  Approve Conversion
                </Button>
              )}
            </div>
            {!isApproved && !canApprove && permissionsFor(userRole).canApprove && (
              <p className="text-xs text-amber-600 dark:text-amber-400 max-w-xs text-right">
                You initiated this conversion — it needs approval from another Admin or a Super Admin.
              </p>
            )}
            {isApproved && draft.approvedByName && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Approved by {draft.approvedByName}
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
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setEditing(i)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
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
      </div>
    </div>
  )
}

export default PolicyDraftPreview
