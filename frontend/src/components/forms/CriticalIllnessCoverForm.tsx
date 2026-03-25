import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const CriticalIllnessCoverForm = () => {
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    coverAmount: "",
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Critical Illness Cover quotation submitted successfully!")
    console.log("Critical Illness Cover Form Data:", formData)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Critical Illness Cover</CardTitle>
        <CardDescription>
          Financial protection against major critical illnesses and medical conditions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                placeholder="Enter age"
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
            <div className="space-y-2">
              <Label htmlFor="coverAmount">Cover Amount (BWP)</Label>
              <Input
                id="coverAmount"
                type="number"
                value={formData.coverAmount}
                onChange={(e) => handleInputChange("coverAmount", e.target.value)}
                placeholder="Enter cover amount"
                required
              />
            </div>
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
