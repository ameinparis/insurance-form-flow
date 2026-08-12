import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft, Check, CloudUpload, CheckCircle2 } from "lucide-react"
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
import { toTitleCase } from "@/lib/quoteUtils"
import { usePolicyDrafts } from "@/hooks/usePolicyDrafts"

const STEPS = [
  "Policyholder Details",
  "Policy Details",
  "Premium and Policy Fees",
  "Investment Portfolio Setup",
  "Beneficiaries",
  "Review",
]

const LAST_STEP = 3

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

const ConvertToPolicy = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as ConvertState) || {}
  const { saveDraft } = usePolicyDrafts()
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
    ongoingAdvisoryFee: prefill.form?.ongoingAdvisoryFee || "",
    portfolioSkipped: prefill.form?.portfolioSkipped || "no",
    riskProfile: prefill.form?.riskProfile || "",
    portfolioAllocations: prefill.form?.portfolioAllocations || "",
    portfolioNotes: prefill.form?.portfolioNotes || "",
  })

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const first = useRef(true)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  // Derived premium & fee values (all based on the Investment Amount Premium)
  const investment = Number(String(form.investmentAmount).replace(/[^0-9.]/g, "")) || 0
  const fmt = (n: number) =>
    n.toLocaleString("en-BW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const purchasePremium = investment * 0.02
  const upfrontCommission = investment * 0.01
  const administrationFee = investment * 0.00083
  const SWITCH_FEE = 180
  const FUNERAL_PREMIUM = 20
  const commissionOn = form.upfrontCommissionEnabled === "yes"

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

  const stepSubtitle =
    currentStep === 0
      ? "Confirm the policyholder details"
      : currentStep === 1
      ? "Confirm the policy details"
      : currentStep === 2
      ? "Confirm the premium and policy fees"
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
              <Label htmlFor="purchasePremium">Purchase Premium (2%)</Label>
              <Input id="purchasePremium" readOnly value={fmt(purchasePremium)} className="h-11 rounded-xl bg-muted/50" />
              <p className="text-xs text-muted-foreground">Mandatory — 2% of the investment amount.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="upfrontCommission">Upfront Commission (1%)</Label>
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
              <p className="text-xs text-muted-foreground">Optional — 1% of the investment amount.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="administrationFee">Administration Fee (0.083%)</Label>
              <Input id="administrationFee" readOnly value={fmt(administrationFee)} className="h-11 rounded-xl bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ongoingAdvisoryFee">Ongoing Advisory Fee %</Label>
              <Input id="ongoingAdvisoryFee" inputMode="decimal" value={form.ongoingAdvisoryFee} onChange={set("ongoingAdvisoryFee")} placeholder="0" className="h-11 rounded-xl" />
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
        )}

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
            <Button
              disabled={currentStep >= LAST_STEP}
              onClick={() => setCurrentStep((s) => Math.min(s + 1, LAST_STEP))}
              className="rounded-full px-8 bg-slate-900 hover:bg-slate-800 text-white"
            >
              Continue
            </Button>
          </div>
        </div>


      </div>
    </div>
  )
}

export default ConvertToPolicy
