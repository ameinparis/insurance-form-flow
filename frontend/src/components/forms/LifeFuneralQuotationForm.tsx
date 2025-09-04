import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const LifeFuneralQuotationForm = () => {
  const [formData, setFormData] = useState({
    mainMemberAge: "",
    spouseAge: "",
    coverAmount: "",
    premiumFrequency: "",
    beneficiaries: "",
    medicalHistory: "",
    occupation: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Life Funeral quotation submitted successfully!")
    console.log("Life Funeral Form Data:", formData)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Life Funeral Quotation</CardTitle>
        <CardDescription>
          Get a comprehensive quote for life and funeral insurance coverage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mainMemberAge">Main Member Age</Label>
              <Input
                id="mainMemberAge"
                type="number"
                value={formData.mainMemberAge}
                onChange={(e) => handleInputChange("mainMemberAge", e.target.value)}
                placeholder="Enter age"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spouseAge">Spouse Age (Optional)</Label>
              <Input
                id="spouseAge"
                type="number"
                value={formData.spouseAge}
                onChange={(e) => handleInputChange("spouseAge", e.target.value)}
                placeholder="Enter spouse age"
              />
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
            <Label htmlFor="premiumFrequency">Premium Frequency</Label>
            <Select onValueChange={(value) => handleInputChange("premiumFrequency", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select premium frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
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
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              id="occupation"
              type="text"
              value={formData.occupation}
              onChange={(e) => handleInputChange("occupation", e.target.value)}
              placeholder="Enter occupation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalHistory">Medical History (Brief)</Label>
            <Input
              id="medicalHistory"
              type="text"
              value={formData.medicalHistory}
              onChange={(e) => handleInputChange("medicalHistory", e.target.value)}
              placeholder="Brief medical history"
            />
          </div>

          <Button type="submit" className="w-full">
            Get Life Funeral Quote
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default LifeFuneralQuotationForm