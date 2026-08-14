import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft, Check, CloudUpload, CheckCircle2, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { toTitleCase } from "@/lib/quoteUtils"
import { usePolicyDrafts } from "@/hooks/usePolicyDrafts"
import { DocumentChecklist, POLICY_DOCUMENTS, REQUIRED_DOCUMENTS, parseDoc } from "@/components/policy/DocumentChecklist"

import { useFeeConfig } from "@/hooks/useFeeConfig"
import { useFundOptions } from "@/hooks/useInvestmentManagers"
import { useNotifications } from "@/hooks/useNotifications"
import { useAuth } from "@/lib/authlibrary"
import { useSocket } from "@/hooks/useSocket"
import { AssignApproverDialog } from "@/components/policy/AssignApproverDialog"

const STEPS = [
  "Policyholder Details",
  "Policy Details",
  "Premium and Policy Fees",
  "Beneficiaries",
  "Documents",
  "Investment Portfolio Setup",
  "Review",
]

const LAST_STEP = 6

const RELATIONSHIPS = ["Spouse", "Child", "Parent", "Sibling", "Other"]

const BENEFIT_OPTIONS = ["Annuity", "Lump Sum", "Annuity + Lump Sum"]

const RISK_PROFILES = ["Conservative", "Moderate", "Balanced", "Growth", "Aggressive"]

const FUNDS = [
  "Money Market Fund",
  "Botswana Bond Fund",
  "Balanced Fund",
  "Local Equity Fund",
  "Global Equity Fund",
]

const COUNTRIES = [
  "Botswana",
  "South Africa",
  "Namibia",
  "Zimbabwe",
  "Zambia",
  "Lesotho",
  "Eswatini",
  "Malawi",
  "Mozambique",
  "Kenya",
  "Nigeria",
  "Ghana",
  "Tanzania",
  "United Kingdom",
  "United States",
  "India",
  "China",
  "Other",
]

interface ConvertState {
  draftId?: string
  step?: number
  form?: Record<string, string>
  fullName?: string
  email?: string
  contactNumber?: string
  idNumber?: string
  dateOfBirth?: string
  productType?: string
  optionLabel?: string
  quoteId?: string
  premium?: number
  investmentAmount?: number | string
  purchasePremium?: number | string
  funeralPremium?: number | string
}

const todayISO = () => new Date().toISOString().slice(0, 10)

const generatePolicyNumber = () =>
  `POL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`

const asString = (v: unknown) => (v === undefined || v === null || v === "" ? "" : String(v))

const ReviewItem = ({ label, value, full }: { label: string; value?: string; full?: boolean }) => (
  <div className={full ? "md:col-span-2" : undefined}>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium break-words">{value || "\u2014"}</p>
  </div>
)

