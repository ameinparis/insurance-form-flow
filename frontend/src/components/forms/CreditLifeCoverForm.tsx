import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const CreditLifeCoverForm = () => {
  const [formData, setFormData] = useState({
    loanAmount: "",
    loanTerm: "",
    loanType: "",
    monthlyInstallment: "",
    age: "",
    occupation: "",
    healthStatus: "",
    existingCreditLife: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Credit Life Cover quotation submitted successfully!")
    console.log("Credit Life Cover Form Data:", formData)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Credit Life Cover</CardTitle>
        <CardDescription>
          Protect your loan obligations with comprehensive credit life insurance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loanAmount">Loan Amount (R)</Label>
              <Input
                id="loanAmount"
                type="number"
                value={formData.loanAmount}
                onChange={(e) => handleInputChange("loanAmount", e.target.value)}
                placeholder="Enter total loan amount"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loanTerm">Loan Term (Years)</Label>
              <Input
                id="loanTerm"
                type="number"
                value={formData.loanTerm}
                onChange={(e) => handleInputChange("loanTerm", e.target.value)}
                placeholder="Enter loan term"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loanType">Loan Type</Label>
            <Select onValueChange={(value) => handleInputChange("loanType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select loan type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home-loan">Home Loan</SelectItem>
                <SelectItem value="vehicle-finance">Vehicle Finance</SelectItem>
                <SelectItem value="personal-loan">Personal Loan</SelectItem>
                <SelectItem value="business-loan">Business Loan</SelectItem>
                <SelectItem value="credit-card">Credit Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyInstallment">Monthly Installment (R)</Label>
            <Input
              id="monthlyInstallment"
              type="number"
              value={formData.monthlyInstallment}
              onChange={(e) => handleInputChange("monthlyInstallment", e.target.value)}
              placeholder="Enter monthly payment amount"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Your Age</Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => handleInputChange("age", e.target.value)}
              placeholder="Enter your age"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              id="occupation"
              type="text"
              value={formData.occupation}
              onChange={(e) => handleInputChange("occupation", e.target.value)}
              placeholder="Enter your occupation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="healthStatus">Health Status</Label>
            <Select onValueChange={(value) => handleInputChange("healthStatus", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your health status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="poor">Poor with conditions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="existingCreditLife">Existing Credit Life Cover</Label>
            <Input
              id="existingCreditLife"
              type="text"
              value={formData.existingCreditLife}
              onChange={(e) => handleInputChange("existingCreditLife", e.target.value)}
              placeholder="Details of existing credit life cover (if any)"
            />
          </div>

          <Button type="submit" className="w-full">
            Get Credit Life Cover Quote
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default CreditLifeCoverForm