import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import axios from "axios"
import { AutocompleteInput, AutocompleteSuggestion } from "@/components/ui/autocomplete-input"
import { useClientSuggestions } from "@/hooks/useClientSuggestions"
import { getSavedQuoteId, waitForQuoteReady } from "@/lib/quoteUtils"

const GeneratingOverlay = () => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
    <h2 className="text-xl font-semibold text-foreground">Generating Quote...</h2>
    <p className="text-muted-foreground mt-2">Please wait while we prepare your quote</p>
  </div>
)

const IndividualLifeCoverForm = () => {
  const navigate = useNavigate()
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [showQuoteDialog, setShowQuoteDialog] = useState(false)
  const [isSavingQuote, setIsSavingQuote] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const formatMoney = (v: any) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return "-"
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatPercent = (v: any) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return "-"
  // v is 105 (not 1.05) per our backend
  return `${n.toFixed(0)}%`
}

const displayValue = (row: any) => {
  if (row?.format === "percent") return formatPercent(row.value)
  // currency
  return formatMoney(row.value)
}


  const { searchClients, loading: clientsLoading } = useClientSuggestions()

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

  const [customerDetails, setCustomerDetails] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    idNumber: "",
    contactNumber: "",
    email: ""
  })

  // Generate suggestions based on full name input
  const nameSuggestions = useMemo((): AutocompleteSuggestion[] => {
    return searchClients(customerDetails.fullName, "individual").map((client) => ({
      label: client.fullName || "",
      subtitle: client.idNumber || "",
      data: client
    }))
  }, [customerDetails.fullName, searchClients])

  const handleClientSelect = (suggestion: AutocompleteSuggestion) => {
    const client = suggestion.data
    setCustomerDetails({
      fullName: client.fullName || "",
      dateOfBirth: client.dateOfBirth || "",
      gender: client.gender || "",
      idNumber: client.idNumber || "",
      contactNumber: client.contactNumber || "",
      email: client.email || ""
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Cover limits based on product type (per Exclusive Life underwriting rules)
  const COVER_LIMITS: Record<string, Record<string, { min: number; max: number }>> = {
    meduw: {
      deathCover: { min: 500000, max: 10000000 },
      disabilityCover: { min: 500000, max: 6000000 },
      ciCover: { min: 250000, max: 2000000 },
    },
    nomeduw: {
      deathCover: { min: 500000, max: 1000000 },
      disabilityCover: { min: 500000, max: 1000000 },
      ciCover: { min: 250000, max: 250000 },
    },
  }

  const getLimits = (field: "deathCover" | "disabilityCover" | "ciCover") => {
    if (!formData.product) return null
    return COVER_LIMITS[formData.product]?.[field] || null
  }

  const formatLimit = (n: number) => n.toLocaleString()

  const getFieldError = (field: "deathCover" | "disabilityCover" | "ciCover"): string | null => {
    const limits = getLimits(field)
    if (!limits) return null
    const raw = formData[field]
    if (raw === "" || raw === undefined || raw === null) {
      // ciCover is optional — only error if required field is empty
      if (field === "ciCover") return null
      return null
    }
    const v = Number(raw)
    if (!Number.isFinite(v)) return "Enter a valid number"
    if (v < limits.min) return `Minimum is BWP ${formatLimit(limits.min)}`
    if (v > limits.max) return `Maximum is BWP ${formatLimit(limits.max)}`
    return null
  }

  const validateCovers = (): string | null => {
    if (!formData.product) return "Please select a product first"
    const fields: Array<"deathCover" | "disabilityCover" | "ciCover"> = [
      "deathCover",
      "disabilityCover",
      "ciCover",
    ]
    const labels: Record<string, string> = {
      deathCover: "Death Cover",
      disabilityCover: "Disability Cover",
      ciCover: "Critical Illness Cover",
    }
    for (const f of fields) {
      const limits = getLimits(f)
      if (!limits) continue
      const raw = formData[f]
      if (f === "ciCover" && (raw === "" || raw === undefined || raw === null)) continue
      const v = Number(raw)
      if (!Number.isFinite(v)) return `${labels[f]} must be a number`
      if (v < limits.min) return `${labels[f]} minimum is BWP ${formatLimit(limits.min)}`
      if (v > limits.max) return `${labels[f]} maximum is BWP ${formatLimit(limits.max)}`
    }
    return null
  }

  const handleCustomerDetailsChange = (field: string, value: string) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }))
  }

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateCovers()
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      setIsCalculating(true)
      setResult(null)

      const token = localStorage.getItem("token")

      const res = await fetch(
        "https://njs.exclusivelife.co.bw/api/quotes/calculate-individual-life",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(formData),
        }
      )

      const data = await res.json()
      console.log("🔥 RAW RESPONSE:", data)

      if (!res.ok) {
        throw new Error(data.error || data.message || `Status ${res.status}`)
      }

      // Node returns: { message, result, ok }
      const output = data.result || data.output || data

      setResult(output)
      setShowQuoteDialog(true)
      toast.success("Individual Life Cover calculated successfully")
    } catch (err: any) {
      console.error("❌ Calculation error:", err)
      toast.error(err.message || "Calculation failed")
    } finally {
      setIsCalculating(false)
    }
  }

  const handleFinalQuoteSubmit = async () => {
  const requiredFields = ["fullName", "dateOfBirth", "idNumber", "contactNumber", "email"] as const
  const missingFields = requiredFields.filter((f) => !customerDetails[f])

  if (missingFields.length > 0) {
    toast.error(`Please fill in: ${missingFields.join(", ")}`)
    return
  }

  if (!result) {
    toast.error("No calculation results to save.")
    return
  }

  setIsSavingQuote(true)

  try {
    const token = localStorage.getItem("token")

    const payload = {
      productType: "Individual Life Cover",
      client: {
        fullName: customerDetails.fullName,
        dateOfBirth: customerDetails.dateOfBirth,
        gender: customerDetails.gender,
        idNumber: customerDetails.idNumber,
        contactNumber: customerDetails.contactNumber,
        email: customerDetails.email,
      },
      inputs: formData,
      outputs: result, // or result.output if your API returns { output: {...} }
    }

    const res = await fetch("https://njs.exclusivelife.co.bw/api/new-quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || data.error || "Failed to save quote")
    }

    const savedQuoteId = getSavedQuoteId(data)

    if (!savedQuoteId) {
      throw new Error("Quote saved, but no quote record ID was returned")
    }

    toast.success(`Quote ${data.quoteId || data.quote?.quoteId} saved successfully!`)
    setShowQuoteDialog(false)
    setIsSavingQuote(false)
    setIsRedirecting(true)

    try {
      await waitForQuoteReady(savedQuoteId, { minimumMs: 2500 })
      navigate(`/quotes/${savedQuoteId}`)
      return
    } catch (readinessError) {
      console.error("Quote readiness error:", readinessError)
      throw new Error("Quote saved, but it is still being prepared. Please try again in a few seconds.")
    }
  } catch (err: any) {
    console.error("Save quote error:", err)
    setIsRedirecting(false)
    toast.error(err.message || "Failed to save quote")
    setIsSavingQuote(false)
  }
}

  const getDisplayValue = (field: string, value: string) => {
    const mappings: Record<string, Record<string, string>> = {
      gender: { male: "Male", female: "Female" },
      smokerStatus: { smoker: "Smoker", "non-smoker": "Non-smoker" },
      education: { degree: "Degree", "no-degree": "No Degree" },
      income: { "above-10k": ">P10k", "below-10k": "<=P10k" },
      marriageStatus: { married: "Married", single: "Single" },
      product: { nomeduw: "NoMedUW", meduw: "MedUW" },
      cashbackOption: { 
        "no-cashback": "No cashback", 
        "10-after-5": "10% after 5 years", 
        "120-after-15": "120% after 15 years" 
      }
    }
    return mappings[field]?.[value] || value
  }

  return (
    <>
      {isRedirecting && <GeneratingOverlay />}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Individual Life Cover</CardTitle>
          <CardDescription>
            Comprehensive life insurance protection tailored to your individual needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCalculate} className="space-y-6">

            {/* Demographic Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Client Personal Information</h3>

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
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
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
                  <Select value={formData.smokerStatus} onValueChange={(value) => handleInputChange("smokerStatus", value)}>
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
                  <Select value={formData.education} onValueChange={(value) => handleInputChange("education", value)}>
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
                  <Select value={formData.income} onValueChange={(value) => handleInputChange("income", value)}>
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
                  <Select value={formData.marriageStatus} onValueChange={(value) => handleInputChange("marriageStatus", value)}>
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
                  <Select value={formData.product} onValueChange={(value) => handleInputChange("product", value)}>
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
                  <Select value={formData.cashbackOption} onValueChange={(value) => handleInputChange("cashbackOption", value)}>
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

                {(["deathCover", "disabilityCover", "ciCover"] as const).map((field) => {
                  const labels = {
                    deathCover: "Death Cover",
                    disabilityCover: "Disability Cover",
                    ciCover: "Critical Illness Cover",
                  } as const
                  const placeholders = {
                    deathCover: "Enter death cover amount",
                    disabilityCover: "Enter disability cover amount",
                    ciCover: "Enter CI cover amount (optional)",
                  } as const
                  const limits = getLimits(field)
                  const error = getFieldError(field)
                  const isRequired = field !== "ciCover"
                  const displayVal = formData[field]
                    ? `BWP ${Number(formData[field]).toLocaleString("en-US")}`
                    : ""
                  return (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={field}>{labels[field]}</Label>
                      <Input
                        id={field}
                        type="text"
                        inputMode="numeric"
                        value={displayVal}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^0-9]/g, "")
                          handleInputChange(field, digits)
                        }}
                        placeholder={placeholders[field]}
                        required={isRequired}
                        aria-invalid={!!error}
                        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
                      />
                      {error && (
                        <p className="text-xs text-destructive">{error}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isCalculating}>
              {isCalculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                "Calculate"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quote Dialog */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Customer Quotation</DialogTitle>
            <DialogDescription>
              Enter customer details and review calculation results
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Customer Details Form */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <AutocompleteInput
                    value={customerDetails.fullName}
                    onChange={(e) => handleCustomerDetailsChange("fullName", e.target.value)}
                    placeholder="Enter full name"
                    suggestions={nameSuggestions}
                    onSelect={handleClientSelect}
                    loading={clientsLoading}
                    icon="individual"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={customerDetails.dateOfBirth}
                    onChange={(e) => handleCustomerDetailsChange("dateOfBirth", e.target.value)}
                    min="1900-01-01"
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Gender</Label>
                  <RadioGroup
                    value={customerDetails.gender}
                    onValueChange={(value) => handleCustomerDetailsChange("gender", value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Male" id="dialog-male" />
                      <Label htmlFor="dialog-male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Female" id="dialog-female" />
                      <Label htmlFor="dialog-female">Female</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>ID/Passport Number</Label>
                  <Input
                    value={customerDetails.idNumber}
                    onChange={(e) => handleCustomerDetailsChange("idNumber", e.target.value)}
                    placeholder="Enter ID number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input
                    value={customerDetails.contactNumber}
                    onChange={(e) => handleCustomerDetailsChange("contactNumber", e.target.value)}
                    placeholder="Enter contact number"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={customerDetails.email}
                    onChange={(e) => handleCustomerDetailsChange("email", e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Calculation Results */}
            <Card>
              <CardHeader>
                <CardTitle>Quotation Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
{result?.rows?.length && (
  <>
    <Separator />

    <div className="space-y-4">
      {/* Section title */}
      <h3 className="text-lg font-semibold">
        {result.section || "Premium"}
      </h3>

      {/* Rows */}
      <div className="space-y-3">
        {result.rows.map((row: any, idx: number) => {
          const isTotal = !!row.isTotal
          const isPercent = row.format === "percent"

          const displayValue =
            isPercent
              ? `${Number(row.value).toFixed(0)}%`
              : Number(row.value).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })

          return (
            <div
              key={`${row.label}-${idx}`}
              className={`flex justify-between items-center text-sm ${
                isTotal ? "font-bold text-base" : "text-muted-foreground"
              }`}
            >
              <span className={isTotal ? "text-foreground" : ""}>
                {row.label}
              </span>

              <span className="tabular-nums text-foreground">
                {displayValue}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  </>
)}


                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dialog Actions */}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setShowQuoteDialog(false)}>
              Return to Calculator
            </Button>
            <div className="space-x-2">
              <Button variant="secondary" onClick={() => setShowQuoteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleFinalQuoteSubmit} disabled={isSavingQuote}>
                {isSavingQuote ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Generate Quote"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default IndividualLifeCoverForm