const ReviewSection = ({
  title,
  onEdit,
  badge,
  badgeTone = "muted",
  children,
}: {
  title: string
  onEdit: () => void
  badge?: string
  badgeTone?: "muted" | "success" | "warning"
  children: React.ReactNode
}) => (
  <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-muted/30 p-5 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        {badge && (
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              badgeTone === "success"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : badgeTone === "warning"
                ? "bg-red-500/15 text-red-600 dark:text-red-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="text-xs font-semibold text-[#009fe3] hover:underline"
      >
        Edit
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">{children}</div>
  </div>
)

const ConvertToPolicy = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as ConvertState) || {}
  const { drafts, saveDraft, submitForApproval } = usePolicyDrafts()
  const { addNotification } = useNotifications()
  const { userId, userName } = useAuth()
  const { emitApprovalAssign, onNotification } = useSocket()

  useEffect(() => {
    const unsubscribe = onNotification((n) => {
      addNotification(n)
    })
    return unsubscribe
  }, [addNotification, onNotification])

  const [assignOpen, setAssignOpen] = useState(false)
  const [draftId, setDraftId] = useState<string | undefined>(prefill.draftId)
  const [currentStep, setCurrentStep] = useState<number>(prefill.step ?? 0)

  const [form, setForm] = useState({
    fullName: toTitleCase(prefill.form?.fullName || prefill.fullName || "") || "",
    idNumber: prefill.form?.idNumber || prefill.idNumber || "",
    dateOfBirth: prefill.form?.dateOfBirth || prefill.dateOfBirth || "",
    email: prefill.form?.email || prefill.email || "",
    contactNumber: prefill.form?.contactNumber || prefill.contactNumber || "",
    address: prefill.form?.address || "",
    countryOfOrigin: prefill.form?.countryOfOrigin || "Botswana",
    policyNumber: prefill.form?.policyNumber || generatePolicyNumber(),
    productName: prefill.form?.productName || prefill.productType || "Annuity",
    policyStartDate: prefill.form?.policyStartDate || todayISO(),
    transitionDate: prefill.form?.transitionDate || todayISO(),
    investmentAmount:
      prefill.form?.investmentAmount ||
      asString(prefill.investmentAmount ?? prefill.purchasePremium),
    upfrontCommissionEnabled: prefill.form?.upfrontCommissionEnabled || "no",
    ongoingAdvisoryEnabled: prefill.form?.ongoingAdvisoryEnabled || "no",
    portfolioSkipped: prefill.form?.portfolioSkipped || "no",
    riskProfile: prefill.form?.riskProfile || "",
    portfolioAllocations: prefill.form?.portfolioAllocations || "",
    portfolioNotes: prefill.form?.portfolioNotes || "",
    beneficiaries: prefill.form?.beneficiaries || "[]",
    documents: prefill.form?.documents || "{}",
  })

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const first = useRef(true)

  const { config: feeConfig } = useFeeConfig()
  const configuredFunds = useFundOptions()
  const fundOptions = configuredFunds.length ? configuredFunds : FUNDS

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  // Derived premium & fee values (all based on the Investment Amount Premium)
  const investment = Number(String(form.investmentAmount).replace(/[^0-9.]/g, "")) || 0
  const fmt = (n: number) =>
    n.toLocaleString("en-BW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const purchasePremium = investment * (feeConfig.purchasePremiumPct / 100)
  const upfrontCommission = investment * (feeConfig.upfrontCommissionPct / 100)
  const administrationFee = investment * (feeConfig.administrationFeePct / 100)
  const SWITCH_FEE = feeConfig.switchFee
  const FUNERAL_PREMIUM = feeConfig.funeralPremium
  const commissionOn = form.upfrontCommissionEnabled === "yes"
  // Ongoing Advisory Fee — optional, configured percentage of the Investment Amount Premium
  const advisoryOn = form.ongoingAdvisoryEnabled === "yes"
  const advisoryPct = feeConfig.ongoingAdvisoryMaxPct
  const ongoingAdvisoryFeeAmount = advisoryOn ? investment * (advisoryPct / 100) : 0

  // Autosave the draft whenever the form or step changes
  useEffect(() => {
    if (!form.fullName.trim()) return
    if (first.current) {
      first.current = false
      return
    }
    setSaveState("saving")
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const saved = saveDraft({
        id: draftId,
        step: currentStep,
        form: {
          ...form,
          purchasePremium: purchasePremium.toFixed(2),
          upfrontCommission: commissionOn ? upfrontCommission.toFixed(2) : "",
          administrationFee: administrationFee.toFixed(2),
          switchFee: SWITCH_FEE.toFixed(2),
          funeralPremium: FUNERAL_PREMIUM.toFixed(2),
          ongoingAdvisoryFee: advisoryOn ? ongoingAdvisoryFeeAmount.toFixed(2) : "",
          ongoingAdvisoryFeeAmount: ongoingAdvisoryFeeAmount.toFixed(2),
        },
        productType: prefill.productType,
        optionLabel: prefill.optionLabel,
        quoteId: prefill.quoteId,
        premium: prefill.premium,
      })
      setDraftId(saved.id)
      setSaveState("saved")
    }, 700)
    return () => clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, currentStep])

  const allocations: Record<string, string> = (() => {
    try {
      return form.portfolioAllocations ? JSON.parse(form.portfolioAllocations) : {}
    } catch {
      return {}
    }
  })()
  const setAllocation = (fund: string, value: string) =>
    setForm((prev) => {
      let current: Record<string, string> = {}
      try {
        current = prev.portfolioAllocations ? JSON.parse(prev.portfolioAllocations) : {}
      } catch {
        current = {}
      }
      const next = { ...current, [fund]: value }
      if (!value) delete next[fund]
      return { ...prev, portfolioAllocations: JSON.stringify(next), portfolioSkipped: "no" }
    })
  const allocationTotal = Object.values(allocations).reduce(
    (sum, v) => sum + (Number(String(v).replace(/[^0-9.]/g, "")) || 0),
    0
  )

  const beneficiaries = (() => {
    try {
      return form.beneficiaries ? JSON.parse(form.beneficiaries) : []
    } catch {
      return []
    }
  })()
  const setBeneficiary = (index: number, field: string, value: string) =>
    setForm((prev) => {
      const list = (() => { try { return prev.beneficiaries ? JSON.parse(prev.beneficiaries) : [] } catch { return [] } })()
      const next = list.slice()
      next[index] = { ...(next[index] || {}), [field]: value }
      return { ...prev, beneficiaries: JSON.stringify(next) }
    })
  const addBeneficiary = () =>
    setForm((prev) => ({
      ...prev,
      beneficiaries: JSON.stringify([...beneficiaries, { name: "", relationship: "", benefitOption: "", allocation: "0" }]),
    }))
  const removeBeneficiary = (index: number) =>
    setForm((prev) => {
      const next = beneficiaries.filter((_, i) => i !== index)
      return { ...prev, beneficiaries: JSON.stringify(next) }
    })

  const beneficiaryRows: Record<string, string>[] = beneficiaries.length ? beneficiaries : [{}]
  const beneficiaryTotal = beneficiaryRows.reduce(
    (sum: number, b: Record<string, string>) => sum + (Number(String(b?.allocation ?? "").replace(/[^0-9.]/g, "")) || 0),
    0
  )
  const beneficiaryTotalValid = Math.round(beneficiaryTotal * 100) / 100 === 100

  const documents: Record<string, string> = (() => {
    try {
      return form.documents ? JSON.parse(form.documents) : {}
    } catch {
      return {}
    }
  })()
  const setDocument = (key: string, fileName: string | null) => {
    setForm((prev) => {
      let current: Record<string, string> = {}
      try {
        current = prev.documents ? JSON.parse(prev.documents) : {}
      } catch {
        current = {}
      }
      const next = { ...current }
      if (fileName) next[key] = fileName
      else delete next[key]
      return { ...prev, documents: JSON.stringify(next) }
    })
  }
  const documentsValid = REQUIRED_DOCUMENTS.every((d) => Boolean(documents[d.key]))


  const stepSubtitle =
    currentStep === 0
      ? "Confirm the policyholder details"
      : currentStep === 1
      ? "Confirm the policy details"
      : currentStep === 2
      ? "Confirm the premium and policy fees"
      : currentStep === 3
      ? "Add beneficiaries"
      : currentStep === 4
      ? "Upload the supporting documents"
      : "Set up the investment portfolio (optional)"

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-card px-6 py-4">
        <div className="flex items-center gap-3 overflow-x-auto">
          {STEPS.map((step, i) => {
            const done = i < currentStep
            const active = i === currentStep
            return (
              <div key={step} className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                        ? "bg-[#009fe3] text-white"
                        : "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span
                    className={`text-xs font-semibold whitespace-nowrap ${
                      active
                        ? "text-foreground"
                        : "text-gray-400 dark:text-slate-500"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="h-px w-10 bg-gray-200 dark:bg-slate-700" />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-card p-6 md:p-8">
        <button
          onClick={() => (currentStep === 0 ? navigate(-1) : setCurrentStep((s) => s - 1))}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Convert Quote to Policy</h1>
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
        <p className="text-sm text-muted-foreground mt-1 mb-8">
          {stepSubtitle}
          {prefill.quoteId ? ` for ${prefill.quoteId}` : ""}
          {prefill.optionLabel ? ` (${prefill.optionLabel})` : ""}.
        </p>

        {currentStep === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={form.fullName} onChange={set("fullName")} placeholder="Jane Doe" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number</Label>
              <Input id="idNumber" value={form.idNumber} onChange={set("idNumber")} placeholder="000000000" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <DatePicker
                id="dateOfBirth"
                value={form.dateOfBirth}
                onChange={(v) => setForm((prev) => ({ ...prev, dateOfBirth: v }))}
                fromYear={1900}
                toYear={new Date().getFullYear()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="countryOfOrigin">Country of Origin</Label>
              <Select
                value={form.countryOfOrigin}
                onValueChange={(v) => setForm((prev) => ({ ...prev, countryOfOrigin: v }))}
              >
                <SelectTrigger id="countryOfOrigin" className="h-11 rounded-xl">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="jane@example.com" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input id="contactNumber" value={form.contactNumber} onChange={set("contactNumber")} placeholder="+267 71 000 000" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Residential Address</Label>
              <Input id="address" value={form.address} onChange={set("address")} placeholder="Plot 123, Gaborone" className="h-11 rounded-xl" />
            </div>
          </div>
        ) : currentStep === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div className="space-y-2">
              <Label htmlFor="policyNumber">Policy Number</Label>
              <Input id="policyNumber" value={form.policyNumber} onChange={set("policyNumber")} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input id="productName" value={form.productName} onChange={set("productName")} className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policyStartDate">Policy Start Date</Label>
              <DatePicker
                id="policyStartDate"
                value={form.policyStartDate}
                onChange={(v) => setForm((prev) => ({ ...prev, policyStartDate: v }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transitionDate">Transition Date</Label>
              <DatePicker
                id="transitionDate"
                value={form.transitionDate}
                onChange={(v) => setForm((prev) => ({ ...prev, transitionDate: v }))}
              />
            </div>
          </div>
        ) : currentStep === 2 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div className="space-y-2">
              <Label htmlFor="investmentAmount">Investment Amount Premium</Label>
              <Input id="investmentAmount" inputMode="decimal" value={form.investmentAmount} onChange={set("investmentAmount")} placeholder="0.00" className="h-11 rounded-xl" />
              <p className="text-xs text-muted-foreground">Purchase premium from the quote.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchasePremium">Purchase Premium</Label>
              <Input id="purchasePremium" readOnly value={fmt(purchasePremium)} className="h-11 rounded-xl bg-muted/50" />
              <p className="text-xs text-muted-foreground">Mandatory — percentage of the investment amount.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="upfrontCommission">Upfront Commission</Label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={commissionOn}
                    onCheckedChange={(c) =>
                      setForm((prev) => ({ ...prev, upfrontCommissionEnabled: c ? "yes" : "no" }))
                    }
                  />
                  Include
                </label>
              </div>
              <Input
                id="upfrontCommission"
                readOnly
                value={commissionOn ? fmt(upfrontCommission) : "Not included"}
                className="h-11 rounded-xl bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">Optional — percentage of the investment amount.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="administrationFee">Administration Fee</Label>
              <Input id="administrationFee" readOnly value={fmt(administrationFee)} className="h-11 rounded-xl bg-muted/50" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ongoingAdvisoryFee">Ongoing Advisory Fee</Label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox
                    checked={advisoryOn}
                    onCheckedChange={(c) =>
                      setForm((prev) => ({ ...prev, ongoingAdvisoryEnabled: c ? "yes" : "no" }))
                    }
                  />
                  Include
                </label>
              </div>
              <Input
                id="ongoingAdvisoryFee"
                readOnly
                value={advisoryOn ? fmt(ongoingAdvisoryFeeAmount) : "Not included"}
                className="h-11 rounded-xl bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">Optional — percentage of the investment amount.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="switchFee">Switch Fee</Label>
              <Input id="switchFee" readOnly value={fmt(SWITCH_FEE)} className="h-11 rounded-xl bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="funeralPremium">Funeral Premium</Label>
              <Input id="funeralPremium" readOnly value={fmt(FUNERAL_PREMIUM)} className="h-11 rounded-xl bg-muted/50" />
            </div>
          </div>
        ) : currentStep === 3 ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Beneficiaries</p>
                <p className="text-xs text-muted-foreground">Add beneficiaries and set their allocation</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  beneficiaryTotalValid
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-500/15 text-red-600 dark:text-red-400"
                }`}
              >
                Total: {Math.round(beneficiaryTotal * 100) / 100}%
              </span>
            </div>

            <div className="space-y-3">
              {beneficiaryRows.map((b: Record<string, string>, idx: number) => {
                const allocation = Math.min(100, Math.max(0, Number(String(b?.allocation ?? "").replace(/[^0-9.]/g, "")) || 0))
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-card p-4 space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr_auto] gap-x-4 gap-y-4 items-end">
                      <div className="space-y-2">
                        <Label>Full name</Label>
                        <Input
                          value={b?.name ?? ""}
                          onChange={(e) => setBeneficiary(idx, "name", e.target.value)}
                          placeholder="Jane Doe"
                          className="h-11 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Relationship</Label>
                        <Select
                          value={b?.relationship ?? ""}
                          onValueChange={(v) => setBeneficiary(idx, "relationship", v)}
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {RELATIONSHIPS.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Benefit option</Label>
                        <Select
                          value={b?.benefitOption ?? ""}
                          onValueChange={(v) => setBeneficiary(idx, "benefitOption", v)}
                        >
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {BENEFIT_OPTIONS.map((o) => (
                              <SelectItem key={o} value={o}>
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove beneficiary"
                        disabled={beneficiaryRows.length <= 1}
                        onClick={() => removeBeneficiary(idx)}
                        className="h-11 w-11 rounded-xl border border-gray-200 dark:border-slate-700 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-4">
                      <Label className="text-xs text-muted-foreground shrink-0">Allocation</Label>
                      <Slider
                        value={[allocation]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(v) => setBeneficiary(idx, "allocation", String(v[0]))}
                        className="flex-1"
                      />
                      <div className="relative w-24 shrink-0">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={b?.allocation ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value
                            if (raw === "") return setBeneficiary(idx, "allocation", "")
                            const num = Math.min(100, Math.max(0, Number(raw) || 0))
                            setBeneficiary(idx, "allocation", String(num))
                          }}
                          placeholder="0"
                          className="h-10 rounded-xl pr-7 text-right"
                        />
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addBeneficiary}
              className="w-full rounded-2xl border-dashed h-12"
            >
              <Plus className="h-4 w-4" />
              Add beneficiary
            </Button>

            {!beneficiaryTotalValid && (
              <p className="text-xs text-red-500">
                Total allocation must equal exactly 100% before you can continue (currently {Math.round(beneficiaryTotal * 100) / 100}%).
              </p>
            )}
          </div>

        ) : currentStep === 4 ? (
          <div className="space-y-4">
            <DocumentChecklist documents={documents} onChange={setDocument} />
            {!documentsValid && (
              <p className="text-xs text-red-500">
                Upload all required documents (marked *) before you can continue.
              </p>
            )}
          </div>
        ) : currentStep === 5 ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-600 px-4 py-3 text-sm text-red-500">
              This step is optional. You can skip it and set up the investment portfolio later.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div className="space-y-2">
                <Label htmlFor="riskProfile">Risk Profile</Label>
                <Select
                  value={form.riskProfile}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, riskProfile: v, portfolioSkipped: "no" }))
                  }
                >
                  <SelectTrigger id="riskProfile" className="h-11 rounded-xl">
                    <SelectValue placeholder="Select a risk profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_PROFILES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolioNotes">Notes</Label>
                <Input
                  id="portfolioNotes"
                  value={form.portfolioNotes}
                  onChange={set("portfolioNotes")}
                  placeholder="Any portfolio instructions"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Fund Allocation (%)</Label>
                <span
                  className={`text-xs font-semibold ${
                    allocationTotal > 100 ? "text-red-500" : "text-muted-foreground"
                  }`}
                >
                  Total: {allocationTotal}%
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {fundOptions.map((fund) => (
                  <div key={fund} className="flex items-center gap-3">
                    <span className="flex-1 text-sm">{fund}</span>
                    <Input
                      inputMode="decimal"
                      value={allocations[fund] ?? ""}
                      onChange={(e) => setAllocation(fund, e.target.value)}
                      placeholder="0"
                      className="h-11 w-24 rounded-xl text-right"
                    />
                  </div>
                ))}
              </div>
              {allocationTotal > 100 && (
                <p className="text-xs text-red-500">Allocation cannot exceed 100%.</p>
              )}
            </div>
          </div>
        ) : currentStep === 6 ? (
          <div className="space-y-5">
            <ReviewSection title="Policyholder Details" onEdit={() => setCurrentStep(0)}>
              <ReviewItem label="Full Name" value={form.fullName} />
              <ReviewItem label="ID / Passport Number" value={form.idNumber} />
              <ReviewItem label="Date of Birth" value={form.dateOfBirth} />
              <ReviewItem label="Email" value={form.email} />
              <ReviewItem label="Contact Number" value={form.contactNumber} />
              <ReviewItem label="Country of Origin" value={form.countryOfOrigin} />
              <ReviewItem label="Address" value={form.address} full />
            </ReviewSection>

            <ReviewSection title="Policy Details" onEdit={() => setCurrentStep(1)}>
              <ReviewItem label="Policy Number" value={form.policyNumber} />
              <ReviewItem label="Product" value={form.productName} />
              <ReviewItem label="Policy Start Date" value={form.policyStartDate} />
              <ReviewItem label="Transition Date" value={form.transitionDate} />
            </ReviewSection>

            <ReviewSection title="Premium and Policy Fees" onEdit={() => setCurrentStep(2)}>
              <ReviewItem label="Investment Amount Premium" value={investment ? `BWP ${fmt(investment)}` : ""} />
              <ReviewItem label="Purchase Premium" value={`BWP ${fmt(purchasePremium)}`} />
              <ReviewItem
                label="Upfront Commission"
                value={commissionOn ? `BWP ${fmt(upfrontCommission)}` : "Not applied"}
              />
              <ReviewItem label="Administration Fee" value={`BWP ${fmt(administrationFee)}`} />
              <ReviewItem
                label="Ongoing Advisory Fee"
                value={advisoryOn ? `BWP ${fmt(ongoingAdvisoryFeeAmount)}` : "Not applied"}
              />
              <ReviewItem label="Switch Fee" value={`BWP ${fmt(SWITCH_FEE)}`} />
              <ReviewItem label="Funeral Premium" value={`BWP ${fmt(FUNERAL_PREMIUM)}`} />
            </ReviewSection>

            <ReviewSection
              title="Beneficiaries"
              onEdit={() => setCurrentStep(3)}
              badge={`Total: ${Math.round(beneficiaryTotal * 100) / 100}%`}
              badgeTone={beneficiaryTotalValid ? "success" : "warning"}
            >
              <div className="md:col-span-2 space-y-2">
                {beneficiaries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None added</p>
                ) : (
                  beneficiaries.map((b: Record<string, string>, i: number) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-card px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{b.name || "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {[b.relationship, b.benefitOption].filter(Boolean).join(" • ") || "—"}
                        </p>
                      </div>
                      <span className="text-sm font-semibold">
                        {Number(String(b.allocation ?? "0").replace(/[^0-9.]/g, "")) || 0}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </ReviewSection>

            <ReviewSection
              title="Documents"
              onEdit={() => setCurrentStep(4)}
              badge={`${POLICY_DOCUMENTS.filter((d) => documents[d.key]).length} of ${POLICY_DOCUMENTS.length} uploaded`}
              badgeTone={documentsValid ? "success" : "warning"}
            >
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {POLICY_DOCUMENTS.map((d) => (
                  <div
                    key={d.key}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-card px-4 py-2.5"
                  >
                    <span className="text-sm">{d.label}</span>
                    <span
                      className={`truncate max-w-[50%] text-xs font-medium ${
                        documents[d.key]
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {parseDoc(documents[d.key])?.name || (d.conditional ? "Not required" : "Missing")}
                    </span>
                  </div>
                ))}
              </div>
            </ReviewSection>

            <ReviewSection
              title="Investment Portfolio Setup"
              onEdit={() => setCurrentStep(5)}
              badge={form.portfolioSkipped === "yes" ? "Skipped" : `Total: ${allocationTotal}%`}
              badgeTone={form.portfolioSkipped === "yes" ? "muted" : allocationTotal === 100 ? "success" : "warning"}
            >
              {form.portfolioSkipped === "yes" ? (
                <p className="md:col-span-2 text-sm text-muted-foreground">
                  This step was skipped and can be completed later.
                </p>
              ) : (
                <>
                  <ReviewItem label="Risk Profile" value={form.riskProfile} />
                  <ReviewItem label="Notes" value={form.portfolioNotes} />
                  <div className="md:col-span-2 space-y-2">
                    {Object.keys(allocations).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No fund allocations captured</p>
                    ) : (
                      Object.entries(allocations).map(([fund, pct]) => (
                        <div
                          key={fund}
                          className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-card px-4 py-2.5"
                        >
                          <span className="text-sm">{fund}</span>
                          <span className="text-sm font-semibold">{pct}%</span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </ReviewSection>
          </div>
        ) : null}

        <div className="flex justify-between items-center gap-4 mt-10">
          <Button variant="outline" onClick={() => navigate(-1)} className="rounded-full px-6">
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => (currentStep === 0 ? navigate(-1) : setCurrentStep((s) => s - 1))}
              className="rounded-full px-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {currentStep === 5 && (
              <Button
                variant="ghost"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    portfolioSkipped: "yes",
                    riskProfile: "",
                    portfolioAllocations: "",
                    portfolioNotes: "",
                  }))
                }
                className="rounded-full px-6"
              >
                Skip this step
              </Button>
            )}
            {currentStep === LAST_STEP ? (
              <Button
                onClick={() => {
                  if (!form.fullName.trim()) {
                    toast.error("Add the policyholder's name before submitting")
                    return
                  }
                  setAssignOpen(true)
                }}
                className="rounded-full px-8 bg-slate-900 hover:bg-slate-800 text-white"
              >
                Submit for Approval
              </Button>
            ) : (
              <Button
                disabled={(currentStep === 3 && !beneficiaryTotalValid) || (currentStep === 4 && !documentsValid)}
                onClick={() => setCurrentStep((s) => Math.min(s + 1, LAST_STEP))}
                className="rounded-full px-8 bg-slate-900 hover:bg-slate-800 text-white"
              >
                Continue
              </Button>
            )}
          </div>
        </div>

        <AssignApproverDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          excludeId={userId}
          onConfirm={(approver) => {
            const saved = saveDraft({
              id: draftId,
              step: currentStep,
              form: {
                ...form,
                purchasePremium: purchasePremium.toFixed(2),
                upfrontCommission: commissionOn ? upfrontCommission.toFixed(2) : "",
                administrationFee: administrationFee.toFixed(2),
                switchFee: SWITCH_FEE.toFixed(2),
                funeralPremium: FUNERAL_PREMIUM.toFixed(2),
                ongoingAdvisoryFee: advisoryOn ? ongoingAdvisoryFeeAmount.toFixed(2) : "",
          ongoingAdvisoryFeeAmount: ongoingAdvisoryFeeAmount.toFixed(2),
              },
              productType: prefill.productType,
              optionLabel: prefill.optionLabel,
              quoteId: prefill.quoteId,
              premium: prefill.premium,
            })
            setDraftId(saved.id)
            submitForApproval(saved.id, approver)
            const notification = {
              draftId: saved.id,
              kind: "assignment" as const,
              status: "pending" as const,
              recipientId: approver.id,
              recipientName: approver.name,
              advisorName: userName || saved.initiatedByName || "An advisor",
              clientName: form.fullName,
              policyType: form.productName,
            }
            addNotification(notification)
            emitApprovalAssign(notification)
            toast.success(`Submitted to ${approver.name} for approval`)
            navigate("/clients")
          }}
        />

      </div>
    </div>
  )
}

export default ConvertToPolicy
