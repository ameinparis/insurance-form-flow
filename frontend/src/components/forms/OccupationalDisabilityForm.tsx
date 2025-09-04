import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const OccupationalDisabilityForm = () => {
  const [formData, setFormData] = useState({
    age: "",
    occupation: "",
    annualIncome: "",
    benefitAmount: "",
    waitingPeriod: "",
    benefitPeriod: "",
    disabilityDefinition: "",
    medicalHistory: "",
    riskCategory: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Occupational Disability quotation submitted successfully!")
    console.log("Occupational Disability Form Data:", formData)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Occupational Disability</CardTitle>
        <CardDescription>
          Income protection insurance for work-related disabilities and injuries
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
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
              <Label htmlFor="annualIncome">Annual Income (R)</Label>
              <Input
                id="annualIncome"
                type="number"
                value={formData.annualIncome}
                onChange={(e) => handleInputChange("annualIncome", e.target.value)}
                placeholder="Enter annual income"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation Details</Label>
            <Input
              id="occupation"
              type="text"
              value={formData.occupation}
              onChange={(e) => handleInputChange("occupation", e.target.value)}
              placeholder="Detailed description of your occupation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="riskCategory">Occupational Risk Category</Label>
            <Select onValueChange={(value) => handleInputChange("riskCategory", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select risk category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Risk (Office Work)</SelectItem>
                <SelectItem value="medium">Medium Risk (Light Manual Work)</SelectItem>
                <SelectItem value="high">High Risk (Heavy Manual/Hazardous Work)</SelectItem>
                <SelectItem value="very-high">Very High Risk (Mining, Construction)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="benefitAmount">Monthly Benefit Amount (R)</Label>
            <Input
              id="benefitAmount"
              type="number"
              value={formData.benefitAmount}
              onChange={(e) => handleInputChange("benefitAmount", e.target.value)}
              placeholder="Desired monthly benefit amount"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="waitingPeriod">Waiting Period</Label>
            <Select onValueChange={(value) => handleInputChange("waitingPeriod", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select waiting period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30days">30 Days</SelectItem>
                <SelectItem value="60days">60 Days</SelectItem>
                <SelectItem value="90days">90 Days</SelectItem>
                <SelectItem value="180days">180 Days</SelectItem>
                <SelectItem value="365days">365 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="benefitPeriod">Benefit Period</Label>
            <Select onValueChange={(value) => handleInputChange("benefitPeriod", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select benefit period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2years">2 Years</SelectItem>
                <SelectItem value="5years">5 Years</SelectItem>
                <SelectItem value="10years">10 Years</SelectItem>
                <SelectItem value="age65">To Age 65</SelectItem>
                <SelectItem value="lifetime">Lifetime</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="disabilityDefinition">Disability Definition</Label>
            <Select onValueChange={(value) => handleInputChange("disabilityDefinition", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select disability definition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="own-occupation">Own Occupation</SelectItem>
                <SelectItem value="any-occupation">Any Occupation</SelectItem>
                <SelectItem value="activities-daily-living">Activities of Daily Living</SelectItem>
                <SelectItem value="hybrid">Hybrid Definition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalHistory">Medical History</Label>
            <Input
              id="medicalHistory"
              type="text"
              value={formData.medicalHistory}
              onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
              placeholder="Brief medical history and current health status"
            />
          </div>

          <Button type="submit" className="w-full">
            Get Occupational Disability Quote
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default OccupationalDisabilityForm