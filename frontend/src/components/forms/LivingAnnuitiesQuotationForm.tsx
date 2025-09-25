import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

type LivingResult = {
  guarantee_period: number
  guaranteed_annuity: number
  funds_remaining: number
}
type LifeResult = { monthly_annuity: number }

const MIN_AGE = 50
const MAX_AGE = 85
const MIN_INVEST = 300000

const toNum = (s: string) => (s === "" ? NaN : Number(s))
const fmtMoney = (n: number, d = 0) =>
  isFinite(n) ? `BWP ${n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}` : "—"

// currency helpers
const formatCurrencyInput = (raw: string) => {
  const num = parseFloat(raw.replace(/[^0-9.]/g, ""))
  if (isNaN(num)) return ""
  return "BWP " + num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}
const unformatCurrencyInput = (val: string) => val.replace(/[^0-9.]/g, "")

/* ---------------- MOCK CALCS ---------------- */
const calcLiving = (p: {
  age: number
  purchaseAmount: number
  frequency: "Monthly" | "Annual"
  drawdownPct: number
  guaranteedStartAge: number
}): LivingResult => {
  const { age, purchaseAmount, frequency, drawdownPct, guaranteedStartAge } = p
  const years = Math.max(0, Math.floor(guaranteedStartAge - age))
  const r = 0.05
  let balance = purchaseAmount
  for (let y = 0; y < years; y++) {
    const withdrawal = balance * (drawdownPct / 100)
    balance = Math.max(0, (balance - withdrawal) * (1 + r))
  }
  const annualPayout = purchaseAmount * (drawdownPct / 100)
  const perPeriod = frequency === "Monthly" ? annualPayout / 12 : annualPayout
  return {
    guarantee_period: years,
    guaranteed_annuity: perPeriod,
    funds_remaining: Math.max(0, Math.round(balance)),
  }
}

const calcLife = (p: { startAge: number; purchaseAmount: number }): LifeResult => {
  const terminalAge = 85
  const months = Math.max(0, Math.round((terminalAge - p.startAge) * 12))
  const monthly = months > 0 ? p.purchaseAmount / months : 0
  return { monthly_annuity: monthly }
}
/* -------------------------------------------------------------------- */

