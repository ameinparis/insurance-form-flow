import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Loader2, CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import axios from "axios"

type LivingResult = {
  guarantee_period: number
  guaranteed_annuity: number
  funds_remaining: number
  retirement_annuity: number
}

type LifeResult = { monthly_annuity: number }

const MIN_AGE = 45
const MAX_AGE = 85
const MIN_INVEST = 300000

const toNum = (s: string) => (s === "" ? NaN : Number(s))
const fmtMoney = (n: number, d = 0) =>
  isFinite(n) ? `BWP ${n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}` : "—"

const formatCurrencyInput = (raw: string) => {
  const num = parseFloat(raw.replace(/[^0-9.]/g, ""))
  if (isNaN(num)) return ""
  return "BWP " + num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}
const unformatCurrencyInput = (val: string) => val.replace(/[^0-9.]/g, "")

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
  const [upfrontCommission, setUpfrontCommission] = useState("")
  const [ongoingCommission, setOngoingCommission] = useState("")

  const [showQuoteDialog, setShowQuoteDialog] = useState(false)
  const [customerDetails, setCustomerDetails] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    idNumber: "",
    contactNumber: "",
    email: ""
  })
  const termsAndConditions = `
This quotation outlines the guaranteed monthly income you could receive from a conventional life annuity,
as well as the projected monthly income from a living annuity based on various drawdown rates. The income
from the life annuity is affected by the prevailing interest rates at the time of the quote. Please note
that Exclusive Life reserves the right to adjust any annuity income before the first payment.

The income you receive during the living annuity phase is guaranteed until the transition date. However,
you can change your annual drawdown rate on each policy anniversary, subject to policy limits. The income
you earn after the transition date will be recalculated as of the transition date and will depend on your
chosen drawdown rate, future investment returns, and any fees applicable to your fund.

All annuity income is subject to taxation under Botswana income tax laws. The applicable tax rate is
determined by your total monthly income, according to the PAYE tax tables issued by the Commissioner of
Taxes. If there are any changes to the legislation, Exclusive Life Insurance will adjust the tax deducted
accordingly.

This quotation is confidential, and any unauthorized alterations will render it invalid. Exclusive Life
Insurance will not accept liability for any losses incurred as a result of using an altered quotation.
`.trim()


  // validations
  const aNum = toNum(age)
  const amtNum = toNum(amountRaw)
  const gsaNum = toNum(guaranteedStartAge)
  const drawNum = toNum(drawdown)
  const upfrontNum = toNum(upfrontCommission)
  const ongoingNum = toNum(ongoingCommission)

  const ageError = age !== "" && (aNum < MIN_AGE || aNum > MAX_AGE)
    ? `Starting age must be between ${MIN_AGE} and ${MAX_AGE}.`
    : ""

  const amountError = amountRaw !== "" && amtNum < MIN_INVEST
    ? `Minimum investment is BWP ${MIN_INVEST.toLocaleString()}.`
    : ""

  const gsaError = guaranteedStartAge !== "" && Number.isFinite(aNum) && gsaNum <= aNum
    ? `Life start age must be greater than current age.`
    : ""

  const drawError = drawdown !== "" && (drawNum < 0 || drawNum > 12)
    ? "Maximun drawdown rate is 12%."
    : ""

  const upfrontError =
    upfrontCommission !== "" && (upfrontNum < 0 || upfrontNum > 1.5)
      ? "The annuity percentage must be between 0.0% and 1.5% per annum."
      : ""

  const ongoingError =
    ongoingCommission !== "" && (ongoingNum < 0 || ongoingNum > 1.0)
      ? "The annuity percentage must be between 0.0% and 1.0% per annum."
      : ""

  const livingDisabled =
    ![aNum, amtNum, drawNum, gsaNum].every(Number.isFinite) ||
    !!ageError || !!amountError || !!gsaError || !!drawError ||
    !!upfrontError || !!ongoingError


  const lifeDisabled = !livingResult || !Number.isFinite(toNum(lifePurchaseAmount)) || toNum(lifePurchaseAmount) <= 0

  
  // === BACKEND CALLS ===
  const handleLivingCalc = async () => {
    if (livingDisabled) {
      toast.error([ageError, amountError, gsaError, drawError].filter(Boolean).join(" "))
      return
    }
    setLivingLoading(true)
    try {
      const safeNum = (n: number) => (Number.isFinite(n) ? n : undefined)

      const payload = {
        annuityType: "combined",
        age: aNum,
        purchaseAmount: amtNum,
        frequency,
        drawdown: drawNum,
        guaranteedStartAge: gsaNum,
        upfrontCommission: safeNum(upfrontNum),
        ongoingCommission: safeNum(ongoingNum),
      }

      const { data } = await axios.post("https://njs.exclusivelife.co.bw/api/quotes/calculate-annuity", payload)
      const res = data.output

      setLivingResult(res)
      setShowLifeForm(true)
      setLifeResult(null)
      setLifePurchaseAmount(String(res.funds_remaining))
      toast.success("Living annuity calculated")
    } catch (e: any) {
      console.error(e)
      toast.error("Failed to calculate living annuity")
    } finally {
      setLivingLoading(false)
    }
  }

  const handleLifeCalc = async () => {
    if (lifeDisabled) {
      toast.error("Please check the Life Annuity inputs.")
      return
    }
    setLifeLoading(true)
    try {
      const payload = {
        annuityType: "life",
        age: gsaNum,
        purchaseAmount: toNum(lifePurchaseAmount),
      }
      const { data } = await axios.post("https://njs.exclusivelife.co.bw/api/quotes/calculate-annuity", payload)
      const res = data.output

      setLifeResult(res)
      toast.success("Life annuity calculated")
    } catch (e: any) {
      console.error(e)
      toast.error("Failed to calculate life annuity")
    } finally {
      setLifeLoading(false)
    }
  }

  const handleCreateQuote = () => {
    if (!livingResult) {
      toast.error("Calculate the Living Annuity first.")
      return
    }
    setShowQuoteDialog(true)
  }

  const handleCustomerDetailsChange = (field: string, value: string) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }))
  }

  const handleFinalQuoteSubmit = async () => {
    const requiredFields = ['fullName', 'dateOfBirth', 'idNumber', 'contactNumber', 'email']
    const missingFields = requiredFields.filter(field => !customerDetails[field])

    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`)
      return
    }

    try {
      const safeNum = (n: number) => (Number.isFinite(n) ? n : undefined)

      // 🔹 Construct the payload (similar to the funeral one)
      const payload = {
        productType: "Exclusive Annuity",
        client: customerDetails,
        inputs: {
          age: toNum(age),
          purchaseAmount: toNum(amountRaw),
          drawdown: toNum(drawdown),
          frequency,
          guaranteedStartAge: toNum(guaranteedStartAge),
          lifePurchaseAmount: toNum(lifePurchaseAmount),
          upfrontCommission: safeNum(upfrontNum),
          ongoingCommission: safeNum(ongoingNum),

        },
        outputs: {
          living: livingResult,
          life: lifeResult,
        },
        termsAndConditions,


      }

      // 🔹 Send to the backend
      const { data } = await axios.post(
        "https://njs.exclusivelife.co.bw/api/new-quotes",
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      toast.success(`Quote ${data.quoteId} created successfully!`)
      setShowQuoteDialog(false)

    } catch (error: any) {
      console.error("Error saving quote:", error)
      toast.error("Failed to save quote. Please try again.")
    }
  }


  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Step 1: Living Annuity */}
      <Card>
        <CardHeader>
          <CardTitle>Living Annuity</CardTitle>
          <CardDescription>Step 1: calculate living annuity and funds remaining.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Age at start of Living Annuity<span className="text-red-500">*</span></Label>
              <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
              {ageError && <p className="text-sm text-red-600">{ageError}</p>}
            </div>
            <div>
              <Label>Living Annuity Purchase Amount<span className="text-red-500">*</span></Label>
              <Input
                type="text"
                value={formatCurrencyInput(amountRaw)}
                onChange={(e) => setAmountRaw(unformatCurrencyInput(e.target.value))}
              />
              {amountError && <p className="text-sm text-red-600">{amountError}</p>}
            </div>
            <div>
              <Label>Living Annuity Drawdown Percentage (%)<span className="text-red-500">*</span></Label>
              <Input type="number" value={drawdown} onChange={(e) => setDrawdown(e.target.value)} />
              {drawError && <p className="text-sm text-red-600">{drawError}</p>}
            </div>
            <div>
              <Label>Age at which Life Guaranteed amount starts for Life<span className="text-red-500">*</span></Label>
              <Input type="number" value={guaranteedStartAge} onChange={(e) => setGuaranteedStartAge(e.target.value)} />
              {gsaError && <p className="text-sm text-red-600">{gsaError}</p>}
            </div>
            <div className="col-span-2">
              <Label>Annual / Monthly<span className="text-red-500">*</span></Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as "Monthly" | "Annual")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Upfront Commission (% - Year 1 only)</Label>
              <Input
                type="number"
                value={upfrontCommission}
                onChange={(e) => setUpfrontCommission(e.target.value)}
                placeholder="e.g. 0.1"
                min={0}
                max={1.5}
                step="0.01"
              />
              {upfrontError && <p className="text-xs text-red-600 mt-1">{upfrontError}</p>}

              <p className="text-xs text-muted-foreground mt-1">
                Optional – leave blank if no commission applies.
              </p>
            </div>

            <div>
              <Label>Ongoing Commission (% - Year 2+)</Label>
              <Input
                type="number"
                value={ongoingCommission}
                onChange={(e) => setOngoingCommission(e.target.value)}
                placeholder="e.g. 1.0"
                min={0}
                max={1.0}
                step="0.01"
              />
              {ongoingError && <p className="text-xs text-red-600 mt-1">{ongoingError}</p>}

              <p className="text-xs text-muted-foreground mt-1">
                Optional – leave blank if no commission applies.
              </p>
            </div>

            <div className="col-span-2">
              <Button onClick={handleLivingCalc} disabled={livingLoading || livingDisabled}>
                {livingLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  "Calculate"
                )}
              </Button>
            </div>
          </div>
          {livingResult && (
            <div className="mt-6 border p-4 rounded bg-muted/50 text-sm">
              <div><strong>Guarantee Period:</strong> {livingResult.guarantee_period} years</div>
              <div><strong>Living Annuity between {age} and {guaranteedStartAge}: </strong> {fmtMoney(livingResult.guaranteed_annuity, 0)} / {frequency}</div>
              <div><strong>Funds Remaining at {guaranteedStartAge}:</strong> {fmtMoney(livingResult.funds_remaining, 0)}</div>

              {/* Optional commission display */}
              {(upfrontCommission || ongoingCommission) && (
                <>
                  <hr className="my-3 border-muted" />
                  <div><strong>Upfront Commission:</strong> {upfrontCommission ? `${upfrontCommission}%` : "—"}</div>
                  <div><strong>Ongoing Commission:</strong> {ongoingCommission ? `${ongoingCommission}%` : "—"}</div>
                </>
              )}
            </div>
          )}

        </CardContent>
      </Card>

      {/* Step 2: Life Annuity */}
      <Card className={showLifeForm ? "" : "opacity-60 pointer-events-none"}>
        <CardHeader>
          <CardTitle>Life Annuity Setup</CardTitle>
          <CardDescription>Step 2: calculate monthly life annuity using funds remaining.</CardDescription>
        </CardHeader>
        <CardContent>
          {showLifeForm && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Life Purchase Amount</Label>
                <Input type="number" value={lifePurchaseAmount} onChange={(e) => setLifePurchaseAmount(e.target.value)} />
              </div>
              <div>
                <Label>Life Start Age</Label>
                <Input type="number" value={guaranteedStartAge} onChange={(e) => setGuaranteedStartAge(e.target.value)} />
              </div>
              <div className="col-span-2">
                <Button onClick={handleLifeCalc} disabled={lifeLoading || lifeDisabled}>
                  {lifeLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    "Calculate Life Annuity"
                  )}
                </Button>
              </div>
              {lifeResult && (
                <div className="col-span-2 mt-4 border p-4 rounded bg-muted/50 text-sm">
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

      {/* Quote Dialog */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Customer Quotation</DialogTitle>
            <DialogDescription>
              Enter customer details and review calculation results
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Customer Details Form */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={customerDetails.fullName}
                    onChange={(e) => handleCustomerDetailsChange("fullName", e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !customerDetails.dateOfBirth && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customerDetails.dateOfBirth ? (
                          format(new Date(customerDetails.dateOfBirth), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customerDetails.dateOfBirth ? new Date(customerDetails.dateOfBirth) : undefined}
                        onSelect={(date) => handleCustomerDetailsChange("dateOfBirth", date ? format(date, "yyyy-MM-dd") : "")}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <RadioGroup
                    value={customerDetails.gender}
                    onValueChange={(value) => handleCustomerDetailsChange("gender", value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>ID/Passport Number</Label>
                  <Input
                    value={customerDetails.idNumber}
                    onChange={(e) => handleCustomerDetailsChange("idNumber", e.target.value)}
                    placeholder="Enter ID number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input
                    value={customerDetails.contactNumber}
                    onChange={(e) => handleCustomerDetailsChange("contactNumber", e.target.value)}
                    placeholder="Enter contact number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => handleCustomerDetailsChange("email", e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Calculation Results */}
            <Card>
              <CardHeader>
                <CardTitle>Quotation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Age at start of Living Annuity</span>
                    <span>{age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Purchase Amount</span>
                    <span>{fmtMoney(toNum(amountRaw))}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium">Living Annuity Drawdown Percentage (%)</span>
                    <span>{drawdown}%</span>
                  </div>

                  <Separator />

                  {livingResult && (
                    <>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-primary">Living Annuity</h4>
                        <div className="flex justify-between">
                          <span>Guarantee Period:</span>
                          <span>{livingResult.guarantee_period} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{frequency} Payment:</span>
                          {/* focus here match to actual quote */}
                          <span>{fmtMoney(livingResult.guaranteed_annuity)}</span> 
                        </div>
                        <div className="flex justify-between">
                          <span>Funds Remaining at {guaranteedStartAge}:</span>
                          <span>{fmtMoney(livingResult.funds_remaining)}</span>
                        </div>
                      </div>
                      {upfrontCommission && (
                        <div className="flex justify-between">
                          <span>Upfront Commission (Year 1):</span>
                          <span>{upfrontCommission}%</span>
                        </div>
                      )}
                      {ongoingCommission && (
                        <div className="flex justify-between">
                          <span>Ongoing Commission (Year 2+):</span>
                          <span>{ongoingCommission}%</span>
                        </div>
                      )}


                      <Separator />
                    </>
                  )}

                  {lifeResult && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-primary">Life Annuity</h4>
                      <div className="flex justify-between">
                        <span>Monthly Life Annuity:</span>
                        <span>{fmtMoney(lifeResult.monthly_annuity)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Terms and Conditions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p>
                This quotation outlines the guaranteed monthly income you could receive from a conventional life annuity,
                as well as the projected monthly income from a living annuity based on various drawdown rates. The income
                from the life annuity is affected by the prevailing interest rates at the time of the quote. Please note
                that Exclusive Life reserves the right to adjust any annuity income before the first payment.
              </p>
              <p>
                The income you receive during the living annuity phase is guaranteed until the transition date. However,
                you can change your annual drawdown rate on each policy anniversary, subject to policy limits. The income
                you earn after the transition date will be recalculated as of the transition date and will depend on your
                chosen drawdown rate, future investment returns, and any fees applicable to your fund.
              </p>
              <p>
                All annuity income is subject to taxation under Botswana income tax laws. The applicable tax rate is
                determined by your total monthly income, according to the PAYE tax tables issued by the Commissioner of
                Taxes. If there are any changes to the legislation, Exclusive Life Insurance will adjust the tax deducted
                accordingly.
              </p>
              <p className="font-medium">
                This quotation is confidential, and any unauthorized alterations will render it invalid. Exclusive Life
                Insurance will not accept liability for any losses incurred as a result of using an altered quotation.
              </p>
            </CardContent>
          </Card>

          {/* Dialog Actions */}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setShowQuoteDialog(false)}>
              Return to Calculator
            </Button>
            <div className="space-x-2">
              <Button variant="secondary" onClick={() => setShowQuoteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleFinalQuoteSubmit}>
                Generate Quote
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AnnuityQuotationForm
