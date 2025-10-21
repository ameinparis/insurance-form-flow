import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Upload, Info, HelpCircle } from "lucide-react"
import { toast } from "sonner"
import Papa from "papaparse"
import * as XLSX from "xlsx"

const LifeFuneralQuotationForm = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [premiumResult, setPremiumResult] = useState<any | null>(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)

  const [customerDetails, setCustomerDetails] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    idNumber: "",
    contactNumber: "",
    email: ""
  })



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
      setPremiumResult(result)

      // Open the customer details modal
      setShowCustomerModal(true)

    } catch (err: any) {
      console.error("Quote error", err)
      toast.error(`Failed to calculate: ${err.message}`)
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
        productType: "funeral",
        client: customerDetails,
        inputs: formData,
        outputs: premiumResult.result,
        createdByName: localStorage.getItem("fullName") || "Unknown User"
      }),
    })

    if (!res.ok) throw new Error("Failed to save quote")

    const data = await res.json()
    toast.success(`Quote ${data.quoteId} saved successfully!`)
    setShowCustomerModal(false)

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
          <Button onClick={handleSubmit} disabled={!uploadedFile}>
            Calculate Quotation
          </Button>
        </div>

        {premiumResult && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quotation Results</CardTitle>
              <CardDescription>Based on the uploaded data and inputs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {Object.entries(premiumResult.result || {}).map(([key, values]: any) => (

                  <div key={key} className="border rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold capitalize mb-2">{key.replace(/([A-Z])/g, ' $1')}</h4>
                    <p><strong>Total:</strong> {values.total || 0}</p>
                    <p><strong>Count:</strong> {values.count || 0}</p>
                    <p><strong>Per Member:</strong> {values.perMember || 0}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={() => setShowCustomerModal(true)}>Create Quote</Button>
              </div>
            </CardContent>
        {showCustomerModal && (
  <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg w-full max-w-5xl space-y-6 shadow-xl max-h-[90vh] overflow-y-auto">
      <h2 className="text-lg font-semibold">Create Customer Funeral Quotation</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="space-y-4">
          <h3 className="text-base font-medium">Customer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={customerDetails.fullName}
                onChange={(e) => setCustomerDetails((prev) => ({ ...prev, fullName: e.target.value }))}
              />
            </div>

            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={customerDetails.dateOfBirth}
                onChange={(e) => setCustomerDetails((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
              />
            </div>

            <div>
              <Label>Gender</Label>
              <Select
                value={customerDetails.gender}
                onValueChange={(value) => setCustomerDetails((prev) => ({ ...prev, gender: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>ID Number</Label>
              <Input
                value={customerDetails.idNumber}
                onChange={(e) => setCustomerDetails((prev) => ({ ...prev, idNumber: e.target.value }))}
              />
            </div>

            <div>
              <Label>Contact Number</Label>
              <Input
                value={customerDetails.contactNumber}
                onChange={(e) => setCustomerDetails((prev) => ({ ...prev, contactNumber: e.target.value }))}
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={customerDetails.email}
                onChange={(e) => setCustomerDetails((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>
        </div>

     {/* Quotation Summary */}
<div className="space-y-4">
  <h3 className="text-base font-medium">Quotation Summary</h3>

  {premiumResult?.result ? (
    <div >
      {Object.entries(premiumResult.result).map(([key, values]: any) => (
        <div key={key} className="border rounded-lg p-4 shadow-sm bg-muted/40">
          <h4 className="font-semibold capitalize mb-2">
            {key.replace(/([A-Z])/g, ' $1')}
          </h4>
          <p><strong>Total:</strong> BWP {values.total?.toLocaleString() || 0}</p>
          <p><strong>Count:</strong> {values.count || 0}</p>
          <p><strong>Per Member:</strong> BWP {values.perMember?.toLocaleString() || 0}</p>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-muted-foreground text-sm">No quotation results yet.</div>
  )}
</div>

      </div>

      {/* Ts & Cs */}
      <div className="border rounded bg-muted/40 p-4 text-sm space-y-3">
        <h4 className="font-medium">Terms and Conditions</h4>
        <p>
          This quotation outlines projected premiums for the selected funeral cover scheme. Premiums are based on the age, relationship, and cover amounts submitted, and are subject to change pending underwriting and validation of all data.
        </p>
        <p>
          Exclusive Life reserves the right to review and adjust these premiums at policy issuance. This quotation does not constitute a binding contract. Actual policy terms and conditions will be provided upon application approval.
        </p>
        <p>
          This quotation is confidential and may not be altered. Any unauthorized modifications will render this quote invalid.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={() => setShowCustomerModal(false)}>
          Cancel
        </Button>
        <Button onClick={handleCreateQuote}>Generate Quote</Button>
      </div>
    </div>
  </div>
)}

          </Card>
        )}


      </div>
    </TooltipProvider>
  )
}

export default LifeFuneralQuotationForm
