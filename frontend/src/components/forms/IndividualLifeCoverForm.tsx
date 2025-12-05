import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const IndividualLifeCoverForm = () => {
  const [formData, setFormData] = useState({
    // Demographic info
    age: "",
    gender: "",
    smokerStatus: "",
    education: "",
    income: "",
    marriageStatus: "",
    // Product info
    product: "",
    term: "",
    cashbackOption: "",
    deathCover: "",
    disabilityCover: "",
    ciCover: "",
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
          {/* Demographic Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Demographic Info</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="smokerStatus">Smoker Status</Label>
                <Select onValueChange={(value) => handleInputChange("smokerStatus", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select smoker status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smoker">Smoker</SelectItem>
                    <SelectItem value="non-smoker">Non-smoker</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="education">Education</Label>
                <Select onValueChange={(value) => handleInputChange("education", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select education" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="degree">Degree</SelectItem>
                    <SelectItem value="no-degree">No Degree</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="income">Income</Label>
                <Select onValueChange={(value) => handleInputChange("income", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select income" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above-10k">&gt;P10k</SelectItem>
                    <SelectItem value="below-10k">&lt;=P10k</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marriageStatus">Marriage Status</Label>
                <Select onValueChange={(value) => handleInputChange("marriageStatus", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select marriage status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="married">Married</SelectItem>
                    <SelectItem value="single">Single</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product Info</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product</Label>
                <Select onValueChange={(value) => handleInputChange("product", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nomeduw">NoMedUW</SelectItem>
                    <SelectItem value="meduw">MedUW</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="term">Term</Label>
                <Input
                  id="term"
                  type="number"
                  value={formData.term}
                  onChange={(e) => handleInputChange("term", e.target.value)}
                  placeholder="Enter term (years)"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cashbackOption">Cashback Option</Label>
                <Select onValueChange={(value) => handleInputChange("cashbackOption", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cashback option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-cashback">No cashback</SelectItem>
                    <SelectItem value="10-after-5">10% after 5 years</SelectItem>
                    <SelectItem value="120-after-15">120% after 15 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deathCover">Death Cover</Label>
                <Input
                  id="deathCover"
                  type="number"
                  value={formData.deathCover}
                  onChange={(e) => handleInputChange("deathCover", e.target.value)}
                  placeholder="Enter death cover amount"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disabilityCover">Disability Cover</Label>
                <Input
                  id="disabilityCover"
                  type="number"
                  value={formData.disabilityCover}
                  onChange={(e) => handleInputChange("disabilityCover", e.target.value)}
                  placeholder="Enter disability cover amount"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ciCover">CI Cover</Label>
                <Input
                  id="ciCover"
                  type="number"
                  value={formData.ciCover}
                  onChange={(e) => handleInputChange("ciCover", e.target.value)}
                  placeholder="Enter CI cover amount"
                  required
                />
              </div>
            </div>
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