const AnnuityQuotationForm = () => {
  const [age, setAge] = useState("")
  const [amountRaw, setAmountRaw] = useState("")
  const [frequency, setFrequency] = useState<"Monthly" | "Annual">("Monthly")
  const [drawdown, setDrawdown] = useState("")
  const [guaranteedStartAge, setGuaranteedStartAge] = useState("")

  const [livingLoading, setLivingLoading] = useState(false)
  const [livingResult, setLivingResult] = useState<LivingResult | null>(null)

  const [showLifeForm, setShowLifeForm] = useState(false)
  const [lifePurchaseAmount, setLifePurchaseAmount] = useState("")
  const [lifeLoading, setLifeLoading] = useState(false)
  const [lifeResult, setLifeResult] = useState<LifeResult | null>(null)

  const annuityType = "combined"

  // validations
  const aNum = toNum(age)
  const amtNum = toNum(amountRaw)
  const gsaNum = toNum(guaranteedStartAge)
  const drawNum = toNum(drawdown)

  const ageError = age !== "" && (aNum < MIN_AGE || aNum > MAX_AGE)
    ? `Starting age must be between ${MIN_AGE} and ${MAX_AGE}.`
    : ""

  const amountError = amountRaw !== "" && amtNum < MIN_INVEST
    ? `Minimum investment is BWP ${MIN_INVEST.toLocaleString()}.`
    : ""

  const gsaError = guaranteedStartAge !== "" && Number.isFinite(aNum) && gsaNum <= aNum
    ? `Life start age must be greater than current age.`
    : ""

  const drawError = drawdown !== "" && (drawNum < 2.5 || drawNum > 17.5)
    ? "Drawdown must be between 2.5% and 17.5%."
    : ""

  const livingDisabled =
    ![aNum, amtNum, drawNum, gsaNum].every(Number.isFinite) ||
    !!ageError || !!amountError || !!gsaError || !!drawError

  const lifeDisabled = !livingResult || !Number.isFinite(toNum(lifePurchaseAmount)) || toNum(lifePurchaseAmount) <= 0

  // handlers
  const handleLivingCalc = () => {
    if (livingDisabled) {
      toast.error([ageError, amountError, gsaError, drawError].filter(Boolean).join(" "))
      return
    }
    setLivingLoading(true)
    setTimeout(() => {
      const res = calcLiving({
        age: aNum,
        purchaseAmount: amtNum,
        frequency,
        drawdownPct: drawNum,
        guaranteedStartAge: gsaNum,
      })
      setLivingResult(res)
      setShowLifeForm(true)
      setLifeResult(null)
      setLifePurchaseAmount(String(res.funds_remaining))
      setLivingLoading(false)
      toast.success("Living annuity calculated")
    }, 250)
  }

  const handleLifeCalc = () => {
    if (lifeDisabled) {
      toast.error("Please check the Life Annuity inputs.")
      return
    }
    setLifeLoading(true)
    setTimeout(() => {
      const res = calcLife({
        startAge: gsaNum,
        purchaseAmount: toNum(lifePurchaseAmount),
      })
      setLifeResult(res)
      setLifeLoading(false)
      toast.success("Life annuity calculated")
    }, 250)
  }

  const handleCreateQuote = () => {
    if (!livingResult) {
      toast.error("Calculate the Living Annuity first.")
      return
    }
    toast.success("Quote ready (wire up API later).")
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Step 1 */}
      <Card>
        <CardHeader>
          <CardTitle>Living Annuity Setup</CardTitle>
          <CardDescription>Step 1: calculate living annuity and funds remaining.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Age at start</Label>
              <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
              {ageError && <p className="text-sm text-red-600">{ageError}</p>}
            </div>
            <div className="space-y-1">
              <Label>Purchase Amount</Label>
              <Input
                type="text"
                value={formatCurrencyInput(amountRaw)}
                onChange={(e) => setAmountRaw(unformatCurrencyInput(e.target.value))}
              />
              {amountError && <p className="text-sm text-red-600">{amountError}</p>}
            </div>
            <div className="space-y-1">
              <Label>Drawdown %</Label>
              <Input type="number" value={drawdown} onChange={(e) => setDrawdown(e.target.value)} />
              {drawError && <p className="text-sm text-red-600">{drawError}</p>}
            </div>
            <div className="space-y-1">
              <Label>Life Start Age</Label>
              <Input type="number" value={guaranteedStartAge} onChange={(e) => setGuaranteedStartAge(e.target.value)} />
              {gsaError && <p className="text-sm text-red-600">{gsaError}</p>}
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as "Monthly" | "Annual")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex gap-3">
              <Button onClick={handleLivingCalc} disabled={livingLoading || livingDisabled}>
                {livingLoading ? "Calculating..." : "Calculate"}
              </Button>
            </div>
          </div>

          {livingResult && (
            <div className="mt-6 rounded-lg border p-4 bg-muted/50 text-sm">
              <div><strong>Guarantee Period:</strong> {livingResult.guarantee_period}</div>
              <div><strong>Living Annuity:</strong> {fmtMoney(livingResult.guaranteed_annuity, 0)} / {frequency}</div>
              <div><strong>Funds Remaining at {guaranteedStartAge}:</strong> {fmtMoney(livingResult.funds_remaining, 0)}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2 */}
      <Card className={showLifeForm ? "" : "opacity-60 pointer-events-none"}>
        <CardHeader>
          <CardTitle>Life Annuity Setup</CardTitle>
          <CardDescription>Step 2: calculate monthly life annuity using funds remaining.</CardDescription>
        </CardHeader>
        <CardContent>
          {showLifeForm && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Life Purchase Amount</Label>
                <Input type="number" value={lifePurchaseAmount} onChange={(e) => setLifePurchaseAmount(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Life Start Age</Label>
                <Input type="number" value={guaranteedStartAge} onChange={(e) => setGuaranteedStartAge(e.target.value)} />
              </div>
              <div className="col-span-2 flex gap-3 mt-4">
                <Button onClick={handleLifeCalc} disabled={lifeLoading || lifeDisabled}>
                  {lifeLoading ? "Calculating..." : "Calculate Life Annuity"}
                </Button>
              </div>
              {lifeResult && (
                <div className="col-span-2 mt-4 rounded-lg border p-4 bg-muted/50 text-sm">
                  <strong>Monthly Life Annuity:</strong> {fmtMoney(lifeResult.monthly_annuity, 0)}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="secondary" onClick={() => {
          setAge(""); setAmountRaw(""); setFrequency("Monthly"); setDrawdown(""); setGuaranteedStartAge("")
          setLivingResult(null); setShowLifeForm(false); setLifePurchaseAmount(""); setLifeResult(null)
        }}>
          Reset
        </Button>
        <Button onClick={handleCreateQuote} disabled={!livingResult}>
          Create Quote
        </Button>
      </div>
    </div>
  )
}

export default AnnuityQuotationForm
