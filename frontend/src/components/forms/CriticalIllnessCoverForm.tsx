import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"

const CriticalIllnessCoverForm = () => {
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    coverAmount: "",
    smokingStatus: "",
    familyHistory: "",
    existingConditions: "",
    occupation: "",
    lifestyle: "",
    premiumType: "",
  })

  const [selectedConditions, setSelectedConditions] = useState<string[]>([])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleConditionChange = (condition: string, checked: boolean) => {
    if (checked) {
      setSelectedConditions(prev => [...prev, condition])
    } else {
      setSelectedConditions(prev => prev.filter(c => c !== condition))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Critical Illness Cover quotation submitted successfully!")
    console.log("Critical Illness Cover Form Data:", { ...formData, selectedConditions })
  }

  const criticalIllnesses = [
    "Heart Attack", "Stroke", "Cancer", "Kidney Failure", "Major Organ Transplant",
    "Multiple Sclerosis", "Parkinson's Disease", "Alzheimer's Disease", "Motor Neuron Disease"
  ]

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Critical Illness Cover</CardTitle>
        <CardDescription>
          Financial protection against major critical illnesses and medical conditions
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
            <Label htmlFor="coverAmount">Desired Cover Amount (R)</Label>
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
            <Label htmlFor="smokingStatus">Smoking Status</Label>
            <Select onValueChange={(value) => handleInputChange("smokingStatus", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select smoking status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never Smoked</SelectItem>
                <SelectItem value="former">Former Smoker</SelectItem>
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
            <Label htmlFor="lifestyle">Lifestyle Risk Factors</Label>
            <Select onValueChange={(value) => handleInputChange("lifestyle", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select lifestyle category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Risk (Active, Healthy Diet)</SelectItem>
                <SelectItem value="moderate">Moderate Risk (Average Lifestyle)</SelectItem>
                <SelectItem value="high">High Risk (Sedentary, Poor Diet)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Select Conditions to Cover (Optional)</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {criticalIllnesses.map((condition) => (
                <div key={condition} className="flex items-center space-x-2">
                  <Checkbox
                    id={condition}
                    checked={selectedConditions.includes(condition)}
                    onCheckedChange={(checked) => handleConditionChange(condition, checked as boolean)}
                  />
                  <Label htmlFor={condition} className="text-sm">{condition}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="familyHistory">Family History of Critical Illness</Label>
            <Input
              id="familyHistory"
              type="text"
              value={formData.familyHistory}
              onChange={(e) => handleInputChange("familyHistory", e.target.value)}
              placeholder="Brief family medical history"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="existingConditions">Existing Medical Conditions</Label>
            <Input
              id="existingConditions"
              type="text"
              value={formData.existingConditions}
              onChange={(e) => handleInputChange("existingConditions", e.target.value)}
              placeholder="Any existing medical conditions"
            />
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
                <SelectItem value="reviewable">Reviewable Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            Get Critical Illness Cover Quote
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default CriticalIllnessCoverForm