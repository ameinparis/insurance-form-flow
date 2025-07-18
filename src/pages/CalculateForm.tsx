import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"

const CalculateForm = () => {
  const { type } = useParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    age: "",
    value: "",
    coverage: "",
    term: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Navigate to results page with form data
    navigate("/calculate/results", { state: { type, formData } })
  }

  const getFormFields = () => {
    switch (type) {
      case "auto":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="age">Driver Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="Enter age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Vehicle Value</Label>
              <Input
                id="value"
                type="number"
                placeholder="Enter vehicle value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverage">Coverage Type</Label>
              <Select value={formData.coverage} onValueChange={(value) => setFormData({ ...formData, coverage: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select coverage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )
      case "home":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="value">Property Value</Label>
              <Input
                id="value"
                type="number"
                placeholder="Enter property value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverage">Coverage Amount</Label>
              <Select value={formData.coverage} onValueChange={(value) => setFormData({ ...formData, coverage: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select coverage amount" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50% of value</SelectItem>
                  <SelectItem value="75">75% of value</SelectItem>
                  <SelectItem value="100">100% of value</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )
      default:
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                placeholder="Enter age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Coverage Amount</Label>
              <Input
                id="value"
                type="number"
                placeholder="Enter coverage amount"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term">Term (years)</Label>
              <Input
                id="term"
                type="number"
                placeholder="Enter term in years"
                value={formData.term}
                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
              />
            </div>
          </>
        )
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/calculate")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold capitalize">{type} Insurance Calculation</h2>
          <p className="text-muted-foreground">Fill in the details to calculate your premium.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insurance Details</CardTitle>
          <CardDescription>Please provide the required information for calculation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {getFormFields()}
            <Button type="submit" className="w-full">
              Calculate Premium
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CalculateForm