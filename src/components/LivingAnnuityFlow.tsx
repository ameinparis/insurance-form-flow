import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Calculator, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface LivingResults {
  monthlyPayment: string
  totalReturn: string
  guaranteedPeriod: string
}

interface LifeResults {
  monthlyPayment: string
  guaranteedForLife: boolean
}

interface Props {
  onCreateQuote?: (payload: { formData: any; livingResults: LivingResults; lifeResults?: LifeResults }) => void
}

const LivingAnnuityFlow = ({ onCreateQuote }: Props) => {
  const [formData, setFormData] = useState({
    ageAtStart: "",
    purchaseAmount: "",
    drawdownPercentage: "",
    ageForLifeGuarantee: "",
    frequency: "Monthly",
  })
  const [livingResults, setLivingResults] = useState<LivingResults | null>(null)
  const [lifeResults, setLifeResults] = useState<LifeResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ ageAtStart?: string; purchaseAmount?: string }>({})
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field in errors) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const errs: { ageAtStart?: string; purchaseAmount?: string } = {}
    const age = Number(formData.ageAtStart)
    if (!age || age < 50 || age > 85) errs.ageAtStart = "Starting age must be between 50 and 85."
    const amount = Number(formData.purchaseAmount)
    if (!amount || amount < 300000) errs.purchaseAmount = "Minimum investment is BWP 300,000."
    setErrors(errs)
    if (Object.keys(errs).length) {
      toast({ variant: "destructive", title: "Please fix the form", description: Object.values(errs).join(" ") })
      return false
    }
    return true
  }

  const handleCalculateLiving = () => {
    if (!validate()) return
    setIsLoading(true)
    setLivingResults(null)
    setLifeResults(null)
    setTimeout(() => {
      const mock: LivingResults = {
        monthlyPayment: formData.frequency === "Monthly" ? "BWP 2,450" : "BWP 29,400",
        totalReturn: "BWP 294,000",
        guaranteedPeriod: "20 years",
      }
      setLivingResults(mock)
      setIsLoading(false)
    }, 1200)
  }

  const handleCalculateLife = () => {
    if (!livingResults) return
    // Simple derived mock using living monthlyPayment as a base
    setIsLoading(true)
    setTimeout(() => {
      const mockLife: LifeResults = {
        monthlyPayment: livingResults.monthlyPayment.replace("BWP ", "BWP "),
        guaranteedForLife: true,
      }
      setLifeResults(mockLife)
      setIsLoading(false)
    }, 900)
  }

  const handleCreateQuote = () => {
    if (!livingResults) return
    onCreateQuote?.({ formData, livingResults, lifeResults: lifeResults || undefined })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Living Annuity Calculator</h2>
        <p className="text-muted-foreground">Calculate living annuity, then optionally add a Life annuity based on the result.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calculator Parameters</CardTitle>
              <CardDescription>Enter the details for living annuity calculation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ageAtStart">Age at start of Living Annuity</Label>
                <Input
                  id="ageAtStart"
                  type="number"
                  min={50}
                  max={85}
                  placeholder="65"
                  value={formData.ageAtStart}
                  onChange={(e) => handleInputChange("ageAtStart", e.target.value)}
                />
                {errors.ageAtStart && <p className="text-sm text-destructive">{errors.ageAtStart}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseAmount">Living Annuity Purchase Amount</Label>
                <Input
                  id="purchaseAmount"
                  type="number"
                  min={300000}
                  step="1000"
                  placeholder="BWP 500,000"
                  value={formData.purchaseAmount}
                  onChange={(e) => handleInputChange("purchaseAmount", e.target.value)}
                />
                {errors.purchaseAmount && <p className="text-sm text-destructive">{errors.purchaseAmount}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="drawdownPercentage">Living Annuity Drawdown Percentage (%)</Label>
                <Input
                  id="drawdownPercentage"
                  type="number"
                  step="0.5"
                  placeholder="5"
                  value={formData.drawdownPercentage}
                  onChange={(e) => handleInputChange("drawdownPercentage", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageForLifeGuarantee">Age at which Life Guaranteed amount starts for Life</Label>
                <Input
                  id="ageForLifeGuarantee"
                  type="number"
                  placeholder="75"
                  value={formData.ageForLifeGuarantee}
                  onChange={(e) => handleInputChange("ageForLifeGuarantee", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Annual / Monthly</Label>
                <ToggleGroup
                  type="single"
                  value={formData.frequency}
                  onValueChange={(value) => value && handleInputChange("frequency", value)}
                  className="flex gap-2"
                >
                  <ToggleGroupItem value="Annual" aria-label="Annual">Annual</ToggleGroupItem>
                  <ToggleGroupItem value="Monthly" aria-label="Monthly">Monthly</ToggleGroupItem>
                </ToggleGroup>
              </div>

              <Button onClick={handleCalculateLiving} className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Calculating...</span>
                ) : (
                  "Calculate Living Annuity"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {livingResults ? (lifeResults ? "Living + Life annuity results" : "Living annuity results") : "Results will appear here after calculation."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
                  <p>Calculating your annuity...</p>
                </div>
              ) : livingResults ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Living Monthly Payment</div>
                    <div className="text-2xl font-bold text-primary">{livingResults.monthlyPayment}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Living Total Expected Return</div>
                    <div className="text-xl font-semibold">{livingResults.totalReturn}</div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Living Guaranteed Period</div>
                    <div className="text-xl font-semibold">{livingResults.guaranteedPeriod}</div>
                  </div>

                  {lifeResults && (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Life Annuity Monthly Payment</div>
                        <div className="text-2xl font-bold text-primary">{lifeResults.monthlyPayment}</div>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="text-sm text-muted-foreground">Guaranteed For Life</div>
                        <div className="text-xl font-semibold">{lifeResults.guaranteedForLife ? "Yes" : "No"}</div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {!lifeResults && (
                      <Button variant="secondary" onClick={handleCalculateLife}>
                        Also calculate Life Annuity
                      </Button>
                    )}
                    <Button onClick={handleCreateQuote}>
                      Create Quote
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Complete the form and click Calculate to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default LivingAnnuityFlow
