import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const GroupLifeAssuranceForm = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    numberOfEmployees: "",
    industryType: "",
    averageSalary: "",
    coverageMultiple: "",
    waitingPeriod: "",
    medicalUnderwriting: "",
    existingScheme: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Group Life Assurance quotation submitted successfully!")
    console.log("Group Life Assurance Form Data:", formData)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Group Life Assurance (GLA)</CardTitle>
        <CardDescription>
          Get comprehensive group life insurance coverage for your employees
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              type="text"
              value={formData.companyName}
              onChange={(e) => handleInputChange("companyName", e.target.value)}
              placeholder="Enter company name"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numberOfEmployees">Number of Employees</Label>
              <Input
                id="numberOfEmployees"
                type="number"
                value={formData.numberOfEmployees}
                onChange={(e) => handleInputChange("numberOfEmployees", e.target.value)}
                placeholder="Enter total employees"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="averageSalary">Average Annual Salary (R)</Label>
              <Input
                id="averageSalary"
                type="number"
                value={formData.averageSalary}
                onChange={(e) => handleInputChange("averageSalary", e.target.value)}
                placeholder="Enter average salary"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industryType">Industry Type</Label>
            <Select onValueChange={(value) => handleInputChange("industryType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select industry type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverageMultiple">Coverage Multiple (Times Annual Salary)</Label>
            <Select onValueChange={(value) => handleInputChange("coverageMultiple", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select coverage multiple" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1x Annual Salary</SelectItem>
                <SelectItem value="2">2x Annual Salary</SelectItem>
                <SelectItem value="3">3x Annual Salary</SelectItem>
                <SelectItem value="4">4x Annual Salary</SelectItem>
                <SelectItem value="custom">Custom Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="waitingPeriod">Waiting Period</Label>
            <Select onValueChange={(value) => handleInputChange("waitingPeriod", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select waiting period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="3months">3 Months</SelectItem>
                <SelectItem value="6months">6 Months</SelectItem>
                <SelectItem value="12months">12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalUnderwriting">Medical Underwriting Required</Label>
            <Select onValueChange={(value) => handleInputChange("medicalUnderwriting", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select medical underwriting requirement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="above-limit">Above Certain Limit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="existingScheme">Existing Insurance Scheme</Label>
            <Input
              id="existingScheme"
              type="text"
              value={formData.existingScheme}
              onChange={(e) => handleInputChange("existingScheme", e.target.value)}
              placeholder="Details of existing scheme (if any)"
            />
          </div>

          <Button type="submit" className="w-full">
            Get Group Life Assurance Quote
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default GroupLifeAssuranceForm