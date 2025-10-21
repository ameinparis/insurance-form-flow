import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Upload, Info, HelpCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Papa from "papaparse"
import * as XLSX from "xlsx"

const LifeFuneralQuotationForm = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [premiumResult, setPremiumResult] = useState<any | null>(null)
  const [showQuoteDialog, setShowQuoteDialog] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)

  const [customerDetails, setCustomerDetails] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    idNumber: "",
    contactNumber: "",
    email: ""
  })

const termsAndConditions = `
    This quotation outlines projected premiums for the selected funeral cover scheme. Premiums are based on the age, relationship, and cover amounts submitted, and are subject to change pending underwriting and validation of all data.

    Exclusive Life reserves the right to review and adjust these premiums at policy issuance. This quotation does not constitute a binding contract. Actual policy terms and conditions will be provided upon application approval.

    This quotation is confidential and may not be altered. Any unauthorized modifications will render this quote invalid.
  `

  const [formData, setFormData] = useState({
    profitTarget: "",
    societyName: "",
    asAndWhenCommission: "",
    schemeType: "",
    numberOfLives: "",
    maxExtendedFamilyMembers: "",
    maxAgeChildren: "",
    currentMaxAgeChild: "",
    coverLevelType: "",
    principalMemberCover: "",
    spouseCover: "",
    extendedFamilyCover: "",
    children16toMax: "",
    children6to15: "",
    children1to5: "",
    children0to1: "",
    parentsCover: ""
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    const fileExt = file.name.split(".").pop()?.toLowerCase()

    const parseData = (data: any[]) => {
      const cleanRows = data.filter((row) => Object.values(row).some(Boolean))
      const maxChildAge = cleanRows
        .filter((row) => (row["Member Status"] || "").toLowerCase() === "child")
        .map((row) => parseFloat(row["Age"]))
        .filter((age) => !isNaN(age))
        .reduce((max, age) => Math.max(max, age), 0)

      setFormData((prev) => ({
        ...prev,
        numberOfLives: String(cleanRows.length),
        currentMaxAgeChild: String(maxChildAge || "")
      }))
      toast.success(`${cleanRows.length} member records loaded`)
    }

    if (fileExt === "csv") {
      Papa.parse(file, {
        header: true,
        complete: (results) => parseData(results.data),
        error: (error) => toast.error(`CSV Parse Error: ${error.message}`)
      })
    } else if (fileExt === "xlsx" || fileExt === "xls") {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const data = evt.target?.result
        const workbook = XLSX.read(data, { type: "binary" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" })
        parseData(json)
      }
      reader.readAsBinaryString(file)
    } else {
      toast.error("Unsupported file type")
    }
  }

  const handleSubmit = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a member file first.")
      return
    }

    setIsCalculating(true)

    const syncedFormData = {
      ...formData,
      spouseCover: formData.spouseCover || formData.principalMemberCover || "0",
      extendedFamilyCover: formData.extendedFamilyCover || formData.principalMemberCover || "0"
    }

    const payload = new FormData()
    payload.append("file", uploadedFile)

    // Append form fields
    Object.entries(syncedFormData).forEach(([key, value]) => {
      payload.append(key, value)
    })

    try {
      const res = await fetch("http://localhost:5002/api/quotes/calculate-funeral", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: payload
      })

      if (!res.ok) throw new Error(`Status ${res.status}`)

      const result = await res.json()
      toast.success("Quotation calculated")

      // Store result in state
      setPremiumResult(result.result)

      // Open the customer details dialog
      setShowQuoteDialog(true)

    } catch (err: any) {
      console.error("Quote error", err)
      toast.error(`Failed to calculate: ${err.message}`)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleCreateQuote = async () => {
    const requiredFields = ['fullName', 'dateOfBirth', 'idNumber', 'contactNumber', 'email']
    const missingFields = requiredFields.filter((field) => !customerDetails[field])
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`)
      return
    }

    try {
      const res = await fetch("http://localhost:5002/api/new-quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          productType: "Exclusive Funeral",
          client: customerDetails,
          inputs: formData,
          outputs: premiumResult,
          termsAndConditions

        }),
      })

      if (!res.ok) throw new Error("Failed to save quote")

      const data = await res.json()
      toast.success(`Quote ${data.quoteId} saved successfully!`)
      setShowQuoteDialog(false)

      // optionally redirect or offer PDF download next

    } catch (err: any) {
      toast.error(err.message || "Failed to save quote")
    }
  }




  const isSchemeRules = formData.coverLevelType === "scheme-rules"

  const schemeTooltip = `An open scheme allows new members and is reviewed yearly. A closed scheme maintains the same premium unless members change rules.`
  const coverLevelTooltip = `"Scheme rules" apply fixed benefit levels to all members. "Member specified" means each member has custom cover defined in the uploaded data.`

  return (
    <TooltipProvider>
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upload Member Data</CardTitle>
                <CardDescription>Upload your member CSV or Excel file</CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
                    <HelpCircle className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-2xl p-4">
                  <div className="space-y-2">
                    <p className="font-semibold text-sm mb-3">Required CSV Format Example:</p>
                    <div className="overflow-x-auto">
                      <table className="text-xs border-collapse w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="px-2 py-1 text-left font-semibold">Member Number</th>
                            <th className="px-2 py-1 text-left font-semibold">Surname</th>
                            <th className="px-2 py-1 text-left font-semibold">First Name</th>
                            <th className="px-2 py-1 text-left font-semibold">Date of Birth</th>
                            <th className="px-2 py-1 text-left font-semibold">Relationship</th>
                            <th className="px-2 py-1 text-left font-semibold">Gender</th>
                            <th className="px-2 py-1 text-left font-semibold">Sum Assured</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="px-2 py-1">P1168</td>
                            <td className="px-2 py-1">Nkuatsama</td>
                            <td className="px-2 py-1">A.</td>
                            <td className="px-2 py-1">22/05/1953</td>
                            <td className="px-2 py-1">Adult Dependent</td>
                            <td className="px-2 py-1">M</td>
                            <td className="px-2 py-1">15000</td>
                          </tr>
                          <tr>
                            <td className="px-2 py-1">P1168</td>
                            <td className="px-2 py-1">Setotela</td>
                            <td className="px-2 py-1">Abednico</td>
                            <td className="px-2 py-1">20/04/1988</td>
                            <td className="px-2 py-1">Child</td>
                            <td className="px-2 py-1">F</td>
                            <td className="px-2 py-1">10000</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <Label htmlFor="file-upload" className="cursor-pointer text-primary hover:text-primary/80">
                Click to upload CSV or Excel file
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              {uploadedFile && (
                <p className="text-sm text-green-600 font-medium mt-2">✓ {uploadedFile.name} uploaded</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quotation Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quotation Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Form Inputs */}
              <div className="space-y-1">
                <Label htmlFor="profitTarget">Profit Target (%)</Label>
                <Input
                  id="profitTarget"
                  type="number"
                  step="0.01"
                  value={formData.profitTarget}
                  onChange={(e) => handleInputChange("profitTarget", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="societyName">Society Name</Label>
                <Input
                  id="societyName"
                  type="text"
                  value={formData.societyName}
                  onChange={(e) => handleInputChange("societyName", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="asAndWhenCommission">As-and-When Commission (%)</Label>
                <Input
                  id="asAndWhenCommission"
                  type="number"
                  step="0.01"
                  value={formData.asAndWhenCommission}
                  onChange={(e) => handleInputChange("asAndWhenCommission", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="schemeType">Scheme Type</Label>
                <Select
                  value={formData.schemeType}
                  onValueChange={(value) => handleInputChange("schemeType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scheme type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground mt-1 flex items-start gap-1">
                  <Info className="h-4 w-4 mt-0.5" />
                  <span>{schemeTooltip}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="numberOfLives">Number of Lives in Scheme</Label>
                <Input
                  id="numberOfLives"
                  type="number"
                  value={formData.numberOfLives}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="maxExtendedFamilyMembers">Max Extended Family Members</Label>
                <Input
                  id="maxExtendedFamilyMembers"
                  type="number"
                  value={formData.maxExtendedFamilyMembers}
                  onChange={(e) => handleInputChange("maxExtendedFamilyMembers", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="maxAgeChildren">Max Age of Children Covered</Label>
                <Input
                  id="maxAgeChildren"
                  type="number"
                  value={formData.maxAgeChildren}
                  onChange={(e) => handleInputChange("maxAgeChildren", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="currentMaxAgeChild">Current Max Age of Child in Data</Label>
                <Input
                  id="currentMaxAgeChild"
                  type="number"
                  value={formData.currentMaxAgeChild}
                  onChange={(e) => handleInputChange("currentMaxAgeChild", e.target.value)}
                />

              </div>

              {/* Cover Levels Dropdown */}
              <div className="space-y-1 col-span-1 md:col-span-2">
                <Label htmlFor="coverLevelType">Cover Levels</Label>
                <Select
                  value={formData.coverLevelType}
                  onValueChange={(value) => handleInputChange("coverLevelType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select cover type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheme-rules">Scheme Rules Benefits</SelectItem>
                    <SelectItem value="member-specified">Member Specified</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground mt-1 flex items-start gap-1">
                  <Info className="h-4 w-4 mt-0.5" />
                  <span>{coverLevelTooltip}</span>
                </div>
              </div>

              {/* Scheme Rules Cover Levels (if selected) */}
              {isSchemeRules && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="principalMemberCover">Principal Member Cover (R)</Label>
                    <Input
                      id="principalMemberCover"
                      type="number"
                      value={formData.principalMemberCover}
                      onChange={(e) => handleInputChange("principalMemberCover", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="spouseCover">Spouse Cover (Same as Principal)</Label>
                    <Input
                      id="spouseCover"
                      type="number"
                      value={formData.spouseCover || formData.principalMemberCover}
                      onChange={(e) => handleInputChange("spouseCover", e.target.value)}
                    />

                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="children16toMax">
                      Children age 16 to {formData.currentMaxAgeChild || "XX"}
                    </Label>

                    <Input
                      id="children16toMax"
                      type="number"
                      value={formData.children16toMax}
                      onChange={(e) => handleInputChange("children16toMax", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="children6to15">Children age 6 to 15</Label>
                    <Input
                      id="children6to15"
                      type="number"
                      value={formData.children6to15}
                      onChange={(e) => handleInputChange("children6to15", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="children1to5">Children age 1 to 5</Label>
                    <Input
                      id="children1to5"
                      type="number"
                      value={formData.children1to5}
                      onChange={(e) => handleInputChange("children1to5", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="children0to1">Children age 0 to 1</Label>
                    <Input
                      id="children0to1"
                      type="number"
                      value={formData.children0to1}
                      onChange={(e) => handleInputChange("children0to1", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="extendedFamilyCover">Extended Family Cover (Same as Principal)</Label>
                    <Input
                      id="extendedFamilyCover"
                      type="number"
                      value={formData.extendedFamilyCover || formData.principalMemberCover}
                      onChange={(e) => handleInputChange("extendedFamilyCover", e.target.value)}
                    />

                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="parentsCover">Parents Cover</Label>
                    <Input
                      id="parentsCover"
                      type="number"
                      value={formData.parentsCover}
                      onChange={(e) => handleInputChange("parentsCover", e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!uploadedFile || isCalculating}>
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              "Calculate Quotation"
            )}
          </Button>
        </div>

        {premiumResult && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>Quotation Results</CardTitle>
              <CardDescription>Calculated premiums based on your inputs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {premiumResult?.quoteName && (
                <div className="text-lg font-semibold text-primary">{premiumResult.quoteName}</div>
              )}

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {premiumResult?.rows?.map((row: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 bg-background space-y-2">
                    <h4 className="font-semibold capitalize text-primary">{row.status}</h4>
                    <Separator className="my-2" />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">{row.total != null ? `BWP ${row.total.toFixed(2)}` : "–"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Count:</span>
                        <span className="font-medium">{row.count ?? "–"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Per Member:</span>
                        <span className="font-medium">{row.perMember != null ? `BWP ${row.perMember.toFixed(2)}` : "–"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowQuoteDialog(true)}>Create Quote</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quote Dialog */}
        <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Customer Funeral Quotation</DialogTitle>
              <DialogDescription>
                Enter customer details and review quotation results
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Customer Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={customerDetails.fullName}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={customerDetails.dateOfBirth}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <RadioGroup
                      value={customerDetails.gender}
                      onValueChange={(value) => setCustomerDetails((prev) => ({ ...prev, gender: value }))}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Male" id="male" />
                        <Label htmlFor="male">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Female" id="female" />
                        <Label htmlFor="female">Female</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>ID/Passport Number</Label>
                    <Input
                      value={customerDetails.idNumber}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, idNumber: e.target.value }))}
                      placeholder="Enter ID number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contact Number</Label>
                    <Input
                      value={customerDetails.contactNumber}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, contactNumber: e.target.value }))}
                      placeholder="Enter contact number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={customerDetails.email}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Quotation Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Quotation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {premiumResult ? (
                    <>
                      {premiumResult.quoteName && (
                        <div className="font-semibold text-primary">{premiumResult.quoteName}</div>
                      )}

                      <Separator />

                      <div className="space-y-3">
                        {premiumResult.rows?.map((row: any, index: number) => (
                          <div key={index} className="border rounded-lg p-3 bg-muted/30 space-y-1">
                            <h4 className="font-semibold capitalize text-sm">{row.status}</h4>
                            <div className="text-xs space-y-0.5">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total:</span>
                                <span>{row.total != null ? `BWP ${row.total.toFixed(2)}` : "–"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Count:</span>
                                <span>{row.count ?? "–"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Per Member:</span>
                                <span>{row.perMember != null ? `BWP ${row.perMember.toFixed(2)}` : "–"}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground text-sm">No quotation results available</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Terms Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Terms and Conditions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p>
                  This quotation outlines projected premiums for the selected funeral cover scheme. Premiums are based on the age, relationship, and cover amounts submitted, and are subject to change pending underwriting and validation of all data.
                </p>
                <p>
                  Exclusive Life reserves the right to review and adjust these premiums at policy issuance. This quotation does not constitute a binding contract. Actual policy terms and conditions will be provided upon application approval.
                </p>
                <p>
                  This quotation is confidential and may not be altered. Any unauthorized modifications will render this quote invalid.
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setShowQuoteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateQuote}>Generate Quote</Button>
            </div>
          </DialogContent>
        </Dialog>


      </div>
    </TooltipProvider>
  )
}

export default LifeFuneralQuotationForm
