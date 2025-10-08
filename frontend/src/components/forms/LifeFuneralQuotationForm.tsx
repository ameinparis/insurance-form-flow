import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Info } from "lucide-react"
import { toast } from "sonner"
import Papa from "papaparse"
import * as XLSX from "xlsx"

const LifeFuneralQuotationForm = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

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

  const payload = new FormData()
  payload.append("file", uploadedFile)

  // Append form fields
  Object.entries(formData).forEach(([key, value]) => {
    payload.append(key, value)
  })

  try {
    const res = await fetch("http://localhost:5002/api/quotes/funeral", {
      method: "POST",
      body: payload
    })

    if (!res.ok) throw new Error(`Status ${res.status}`)

    const result = await res.json()
    toast.success("Quotation calculated")

    console.log("Premium result:", result)
    // You can later display result here (we’ll do that after backend works)

  } catch (err: any) {
    console.error("Quote error", err)
    toast.error(`Failed to calculate: ${err.message}`)
  }
}


  const isSchemeRules = formData.coverLevelType === "scheme-rules"

  const schemeTooltip = `An open scheme allows new members and is reviewed yearly. A closed scheme maintains the same premium unless members change rules.`
  const coverLevelTooltip = `"Scheme rules" apply fixed benefit levels to all members. "Member specified" means each member has custom cover defined in the uploaded data.`

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Member Data</CardTitle>
          <CardDescription>Upload your member CSV or Excel file</CardDescription>
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
                readOnly
                className="bg-muted"
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
                    value={formData.principalMemberCover}
                    readOnly
                    className="bg-muted"
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
                    value={formData.principalMemberCover}
                    readOnly
                    className="bg-muted"
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

    </div>
  )
}

export default LifeFuneralQuotationForm
