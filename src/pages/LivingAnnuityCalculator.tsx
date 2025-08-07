
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Calculator, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const LivingAnnuityCalculator = () => {
  const [formData, setFormData] = useState({
    ageAtStart: "",
    purchaseAmount: "",
    drawdownPercentage: "",
    ageForLifeGuarantee: "",
    frequency: "Monthly"
  })
  
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ ageAtStart?: string; purchaseAmount?: string }>({})
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (field in errors) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = () => {
    const errs: { ageAtStart?: string; purchaseAmount?: string } = {}
    const age = Number(formData.ageAtStart)
    if (!age || age < 50 || age > 85) {
      errs.ageAtStart = "Starting age must be between 50 and 85."
    }
    const amount = Number(formData.purchaseAmount)
    if (!amount || amount < 300000) {
      errs.purchaseAmount = "Minimum investment is BWP 300,000."
    }
    setErrors(errs)
    if (Object.keys(errs).length) {
      toast({
        variant: "destructive",
        title: "Please fix the form",
        description: Object.values(errs).join(" "),
      })
      return false
    }
    return true
  }

  const handleCalculate = () => {
    if (!validate()) return
    setIsLoading(true)
    setResults(null)
    setTimeout(() => {
      const mockResults = {
        monthlyPayment: formData.frequency === "Monthly" ? "BWP 2,450" : "BWP 29,400",
        totalReturn: "BWP 294,000",
        guaranteedPeriod: "20 years"
      }
      setResults(mockResults)
      setIsLoading(false)
    }, 1200)
  }

  const handleCreateQuote = () => {
    // This would navigate to quote creation or save the calculation
    console.log("Creating quote with data:", formData, results)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Living Annuity Calculator</h2>
        <p className="text-muted-foreground">Calculate living annuity payments and create quotes.</p>
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
                {errors.ageAtStart && (
                  <p className="text-sm text-destructive">{errors.ageAtStart}</p>
                )}
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
                {errors.purchaseAmount && (
                  <p className="text-sm text-destructive">{errors.purchaseAmount}</p>
                )}
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

              <Button onClick={handleCalculate} className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Calculating...</>
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
              <CardTitle>Living Annuity Results</CardTitle>
              <CardDescription>
                {results ? "Your calculation results" : "Results will appear here after calculation."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
                  <p>Calculating your living annuity...</p>
                </div>
              ) : results ? (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Monthly Payment</div>
                    <div className="text-2xl font-bold text-blue-600">{results.monthlyPayment}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Total Expected Return</div>
                    <div className="text-xl font-semibold">{results.totalReturn}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Guaranteed Period</div>
                    <div className="text-xl font-semibold">{results.guaranteedPeriod}</div>
                  </div>
                  <Button onClick={handleCreateQuote} className="w-full mt-4">
                    Create Quote
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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

export default LivingAnnuityCalculator
