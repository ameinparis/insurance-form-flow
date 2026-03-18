import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"

const CalculatorForm = () => {
  const { type } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Calculate premium based on form data
    const premium = calculatePremium()
    const monthlyPremium = premium / 12
    
    navigate("/calculate/results", {
      state: {
        type,
        formData,
        premium,
        monthlyPremium
      }
    })
  }

  const calculatePremium = () => {
    // Basic calculation logic - can be enhanced per insurance type
    const baseRate = getBaseRate(type || "")
    const age = parseInt(formData.age || "30")
    const value = parseFloat(formData.coverAmount || formData.salary || formData.homeValue || "100000")
    
    return Math.round(value * baseRate * (age / 30))
  }

  const getBaseRate = (insuranceType: string) => {
    const rates = {
      "life-funeral": 0.02,
      "living-annuities": 0.015,
      "group-life-assurance": 0.025,
      "critical-illness": 0.035,
      "individual-life": 0.025
    }
    return rates[insuranceType as keyof typeof rates] || 0.02
  }

  const getFormTitle = () => {
    const titles = {
      "life-funeral": "Life Funeral Quotation",
      "living-annuities": "Living Annuities Quotation",
      "group-life-assurance": "Group Life Assurance (GLA)",
      "critical-illness": "Critical Illness Cover",
      "individual-life": "Individual Life Cover"
    }
    return titles[type as keyof typeof titles] || "Insurance Quotation"
  }

  const renderFormFields = () => {
    switch (type) {
      case "life-funeral":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter age"
                  value={formData.age || ""}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="coverAmount">Cover Amount</Label>
                <Input
                  id="coverAmount"
                  type="number"
                  placeholder="Enter cover amount"
                  value={formData.coverAmount || ""}
                  onChange={(e) => handleInputChange("coverAmount", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="smoker">Smoking Status</Label>
              <Select onValueChange={(value) => handleInputChange("smoker", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select smoking status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="non-smoker">Non-smoker</SelectItem>
                  <SelectItem value="smoker">Smoker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )

      case "living-annuities":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currentAge">Current Age</Label>
                <Input
                  id="currentAge"
                  type="number"
                  placeholder="Enter current age"
                  value={formData.currentAge || ""}
                  onChange={(e) => handleInputChange("currentAge", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="retirementAge">Retirement Age</Label>
                <Input
                  id="retirementAge"
                  type="number"
                  placeholder="Enter retirement age"
                  value={formData.retirementAge || ""}
                  onChange={(e) => handleInputChange("retirementAge", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monthlyContribution">Monthly Contribution</Label>
                <Input
                  id="monthlyContribution"
                  type="number"
                  placeholder="Enter monthly contribution"
                  value={formData.monthlyContribution || ""}
                  onChange={(e) => handleInputChange("monthlyContribution", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="expectedReturn">Expected Annual Return (%)</Label>
                <Input
                  id="expectedReturn"
                  type="number"
                  placeholder="Enter expected return"
                  value={formData.expectedReturn || ""}
                  onChange={(e) => handleInputChange("expectedReturn", e.target.value)}
                />
              </div>
            </div>
          </>
        )

      case "group-life-assurance":
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter age"
                  value={formData.age || ""}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="salary">Annual Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  placeholder="Enter annual salary"
                  value={formData.salary || ""}
                  onChange={(e) => handleInputChange("salary", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="multiplier">Salary Multiplier</Label>
              <Select onValueChange={(value) => handleInputChange("multiplier", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select multiplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1x Annual Salary</SelectItem>
                  <SelectItem value="2">2x Annual Salary</SelectItem>
                  <SelectItem value="3">3x Annual Salary</SelectItem>
                  <SelectItem value="4">4x Annual Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )

      default:
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter age"
                  value={formData.age || ""}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="coverAmount">Cover Amount</Label>
                <Input
                  id="coverAmount"
                  type="number"
                  placeholder="Enter cover amount"
                  value={formData.coverAmount || ""}
                  onChange={(e) => handleInputChange("coverAmount", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="term">Term (Years)</Label>
              <Input
                id="term"
                type="number"
                placeholder="Enter term in years"
                value={formData.term || ""}
                onChange={(e) => handleInputChange("term", e.target.value)}
              />
            </div>
          </>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h2 className="text-3xl font-bold">{getFormTitle()}</h2>
          <p className="text-muted-foreground">Fill in the details to calculate your premium.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insurance Details</CardTitle>
          <CardDescription>Please provide the required information for your quote calculation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {renderFormFields()}
            <Button type="submit" className="w-full">
              Calculate Premium
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CalculatorForm