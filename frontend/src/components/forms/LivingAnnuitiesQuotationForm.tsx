import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

// currency helpers (BWP)
const formatCurrencyInput = (raw: string) => {
  const num = parseFloat(raw.replace(/[^0-9.]/g, ""))
  if (isNaN(num)) return ""
  return "BWP " + num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}
const unformatCurrencyInput = (val: string) => val.replace(/[^0-9.]/g, "")

/* ---------------- MOCK CALCS (replace with API later) ---------------- */
const calcLiving = (p: {
  age: number
  purchaseAmount: number
  frequency: "Monthly" | "Annual"
  drawdownPct: number
  guaranteedStartAge: number
}): LivingResult => {
  const { age, purchaseAmount, frequency, drawdownPct, guaranteedStartAge } = p
  const years = Math.max(0, Math.floor(guaranteedStartAge - age))
  const r = 0.05 // placeholder growth
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

export default function AnnuityCalculatorShadcn() {
  // step 1
  const [age, setAge] = useState("")
  const [amountRaw, setAmountRaw] = useState("") // numeric string (no "BWP")
  const [frequency, setFrequency] = useState<"Monthly" | "Annual">("Monthly")
  const [drawdown, setDrawdown] = useState("")
  const [guaranteedStartAge, setGuaranteedStartAge] = useState("")
  const [livingLoading, setLivingLoading] = useState(false)
  const [livingResult, setLivingResult] = useState<LivingResult | null>(null)

  // step 2
  const [showLifeForm, setShowLifeForm] = useState(false)
  const [lifePurchaseAmount, setLifePurchaseAmount] = useState("")
  const [lifeLoading, setLifeLoading] = useState(false)
  const [lifeResult, setLifeResult] = useState<LifeResult | null>(null)

  const annuityType = "combined"

  // ----- validations (live) -----
  const aNum = toNum(age)
  const amtNum = toNum(amountRaw)
  const gsaNum = toNum(guaranteedStartAge)
  const drawNum = toNum(drawdown)

  const ageError =
    age !== "" && (aNum < MIN_AGE || aNum > MAX_AGE)
      ? `Starting age must be between ${MIN_AGE} and ${MAX_AGE}.`
      : ""

  const amountError =
    amountRaw !== "" && amtNum < MIN_INVEST
      ? `Minimum investment is BWP ${MIN_INVEST.toLocaleString()}.`
      : ""

  const gsaError =
    guaranteedStartAge !== "" && Number.isFinite(aNum) && gsaNum <= aNum
      ? `Life start age must be greater than current age.`
      : ""

  const drawError =
    drawdown !== "" && (drawNum < 2.5 || drawNum > 17.5)
      ? "Drawdown must be between 2.5% and 17.5%."
      : ""

  const livingDisabled =
    ![aNum, amtNum, drawNum, gsaNum].every(Number.isFinite) ||
    !!ageError ||
    !!amountError ||
    !!gsaError ||
    !!drawError

  const lifeDisabled = !livingResult || !Number.isFinite(toNum(lifePurchaseAmount)) || toNum(lifePurchaseAmount) <= 0

  const showErrorsToast = () => {
    const errs = [ageError, amountError, gsaError, drawError].filter(Boolean)
    if (errs.length) toast.error(errs.join(" "))
  }

  // ----- handlers -----
  const handleLivingCalc = () => {
    if (livingDisabled) {
      showErrorsToast()
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
      setLifePurchaseAmount(String(res.funds_remaining)) // seed step 2
      setLivingLoading(false)
      toast.success("Living annuity calculated")

      localStorage.setItem("quoteData", JSON.stringify({
        age,
        amount: amountRaw,
        frequency,
        annuityType,
        drawdown,
        guaranteedStartAge,
        result: res,
      }))
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

      const existing = JSON.parse(localStorage.getItem("quoteData") || "{}")
      localStorage.setItem("quoteData", JSON.stringify({
        ...existing,
        lifePurchaseAmount,
        lifeAnnuityOutput: res,
      }))
    }, 250)
  }

  const handleCreateQuote = () => {
    if (!livingResult) {
      toast.error("Calculate the Living Annuity first.")
      return
    }
    toast.success("Quote ready (stored in localStorage as 'quoteData'). Wire up navigation/API later.")
  }

  return (
    <div className="max-w-5xl mx-auto grid gap-6">
      {/* STEP 1 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Living Annuity Calculator</CardTitle>
          <CardDescription>Step 1: calculate your living annuity and funds remaining.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2">
            {/* Age at start */}
            <div className="space-y-2">
              <Label htmlFor="age">Age at start of Living Annuity</Label>
              <Input
                id="age"
                type="number"
                min={MIN_AGE}
                max={MAX_AGE}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                aria-invalid={!!ageError}
                aria-describedby={ageError ? "age-error" : undefined}
                className={ageError ? "border-red-500 focus-visible:ring-red-500" : ""}
                required
              />
              {ageError ? (
                <p id="age-error" className="text-sm text-red-600">{ageError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Allowed range: {MIN_AGE}–{MAX_AGE}</p>
              )}
            </div>

            {/* Purchase amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Living Annuity Purchase Amount</Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                value={formatCurrencyInput(amountRaw)}
                onChange={(e) => setAmountRaw(unformatCurrencyInput(e.target.value))}
                aria-invalid={!!amountError}
                aria-describedby={amountError ? "amount-error" : undefined}
                className={amountError ? "border-red-500 focus-visible:ring-red-500" : ""}
                required
              />
              {amountError ? (
                <p id="amount-error" className="text-sm text-red-600">{amountError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Minimum investment: {fmtMoney(MIN_INVEST, 0)}</p>
              )}
            </div>

            {/* Drawdown */}
            <div className="space-y-2">
              <Label htmlFor="drawdown">Living Annuity Drawdown Percentage (%)</Label>
              <Input
                id="drawdown"
                type="number"
                step="0.1"
                value={drawdown}
                onChange={(e) => setDrawdown(e.target.value)}
                aria-invalid={!!drawError}
                aria-describedby={drawError ? "draw-error" : undefined}
                className={drawError ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder="2.5 – 17.5"
                required
              />
              {drawError && <p id="draw-error" className="text-sm text-red-600">{drawError}</p>}
            </div>

            {/* Life start age */}
            <div className="space-y-2">
              <Label htmlFor="gsa">Age at which Life Guaranteed amount starts for Life</Label>
              <Input
                id="gsa"
                type="number"
                value={guaranteedStartAge}
                onChange={(e) => setGuaranteedStartAge(e.target.value)}
                aria-invalid={!!gsaError}
                aria-describedby={gsaError ? "gsa-error" : undefined}
                className={gsaError ? "border-red-500 focus-visible:ring-red-500" : ""}
                required
              />
              {gsaError && <p id="gsa-error" className="text-sm text-red-600">{gsaError}</p>}
            </div>

            {/* Frequency */}
            <div className="space-y-2 md:col-span-2">
              <Label>Annual / Monthly</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as "Monthly" | "Annual")}>
                <SelectTrigger className={`w-full md:max-w-xs`}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <Button type="button" onClick={handleLivingCalc} disabled={livingLoading || livingDisabled}>
                {livingLoading ? "Calculating..." : "Calculate"}
              </Button>

              {livingResult && !showLifeForm && (
                <Button type="button" variant="secondary" onClick={() => setShowLifeForm(true)}>
                  Calculate Life Annuity
                </Button>
              )}
            </div>
          </form>

          {livingResult && (
            <div className="mt-6 rounded-lg border p-4 bg-muted/50">
              <h4 className="font-semibold mb-3">Living Annuity Results</h4>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div><strong>Guarantee Period:</strong> {livingResult.guarantee_period}</div>
                <div>
                  <strong>Living Annuity {frequency === "Monthly" ? "per Month" : "per Annum"} between {age} and {guaranteedStartAge}:</strong>{" "}
                  {fmtMoney(livingResult.guaranteed_annuity, 0)}
                </div>
                <div><strong>Funds Remaining at Age {guaranteedStartAge}:</strong> {fmtMoney(livingResult.funds_remaining, 0)}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* STEP 2 */}
      <Card className={showLifeForm ? "" : "opacity-60 pointer-events-none"}>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Life Annuity</CardTitle>
          <CardDescription>Step 2: use funds remaining to calculate a monthly life annuity.</CardDescription>
        </CardHeader>
        <CardContent>
          {showLifeForm && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lifeAmt">Life Annuity Purchase Amount</Label>
                  <Input
                    id="lifeAmt"
                    type="number"
                    value={lifePurchaseAmount}
                    onChange={(e) => setLifePurchaseAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lifeStart">Age at which Life Guaranteed amount starts for Life</Label>
                  <Input
                    id="lifeStart"
                    type="number"
                    value={guaranteedStartAge}
                    onChange={(e) => setGuaranteedStartAge(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <Button type="button" onClick={handleLifeCalc} disabled={lifeLoading || lifeDisabled}>
                  {lifeLoading ? "Calculating..." : "Calculate Life Annuity"}
                </Button>
              </div>

              {lifeResult && (
                <div className="mt-6 rounded-lg border p-4 bg-muted/50">
                  <h4 className="font-semibold mb-3">Life Annuity Results</h4>
                  <p className="text-sm">
                    <strong>Monthly Retirement Annuity starting at age {guaranteedStartAge}:</strong> {fmtMoney(lifeResult.monthly_annuity, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: placeholder method divides purchase amount evenly over months to age 85. Replace with your backend model.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            setAge(""); setAmountRaw(""); setFrequency("Monthly"); setDrawdown(""); setGuaranteedStartAge("")
            setLivingResult(null); setShowLifeForm(false); setLifePurchaseAmount(""); setLifeResult(null)
          }}
        >
          Reset
        </Button>
        <Button onClick={handleCreateQuote} disabled={!livingResult}>
          Create Quote
        </Button>
      </div>
    </div>
  )
}
