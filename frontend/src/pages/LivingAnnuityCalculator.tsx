
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calculator } from "lucide-react"

const LivingAnnuityCalculator = () => {
  const [formData, setFormData] = useState({
    ageAtStart: "",
    purchaseAmount: "",
    drawdownPercentage: "",
    ageForLifeGuarantee: "",
    guaranteePeriod: "",
    frequency: "Monthly"
  })
  
  const [results, setResults] = useState(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCalculate = () => {
    // Mock calculation - you can implement actual logic later
    const mockResults = {
      monthlyPayment: "P 2,450",
      totalReturn: "P 294,000",
      guaranteedPeriod: "20 years"
    }
    setResults(mockResults)
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
                <Select onValueChange={(value) => handleInputChange("ageAtStart", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 50 }, (_, i) => i + 18).map((age) => (
                      <SelectItem key={age} value={age.toString()}>
                        {age} years
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseAmount">Living Annuity Purchase Amount</Label>
                <Input
                  id="purchaseAmount"
                  type="number"
                  placeholder="Enter amount"
                  value={formData.purchaseAmount}
                  onChange={(e) => handleInputChange("purchaseAmount", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="drawdownPercentage">Living Annuity Drawdown Percentage (%)</Label>
                <Select onValueChange={(value) => handleInputChange("drawdownPercentage", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select percentage" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 16 }, (_, i) => i + 2.5).map((percentage) => (
                      <SelectItem key={percentage} value={percentage.toString()}>
                        {percentage}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageForLifeGuarantee">Age at which Life Guaranteed amount starts for Life</Label>
                <Select onValueChange={(value) => handleInputChange("ageForLifeGuarantee", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select age" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 30 }, (_, i) => i + 55).map((age) => (
                      <SelectItem key={age} value={age.toString()}>
                        {age} years
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guaranteePeriod">Guarantee Period</Label>
                <Select onValueChange={(value) => handleInputChange("guaranteePeriod", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select guarantee period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 years</SelectItem>
                    <SelectItem value="10">10 years</SelectItem>
                    <SelectItem value="15">15 years</SelectItem>
                    <SelectItem value="20">20 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Annual / Monthly</Label>
                <div className="flex gap-2">
                  <Badge 
                    variant={formData.frequency === "Monthly" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleInputChange("frequency", "Monthly")}
                  >
                    Monthly
                  </Badge>
                  <Badge 
                    variant={formData.frequency === "Annual" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleInputChange("frequency", "Annual")}
                  >
                    Annual
                  </Badge>
                </div>
              </div>

              <Button onClick={handleCalculate} className="w-full">
                Calculate
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
              {results ? (
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
