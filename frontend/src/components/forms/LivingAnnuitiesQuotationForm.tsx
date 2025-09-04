import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const LivingAnnuitiesQuotationForm = () => {
  const [formData, setFormData] = useState({
    age: "",
    currentFundValue: "",
    annualDrawdownRate: "",
    investmentStrategy: "",
    expectedRetirement: "",
    riskProfile: "",
    existingAnnuities: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Living Annuities quotation submitted successfully!")
    console.log("Living Annuities Form Data:", formData)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Living Annuities Quotation</CardTitle>
        <CardDescription>
          Get a quote for flexible retirement income solutions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="age">Current Age</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => handleInputChange("age", e.target.value)}
              placeholder="Enter your current age"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentFundValue">Current Fund Value (R)</Label>
            <Input
              id="currentFundValue"
              type="number"
              value={formData.currentFundValue}
              onChange={(e) => handleInputChange("currentFundValue", e.target.value)}
              placeholder="Enter current pension fund value"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="annualDrawdownRate">Desired Annual Drawdown Rate (%)</Label>
            <Input
              id="annualDrawdownRate"
              type="number"
              step="0.1"
              value={formData.annualDrawdownRate}
              onChange={(e) => handleInputChange("annualDrawdownRate", e.target.value)}
              placeholder="Enter desired drawdown rate (2.5% - 17.5%)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="investmentStrategy">Investment Strategy</Label>
            <Select onValueChange={(value) => handleInputChange("investmentStrategy", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select investment strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedRetirement">Expected Retirement Date</Label>
            <Input
              id="expectedRetirement"
              type="date"
              value={formData.expectedRetirement}
              onChange={(e) => handleInputChange("expectedRetirement", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="riskProfile">Risk Profile</Label>
            <Select onValueChange={(value) => handleInputChange("riskProfile", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your risk profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="existingAnnuities">Existing Annuities Value (R)</Label>
            <Input
              id="existingAnnuities"
              type="number"
              value={formData.existingAnnuities}
              onChange={(e) => handleInputChange("existingAnnuities", e.target.value)}
              placeholder="Enter value of existing annuities (if any)"
            />
          </div>

          <Button type="submit" className="w-full">
            Get Living Annuities Quote
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default LivingAnnuitiesQuotationForm