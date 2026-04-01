import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Upload, Info, HelpCircle, Loader2, Users } from "lucide-react"
import { toast } from "sonner"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { useBackgroundJob } from "@/contexts/BackgroundJobContext"
import { AutocompleteInput, AutocompleteSuggestion } from "@/components/ui/autocomplete-input"
import { useClientSuggestions } from "@/hooks/useClientSuggestions"

interface DetectedRoles {
  principal: number
  spouse: number
  child: number
  adultDependent: number
  extended: number
}

const EMPTY_ROLES: DetectedRoles = { principal: 0, spouse: 0, child: 0, adultDependent: 0, extended: 0 }

function classifyRelationship(raw: string): keyof DetectedRoles | null {
  const rel = (raw || "").toString().trim().toLowerCase()
  if (!rel) return null
  if (["principal member", "principal", "member", "main member"].includes(rel)) return "principal"
  if (rel === "spouse") return "spouse"
  if (rel.includes("adult dependent")) return "adultDependent"
  if (rel.includes("child")) return "child"
  if (rel.includes("extended")) return "extended"
  return null
}

const LifeFuneralQuotationForm = () => {
  const navigate = useNavigate()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [premiumResult, setPremiumResult] = useState<any | null>(null)
  const [showQuoteDialog, setShowQuoteDialog] = useState(false)
  const [detectedRoles, setDetectedRoles] = useState<DetectedRoles>(EMPTY_ROLES)
  const [showAllFields, setShowAllFields] = useState(false)

  const {
    addJob,
    updateJob,
    setJobViewResultsCallback
  } = useBackgroundJob()

  const { searchClients, loading: clientsLoading } = useClientSuggestions()

  const [customerDetails, setCustomerDetails] = useState({
    companyName: "",
    registrationNumber: "",
    companyContact: "",
    companyEmail: ""
  })

  useEffect(() => {
    if (showQuoteDialog && formData.societyName && !customerDetails.companyName) {
      setCustomerDetails((prev) => ({ ...prev, companyName: formData.societyName }))
    }
  }, [showQuoteDialog])

  const companySuggestions = useMemo((): AutocompleteSuggestion[] => {
    return searchClients(customerDetails.companyName, "corporate").map((client) => ({
      label: client.companyName || client.schemeName || "",
      subtitle: client.registrationNumber || "",
      data: client
    }))
  }, [customerDetails.companyName, searchClients])

  const handleCompanySelect = (suggestion: AutocompleteSuggestion) => {
    const client = suggestion.data
    setCustomerDetails({
      companyName: client.companyName || client.schemeName || "",
      registrationNumber: client.registrationNumber || "",
      companyContact: client.companyContact || client.contactPhone || "",
      companyEmail: client.companyEmail || client.contactEmail || ""
    })
  }

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

  const toNumericString = (val: string) => {
    if (val == null) return ""
    return String(val).replace(/[^0-9.]/g, "")
  }

  const NUMERIC_FIELDS = new Set([
    "profitTarget", "asAndWhenCommission", "numberOfLives", "maxExtendedFamilyMembers",
    "maxAgeChildren", "currentMaxAgeChild", "principalMemberCover", "spouseCover",
    "extendedFamilyCover", "children16toMax", "children6to15", "children1to5",
    "children0to1", "parentsCover",
  ])

  // Derived visibility flags
  const hasFile = uploadedFile !== null
  const totalDetected = detectedRoles.principal + detectedRoles.spouse + detectedRoles.child + detectedRoles.adultDependent + detectedRoles.extended

  const showPrincipal = true // always shown
  const showSpouse = showAllFields || detectedRoles.spouse > 0 || !hasFile
  const showChildren = showAllFields || detectedRoles.child > 0 || !hasFile
  const showExtended = showAllFields || detectedRoles.extended > 0 || !hasFile
  const showAdultDependent = showAllFields || detectedRoles.adultDependent > 0 || !hasFile

  const handleInputChange = (field: string, value: string) => {
    const isNumeric = NUMERIC_FIELDS.has(field)
    const clean = isNumeric ? toNumericString(value) : value

    const updated: any = { ...formData, [field]: clean }

    // Role-aware auto-fill when principal changes
    if (field === "principalMemberCover") {
      const principal = parseFloat(toNumericString(value)) || 0
      if (showSpouse) updated.spouseCover = String(principal.toFixed(2))
      if (showChildren) {
        updated.children16toMax = String((principal * 1).toFixed(2))
        updated.children6to15 = String((principal * 0.75).toFixed(2))
        updated.children1to5 = String((principal * 0.5).toFixed(2))
        updated.children0to1 = String((principal * 0.25).toFixed(2))
      }
      if (showExtended) updated.extendedFamilyCover = String(principal.toFixed(2))
    }

    setFormData(updated)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedFile(file)
    const fileExt = file.name.split(".").pop()?.toLowerCase()

    const parseData = (data: any[]) => {
      const cleanRows = data.filter((row) => Object.values(row).some(Boolean))

      // Detect role composition
      const roles: DetectedRoles = { principal: 0, spouse: 0, child: 0, adultDependent: 0, extended: 0 }

      const today = new Date()
      let maxChildAge = 0
      cleanRows.forEach((row) => {
        const relRaw = (row["Relationship"] || row["Member Status"] || "").toString()
        const role = classifyRelationship(relRaw)
        if (role) roles[role]++

        // Existing max child age logic
        const rel = relRaw.toLowerCase()
        if (rel.includes("child")) {
          const dobRaw = row["DOB"] || row["Date of Birth"] || row["dob"] || row["date of birth"]
          if (dobRaw) {
            let dob: Date | null = null
            if (typeof dobRaw === "number") {
              dob = new Date(Math.round((dobRaw - 25569) * 86400 * 1000))
            } else {
              const s = String(dobRaw).trim()
              const ddmm = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/)
              if (ddmm) {
                dob = new Date(parseInt(ddmm[3]), parseInt(ddmm[2]) - 1, parseInt(ddmm[1]))
              } else {
                dob = new Date(s)
              }
            }
            if (dob && !isNaN(dob.getTime())) {
              let age = today.getFullYear() - dob.getFullYear()
              const m = today.getMonth() - dob.getMonth()
              if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
              if (age > maxChildAge) maxChildAge = age
            }
          }
        }
      })

      setDetectedRoles(roles)

      setFormData((prev) => ({
        ...prev,
        numberOfLives: String(cleanRows.length),
        currentMaxAgeChild: maxChildAge > 0 ? String(maxChildAge) : ""
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

  const pollJob = (backendJobId: string, widgetJobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `http://localhost:5002/api/quotes/funeral/status/${backendJobId}`
        )
        const data = await res.json()
        console.log("Polling job:", data)

        if (data.progress !== undefined) {
          updateJob(widgetJobId, { progress: data.progress })
        }

        if (data.status === "done") {
          clearInterval(interval)
          updateJob(widgetJobId, { progress: 100, status: "done" })
          setPremiumResult(data.result)
          setJobViewResultsCallback(widgetJobId, () => {
            setShowQuoteDialog(true)
          })
        }

        if (data.status === "error") {
          clearInterval(interval)
          updateJob(widgetJobId, {
            progress: 0,
            status: "error",
            errorMessage: data.error || "Calculation failed"
          })
        }
      } catch (err) {
        clearInterval(interval)
        updateJob(widgetJobId, {
          progress: 0,
          status: "error",
          errorMessage: "Polling failed - please try again"
        })
      }
    }, 1000)
  }

  const handleSubmit = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a member file first.")
      return
    }

    const required = [
      ["profitTarget", "Profit Target (%)"],
      ["societyName", "Society Name"],
      ["asAndWhenCommission", "As-and-When Commission (%)"],
      ["schemeType", "Scheme Type"],
      ["coverLevelType", "Cover Levels"],
      ["principalMemberCover", "Principal Member Cover"],
    ] as const

    const missing = required
      .filter(([key]) => !String((formData as any)[key] ?? "").trim())
      .map(([, label]) => label)

    if (missing.length) {
      toast.error(`Please fill in: ${missing.join(", ")}`)
      return
    }

    const mustBePositive = [
      ["profitTarget", "Profit Target (%)"],
      ["asAndWhenCommission", "As-and-When Commission (%)"],
      ["principalMemberCover", "Principal Member Cover"],
    ] as const

    const invalidNums = mustBePositive
      .filter(([key]) => {
        const raw = String((formData as any)[key] ?? "")
        const num = parseFloat(toNumericString(raw))
        return !isFinite(num) || num <= 0
      })
      .map(([, label]) => label)

    if (invalidNums.length) {
      toast.error(`These must be greater than 0: ${invalidNums.join(", ")}`)
      return
    }

    const widgetJobId = addJob(`Funeral: ${formData.societyName || "Calculation"}`)

    // Zero out hidden fields before submit
    const submitData = { ...formData }
    if (!showSpouse) submitData.spouseCover = "0"
    if (!showChildren) {
      submitData.children16toMax = "0"
      submitData.children6to15 = "0"
      submitData.children1to5 = "0"
      submitData.children0to1 = "0"
    }
    if (!showExtended) submitData.extendedFamilyCover = "0"
    if (!showAdultDependent) submitData.parentsCover = "0"

    const syncedFormData = {
      ...submitData,
      spouseCover: submitData.spouseCover || submitData.principalMemberCover || "0",
      extendedFamilyCover: submitData.extendedFamilyCover || submitData.principalMemberCover || "0",
    }

    // If those sections are hidden, keep them as "0"
    if (!showSpouse) syncedFormData.spouseCover = "0"
    if (!showExtended) syncedFormData.extendedFamilyCover = "0"

    const OPTIONAL_NUMERIC_DEFAULT_ZERO = new Set([
      "parentsCover", "spouseCover", "extendedFamilyCover",
      "children16toMax", "children6to15", "children1to5", "children0to1",
      "maxExtendedFamilyMembers", "maxAgeChildren", "currentMaxAgeChild",
    ])

    const numericKeys = [
      "profitTarget", "asAndWhenCommission", "numberOfLives", "maxExtendedFamilyMembers",
      "maxAgeChildren", "currentMaxAgeChild", "principalMemberCover", "spouseCover",
      "extendedFamilyCover", "children16toMax", "children6to15", "children1to5", "children0to1", "parentsCover"
    ]

    const cleanedFormData: Record<string, string> = {}
    Object.entries(syncedFormData).forEach(([k, v]) => {
      if (numericKeys.includes(k)) {
        const s = toNumericString(String(v ?? ""))
        if (s === "") {
          cleanedFormData[k] = OPTIONAL_NUMERIC_DEFAULT_ZERO.has(k) ? "0" : ""
        } else {
          cleanedFormData[k] = s
        }
      } else {
        cleanedFormData[k] = String(v ?? "")
      }
    })

    const payload = new FormData()
    payload.append("file", uploadedFile)
    Object.entries(cleanedFormData).forEach(([key, value]) => payload.append(key, value))

    try {
      const res = await fetch("http://localhost:5002/api/quotes/funeral/start", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: payload
      })

      if (!res.ok) {
        updateJob(widgetJobId, {
          progress: 0,
          status: "error",
          errorMessage: "Failed to start calculation"
        })
        return
      }

      const { jobId: backendJobId } = await res.json()
      console.log("Started job:", backendJobId)
      pollJob(backendJobId, widgetJobId)
    } catch (err: any) {
      console.error("Quote error", err)
      updateJob(widgetJobId, {
        progress: 0,
        status: "error",
        errorMessage: err.message || "Failed to calculate"
      })
    }
  }

  const [isSavingQuote, setIsSavingQuote] = useState(false)

  const handleCreateQuote = async () => {
    const requiredFields = ['companyName', 'registrationNumber', 'companyContact', 'companyEmail']
    const missingFields = requiredFields.filter((field) => !customerDetails[field])
    if (missingFields.length > 0) {
      toast.error(`Please fill in: ${missingFields.join(', ')}`)
      return
    }

    setIsSavingQuote(true)
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
        }),
      })

      if (!res.ok) throw new Error("Failed to save quote")

      const data = await res.json()
      toast.success(`Quote ${data.quoteId} saved successfully!`)
      setShowQuoteDialog(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to save quote")
      setIsSavingQuote(false)
    }
  }

  const isSchemeRules = formData.coverLevelType === "scheme-rules"

  const schemeTooltip = `An open scheme allows new members and is reviewed yearly. A closed scheme maintains the same premium unless members change rules.`
  const coverLevelTooltip = `"Scheme rules" apply fixed benefit levels to all members. "Member specified" means each member has custom cover defined in the uploaded data.`

  return (
    <TooltipProvider>
      <div className="w-full space-y-6">
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
                    <p className="font-semibold text-sm mb-2">Required File Format (CSV or Excel):</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Headers are required. DOB column can be <b>DOB</b> or <b>Date of Birth</b>.
                    </p>
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
                            <td className="px-2 py-1">Sipho</td>
                            <td className="px-2 py-1"></td>
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

        {/* Detected Composition Summary */}
        {hasFile && totalDetected > 0 && (
          <Alert className="border-primary/20 bg-primary/5">
            <Users className="h-4 w-4" />
            <AlertDescription>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span className="font-semibold text-foreground">Detected Composition:</span>
                {detectedRoles.principal > 0 && (
                  <span>Principal Members: <strong>{detectedRoles.principal}</strong></span>
                )}
                {detectedRoles.spouse > 0 && (
                  <span>Spouses: <strong>{detectedRoles.spouse}</strong></span>
                )}
                {detectedRoles.child > 0 && (
                  <span>Children: <strong>{detectedRoles.child}</strong></span>
                )}
                {detectedRoles.adultDependent > 0 && (
                  <span>Adult Dependents: <strong>{detectedRoles.adultDependent}</strong></span>
                )}
                {detectedRoles.extended > 0 && (
                  <span>Extended Family: <strong>{detectedRoles.extended}</strong></span>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Quotation Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1">
                <Label htmlFor="profitTarget">Profit Target (%)<span className="text-red-500">*</span></Label>
                <Input
                  id="profitTarget"
                  type="number"
                  step="0.01"
                  value={formData.profitTarget}
                  onChange={(e) => handleInputChange("profitTarget", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="societyName">Society Name<span className="text-red-500">*</span></Label>
                <Input
                  id="societyName"
                  type="text"
                  value={formData.societyName}
                  onChange={(e) => handleInputChange("societyName", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="asAndWhenCommission">As-and-When Commission (%)<span className="text-red-500">*</span></Label>
                <Input
                  id="asAndWhenCommission"
                  type="number"
                  step="0.01"
                  value={formData.asAndWhenCommission}
                  onChange={(e) => handleInputChange("asAndWhenCommission", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="schemeType">Scheme Type<span className="text-red-500">*</span></Label>
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
                <Label htmlFor="numberOfLives">Number of Lives in Scheme<span className="text-red-500">*</span></Label>
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
                  readOnly
                  className="bg-muted"
                />
              </div>

              {/* Cover Levels Dropdown */}
              <div className="space-y-1 col-span-1 md:col-span-2">
                <Label htmlFor="coverLevelType">Cover Levels<span className="text-red-500">*</span></Label>
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

              {/* Manual Override Toggle */}
              {hasFile && totalDetected > 0 && (
                <div className="col-span-1 md:col-span-2 flex items-center gap-3 py-2">
                  <Switch
                    id="showAllFields"
                    checked={showAllFields}
                    onCheckedChange={setShowAllFields}
                  />
                  <Label htmlFor="showAllFields" className="cursor-pointer text-sm">
                    {showAllFields ? "Showing all cover fields" : "Using uploaded member composition"}
                  </Label>
                </div>
              )}

              {/* Principal Member Cover - always visible */}
              <div className="space-y-1">
                <Label htmlFor="principalMemberCover">Principal Member Cover<span className="text-red-500">*</span></Label>
                <Input
                  id="principalMemberCover"
                  type="number"
                  step="1"
                  inputMode="decimal"
                  value={formData.principalMemberCover}
                  onChange={(e) => handleInputChange("principalMemberCover", e.target.value)}
                />
              </div>

              {/* Spouse Cover */}
              {showSpouse && (
                <div className="space-y-1">
                  <Label htmlFor="spouseCover">Spouse Cover (Same as Principal)</Label>
                  <Input
                    id="spouseCover"
                    type="number"
                    step="1"
                    inputMode="decimal"
                    value={formData.spouseCover}
                    onChange={(e) => handleInputChange("spouseCover", e.target.value)}
                  />
                </div>
              )}

              {/* Children Cover Fields */}
              {showChildren && (
                <>
                  <div className="space-y-1">
                    <Label htmlFor="children16toMax">
                      Children age 16 to {formData.currentMaxAgeChild || "XX"}
                    </Label>
                    <Input
                      id="children16toMax"
                      type="number"
                      step="1"
                      inputMode="decimal"
                      value={formData.children16toMax}
                      onChange={(e) => handleInputChange("children16toMax", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="children6to15">Children age 6 to 15</Label>
                    <Input
                      id="children6to15"
                      type="number"
                      step="1"
                      inputMode="decimal"
                      value={formData.children6to15}
                      onChange={(e) => handleInputChange("children6to15", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="children1to5">Children age 1 to 5</Label>
                    <Input
                      id="children1to5"
                      type="number"
                      step="1"
                      inputMode="decimal"
                      value={formData.children1to5}
                      onChange={(e) => handleInputChange("children1to5", e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="children0to1">Children age 0 to 1</Label>
                    <Input
                      id="children0to1"
                      type="number"
                      step="1"
                      inputMode="decimal"
                      value={formData.children0to1}
                      onChange={(e) => handleInputChange("children0to1", e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Extended Family Cover */}
              {showExtended && (
                <div className="space-y-1">
                  <Label htmlFor="extendedFamilyCover">Extended Family Cover</Label>
                  <Input
                    id="extendedFamilyCover"
                    type="number"
                    step="1"
                    inputMode="decimal"
                    value={formData.extendedFamilyCover}
                    onChange={(e) => handleInputChange("extendedFamilyCover", e.target.value)}
                  />
                </div>
              )}

              {/* Parents / Adult Dependent Cover */}
              {showAdultDependent && (
                <div className="space-y-1">
                  <Label htmlFor="parentsCover">Parents Cover</Label>
                  <Input
                    id="parentsCover"
                    type="number"
                    step="1"
                    inputMode="decimal"
                    value={formData.parentsCover}
                    onChange={(e) => handleInputChange("parentsCover", e.target.value)}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!uploadedFile}>
            Calculate Quotation
          </Button>
        </div>

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
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Scheme / Corporate Name</Label>
                    <AutocompleteInput
                      value={customerDetails.companyName}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, companyName: e.target.value }))}
                      placeholder="e.g. Exclusive Life Holdings"
                      suggestions={companySuggestions}
                      onSelect={handleCompanySelect}
                      loading={clientsLoading}
                      icon="corporate"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Registration Number</Label>
                    <Input
                      value={customerDetails.registrationNumber}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, registrationNumber: e.target.value }))}
                      placeholder="e.g. BW0000012345"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Company Contact Number</Label>
                    <Input
                      value={customerDetails.companyContact}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, companyContact: e.target.value }))}
                      placeholder="e.g. +267 395 0000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Company Email</Label>
                    <Input
                      type="email"
                      value={customerDetails.companyEmail}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, companyEmail: e.target.value }))}
                      placeholder="e.g. admin@exclusivelife.co.bw"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quotation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {premiumResult ? (
                    <>
                      <Separator />
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead className="bg-muted">
                            <tr className="text-left">
                              <th className="p-2 font-semibold">Member Status</th>
                              <th className="p-2 font-semibold">Total Premium</th>
                              <th className="p-2 font-semibold">Number of Beneficiaries</th>
                              <th className="p-2 font-semibold">Premium per month per beneficiary type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {premiumResult.rows?.map((row: any, index: number) => (
                              <>
                                <tr key={index} className="border-b">
                                  <td className="p-2">{row.memberStatus}</td>
                                  <td className="p-2">
                                    {row.totalPremium != null
                                      ? `BWP ${row.totalPremium.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                      : "–"}
                                  </td>
                                  <td className="p-2">{row.numberOfBeneficiaries ?? "–"}</td>
                                  <td className="p-2 font-medium">
                                    {row.premiumPerBeneficiary != null
                                      ? `BWP ${row.premiumPerBeneficiary.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                      : "–"}
                                  </td>
                                </tr>
                                {row.memberStatus === "Premium Per Family" && (
                                  <tr>
                                    <td colSpan={4} className="text-xs text-muted-foreground italic px-2 pb-2">
                                      (Includes spouse and children)
                                    </td>
                                  </tr>
                                )}
                              </>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground text-sm">No quotation results available</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setShowQuoteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateQuote} disabled={isSavingQuote}>
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
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}

export default LifeFuneralQuotationForm
