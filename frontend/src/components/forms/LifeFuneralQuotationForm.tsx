import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload } from "lucide-react"
import { toast } from "sonner"

const LifeFuneralQuotationForm = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    // Configuration Settings
    profitTarget: "2",
    societyName: "VBN",
    asAndWhenCommission: "20.00",
    schemeType: "Open",
    numberOfLivers: "19",
    maxExtendedFamilyMembers: "6.00",
    maxAgeChildren: "28.00",
    currentMaxAgeChild: "",
    coverLevelType: "scheme-rules",
    
    // Cover Levels
    principalMemberCover: "30000",
    spouseCover: "30000",
    refCover: "15000",
    children6to15Cover: "10000",
    children1to5Cover: "5000",
    children0to1Cover: "5000",
    extendedFamilyCover: "30000",
    parentsCover: "10000",
    
    // Client Specific Rating Factors
    rowLookup: "19",
    memberStatus: "Spouse",
    dateOfBirth: "02/05/76",
    age: "49.38",
    coverAmount: "30000",
    gender: "F",
    
    // Results (calculated)
    pvProfit: "10",
    pvPremium: "486",
    profitMargin: "2",
    premium: "54.01",
    commission: "10.80"
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      toast.success(`File ${file.name} uploaded successfully!`)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success("Life Funeral quotation calculated successfully!")
    console.log("Life Funeral Form Data:", formData)
    console.log("Uploaded File:", uploadedFile)
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Member Data Upload</CardTitle>
          <CardDescription>Upload CSV or Excel file with names and dates of birth</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <div className="space-y-2">
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
              <p className="text-sm text-muted-foreground">
                Upload member data with names and dates of birth
              </p>
              {uploadedFile && (
                <p className="text-sm text-green-600 font-medium">
                  ✓ {uploadedFile.name} uploaded
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Life Funeral Quotation Calculator</CardTitle>
          <CardDescription>
            Configure scheme parameters and calculate premiums for life and funeral insurance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Configuration Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Configuration Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profitTarget">Profit Target (%)</Label>
                  <Input
                    id="profitTarget"
                    type="number"
                    step="0.01"
                    value={formData.profitTarget}
                    onChange={(e) => handleInputChange("profitTarget", e.target.value)}
                    placeholder="2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="societyName">Society Name</Label>
                  <Input
                    id="societyName"
                    type="text"
                    value={formData.societyName}
                    onChange={(e) => handleInputChange("societyName", e.target.value)}
                    placeholder="VBN"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asAndWhenCommission">As-and-When Commission (%)</Label>
                  <Input
                    id="asAndWhenCommission"
                    type="number"
                    step="0.01"
                    value={formData.asAndWhenCommission}
                    onChange={(e) => handleInputChange("asAndWhenCommission", e.target.value)}
                    placeholder="20.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schemeType">Open scheme or closed</Label>
                  <Select value={formData.schemeType} onValueChange={(value) => handleInputChange("schemeType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scheme type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfLivers">Number of livers in Scheme</Label>
                  <Input
                    id="numberOfLivers"
                    type="number"
                    value={formData.numberOfLivers}
                    onChange={(e) => handleInputChange("numberOfLivers", e.target.value)}
                    placeholder="19"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxExtendedFamilyMembers">Max extended family members</Label>
                  <Input
                    id="maxExtendedFamilyMembers"
                    type="number"
                    step="0.01"
                    value={formData.maxExtendedFamilyMembers}
                    onChange={(e) => handleInputChange("maxExtendedFamilyMembers", e.target.value)}
                    placeholder="6.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAgeChildren">Maximum age of children covered</Label>
                  <Input
                    id="maxAgeChildren"
                    type="number"
                    step="0.01"
                    value={formData.maxAgeChildren}
                    onChange={(e) => handleInputChange("maxAgeChildren", e.target.value)}
                    placeholder="28.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentMaxAgeChild">Current Max age of Child in data</Label>
                  <Input
                    id="currentMaxAgeChild"
                    type="number"
                    value={formData.currentMaxAgeChild}
                    onChange={(e) => handleInputChange("currentMaxAgeChild", e.target.value)}
                    placeholder="Enter current max age"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverLevelType">Cover Level Type</Label>
                  <Select value={formData.coverLevelType} onValueChange={(value) => handleInputChange("coverLevelType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cover type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheme-rules">Scheme rules benefits</SelectItem>
                      <SelectItem value="member-specified">Member specified amounts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Cover Levels */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Cover Levels</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="principalMemberCover">Principal Member Cover (R)</Label>
                  <Input
                    id="principalMemberCover"
                    type="number"
                    value={formData.principalMemberCover}
                    onChange={(e) => handleInputChange("principalMemberCover", e.target.value)}
                    placeholder="30,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spouseCover">Spouse Cover (R)</Label>
                  <Input
                    id="spouseCover"
                    type="number"
                    value={formData.spouseCover}
                    onChange={(e) => handleInputChange("spouseCover", e.target.value)}
                    placeholder="30,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="refCover">REF Cover (R)</Label>
                  <Input
                    id="refCover"
                    type="number"
                    value={formData.refCover}
                    onChange={(e) => handleInputChange("refCover", e.target.value)}
                    placeholder="15,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="children6to15Cover">Children 6-15 years (R)</Label>
                  <Input
                    id="children6to15Cover"
                    type="number"
                    value={formData.children6to15Cover}
                    onChange={(e) => handleInputChange("children6to15Cover", e.target.value)}
                    placeholder="10,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="children1to5Cover">Children 1-5 years (R)</Label>
                  <Input
                    id="children1to5Cover"
                    type="number"
                    value={formData.children1to5Cover}
                    onChange={(e) => handleInputChange("children1to5Cover", e.target.value)}
                    placeholder="5,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="children0to1Cover">Children 0-1 years (R)</Label>
                  <Input
                    id="children0to1Cover"
                    type="number"
                    value={formData.children0to1Cover}
                    onChange={(e) => handleInputChange("children0to1Cover", e.target.value)}
                    placeholder="5,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extendedFamilyCover">Extended Family Cover (R)</Label>
                  <Input
                    id="extendedFamilyCover"
                    type="number"
                    value={formData.extendedFamilyCover}
                    onChange={(e) => handleInputChange("extendedFamilyCover", e.target.value)}
                    placeholder="30,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentsCover">Parents Cover (R)</Label>
                  <Input
                    id="parentsCover"
                    type="number"
                    value={formData.parentsCover}
                    onChange={(e) => handleInputChange("parentsCover", e.target.value)}
                    placeholder="10,000"
                  />
                </div>
              </div>
            </div>

            {/* Client Specific Rating Factors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Client Specific Rating Factors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rowLookup">Row Lookup</Label>
                  <Input
                    id="rowLookup"
                    type="number"
                    value={formData.rowLookup}
                    onChange={(e) => handleInputChange("rowLookup", e.target.value)}
                    placeholder="19"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberStatus">Member Status</Label>
                  <Select value={formData.memberStatus} onValueChange={(value) => handleInputChange("memberStatus", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Principal">Principal</SelectItem>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Child">Child</SelectItem>
                      <SelectItem value="Extended Family">Extended Family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    step="0.01"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    placeholder="49.38"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverAmount">Cover Amount (R)</Label>
                  <Input
                    id="coverAmount"
                    type="number"
                    value={formData.coverAmount}
                    onChange={(e) => handleInputChange("coverAmount", e.target.value)}
                    placeholder="30,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">Calculation Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pvProfit">PV of Profit</Label>
                  <Input
                    id="pvProfit"
                    type="number"
                    value={formData.pvProfit}
                    onChange={(e) => handleInputChange("pvProfit", e.target.value)}
                    placeholder="10"
                    className="bg-muted"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pvPremium">PV of Premium</Label>
                  <Input
                    id="pvPremium"
                    type="number"
                    value={formData.pvPremium}
                    onChange={(e) => handleInputChange("pvPremium", e.target.value)}
                    placeholder="486"
                    className="bg-muted"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profitMargin">Profit Margin (%)</Label>
                  <Input
                    id="profitMargin"
                    type="number"
                    value={formData.profitMargin}
                    onChange={(e) => handleInputChange("profitMargin", e.target.value)}
                    placeholder="2"
                    className="bg-muted"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="premium">Premium (R)</Label>
                  <Input
                    id="premium"
                    type="number"
                    step="0.01"
                    value={formData.premium}
                    onChange={(e) => handleInputChange("premium", e.target.value)}
                    placeholder="54.01"
                    className="bg-muted font-bold"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission">Commission (R)</Label>
                  <Input
                    id="commission"
                    type="number"
                    step="0.01"
                    value={formData.commission}
                    onChange={(e) => handleInputChange("commission", e.target.value)}
                    placeholder="10.80"
                    className="bg-muted"
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" className="flex-1">
                Calculate Life Funeral Quote
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => toast.success("Pricing run initiated!")}>
                Run Pricing
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default LifeFuneralQuotationForm