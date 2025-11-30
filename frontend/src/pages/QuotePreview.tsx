import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, FileText } from "lucide-react"

const QuotePreview = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { type, formData, premium, monthlyPremium, personalData } = location.state || {}

  const handleSaveAndDownload = () => {
    // Mock save functionality
    console.log("Saving quote:", { type, formData, premium, personalData })
    
    // Simulate download
    const element = document.createElement("a")
    const file = new Blob([`Insurance Quote\n\nType: ${type}\nPremium: $${premium}\nName: ${personalData?.firstName} ${personalData?.lastName}`], 
      { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `insurance-quote-${Date.now()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    
    navigate("/quotes")
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold">Quote Preview</h2>
          <p className="text-muted-foreground">Review your quote before saving.</p>
        </div>
      </div>

      <Card className="rounded-3xl border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Insurance Quote
              </CardTitle>
              <CardDescription>Quote generated on {new Date().toLocaleDateString()}</CardDescription>
            </div>
            <Badge variant="secondary" className="capitalize">{type} Insurance</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Premium Summary */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Annual Premium</p>
              <p className="text-3xl font-bold text-primary">${premium?.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">
                Monthly: ${monthlyPremium}/month
              </p>
            </div>
          </div>

          <Separator />

          {/* Personal Information */}
          <div>
            <h4 className="font-semibold mb-3">Personal Information</h4>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <span className="ml-2 font-medium">
                  {personalData?.firstName} {personalData?.lastName}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <span className="ml-2 font-medium">{personalData?.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <span className="ml-2 font-medium">{personalData?.phone}</span>
              </div>
              <div>
                <span className="text-muted-foreground">State:</span>
                <span className="ml-2 font-medium uppercase">{personalData?.state}</span>
              </div>
            </div>
            <div className="mt-2 text-sm">
              <span className="text-muted-foreground">Address:</span>
              <span className="ml-2 font-medium">
                {personalData?.address}, {personalData?.city}, {personalData?.zipCode}
              </span>
            </div>
            {personalData?.occupation && (
              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">Occupation:</span>
                <span className="ml-2 font-medium">{personalData.occupation}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Coverage Details */}
          <div>
            <h4 className="font-semibold mb-3">Coverage Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Insurance Type:</span>
                <span className="font-medium capitalize">{type}</span>
              </div>
              {formData?.age && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age:</span>
                  <span className="font-medium">{formData.age} years</span>
                </div>
              )}
              {formData?.value && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coverage Value:</span>
                  <span className="font-medium">${parseInt(formData.value).toLocaleString()}</span>
                </div>
              )}
              {formData?.coverage && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coverage Type:</span>
                  <span className="font-medium capitalize">{formData.coverage}</span>
                </div>
              )}
              {formData?.term && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Term:</span>
                  <span className="font-medium">{formData.term} years</span>
                </div>
              )}
            </div>
          </div>

          {personalData?.notes && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Additional Notes</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                  {personalData.notes}
                </p>
              </div>
            </>
          )}

          <Separator />

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
              Back to Edit
            </Button>
            <Button onClick={handleSaveAndDownload} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Save & Download Quote
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default QuotePreview