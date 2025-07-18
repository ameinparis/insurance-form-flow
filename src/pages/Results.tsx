import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CheckCircle } from "lucide-react"

const Results = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { type, formData } = location.state || {}

  // Mock calculation based on form data
  const calculatePremium = () => {
    const baseRate = type === "auto" ? 800 : type === "home" ? 600 : 1200
    const value = parseInt(formData?.value || "0")
    const age = parseInt(formData?.age || "25")
    
    let premium = baseRate
    if (value) premium += value * 0.02
    if (age < 25) premium += 200
    if (age > 60) premium += 100
    
    return Math.round(premium)
  }

  const premium = calculatePremium()
  const monthlyPremium = Math.round(premium / 12)

  const handleProceedToQuote = () => {
    navigate("/quote/personal-details", { 
      state: { type, formData, premium, monthlyPremium } 
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold">Calculation Results</h2>
          <p className="text-muted-foreground">Your premium calculation is ready.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <CardTitle className="text-xl">Calculation Complete</CardTitle>
          </div>
          <CardDescription>
            Based on your inputs, here's your premium calculation for {type} insurance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Annual Premium</p>
              <p className="text-4xl font-bold text-primary">${premium.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">
                Or ${monthlyPremium}/month
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold">Calculation Details:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Insurance Type:</span>
                <span className="font-medium capitalize">{type}</span>
              </div>
              {formData?.age && (
                <div className="flex justify-between">
                  <span>Age:</span>
                  <span className="font-medium">{formData.age} years</span>
                </div>
              )}
              {formData?.value && (
                <div className="flex justify-between">
                  <span>Coverage Value:</span>
                  <span className="font-medium">${parseInt(formData.value).toLocaleString()}</span>
                </div>
              )}
              {formData?.coverage && (
                <div className="flex justify-between">
                  <span>Coverage Type:</span>
                  <span className="font-medium capitalize">{formData.coverage}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate("/calculate")} className="flex-1">
              New Calculation
            </Button>
            <Button onClick={handleProceedToQuote} className="flex-1">
              Proceed to Create Quote
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Results