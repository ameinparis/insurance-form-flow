import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const IndividualLifeCoverForm = () => {
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    coverAmount: "",
    coverType: "",
    premiumType: "",
    smokingStatus: "",
    occupation: "",
    medicalHistory: "",
    beneficiaries: "",
    existingCover: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Individual Life Cover quotation submitted successfully!")
    console.log("Individual Life Cover Form Data:", formData)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Individual Life Cover</CardTitle>
        <CardDescription>
          Comprehensive life insurance protection tailored to your individual needs
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
              <Label htmlFor="gender">Gender</Label>
              <Select onValueChange={(value) => handleInputChange("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverAmount">Cover Amount (R)</Label>
            <Input
              id="coverAmount"
              type="number"
              value={formData.coverAmount}
              onChange={(e) => handleInputChange("coverAmount", e.target.value)}
              placeholder="Enter desired cover amount"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverType">Cover Type</Label>
            <Select onValueChange={(value) => handleInputChange("coverType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select cover type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="term">Term Life Insurance</SelectItem>
                <SelectItem value="whole-life">Whole Life Insurance</SelectItem>
                <SelectItem value="endowment">Endowment Policy</SelectItem>
                <SelectItem value="universal">Universal Life Insurance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="premiumType">Premium Type</Label>
            <Select onValueChange={(value) => handleInputChange("premiumType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select premium type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="level">Level Premium</SelectItem>
                <SelectItem value="increasing">Increasing Premium</SelectItem>
                <SelectItem value="decreasing">Decreasing Premium</SelectItem>
                <SelectItem value="reviewable">Reviewable Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="smokingStatus">Smoking Status</Label>
            <Select onValueChange={(value) => handleInputChange("smokingStatus", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select smoking status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never Smoked</SelectItem>
                <SelectItem value="former">Former Smoker (Quit > 12 months)</SelectItem>
                <SelectItem value="current">Current Smoker</SelectItem>
                <SelectItem value="occasional">Occasional Smoker</SelectItem>
              </SelectContent>
            </Select>
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
            <Label htmlFor="beneficiaries">Number of Beneficiaries</Label>
            <Input
              id="beneficiaries"
              type="number"
              value={formData.beneficiaries}
              onChange={(e) => handleInputChange("beneficiaries", e.target.value)}
              placeholder="Enter number of beneficiaries"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalHistory">Medical History</Label>
            <Input
              id="medicalHistory"
              type="text"
              value={formData.medicalHistory}
              onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
              placeholder="Brief medical history and current conditions"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="existingCover">Existing Life Cover (R)</Label>
            <Input
              id="existingCover"
              type="number"
              value={formData.existingCover}
              onChange={(e) => handleInputChange("existingCover", e.target.value)}
              placeholder="Value of existing life insurance (if any)"
            />
          </div>

          <Button type="submit" className="w-full">
            Get Individual Life Cover Quote
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default IndividualLifeCoverForm