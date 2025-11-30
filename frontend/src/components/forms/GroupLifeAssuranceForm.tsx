import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Upload, Plus, Trash2, HelpCircle, Loader2 } from "lucide-react"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"


const GroupLifeAssuranceForm = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [summary, setSummary] = useState({
    membership: 0,
    totalSalary: 0,
    averageSalary: 0,
    minSalary: 0,
    maxSalary: 0,
    averageAge: 0,
    minAge: 0,
    maxAge: 0,
    percentMale: 0,
  })
  const [result, setResult] = useState<any | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showQuoteDialog, setShowQuoteDialog] = useState(false)

  // New inputs
  const [maxDeathBenefit, setMaxDeathBenefit] = useState<string>("")
  const [maxODB, setMaxODB] = useState<string>("")
  const [salaryMultiplier, setSalaryMultiplier] = useState<number>(4)

  const [customerDetails, setCustomerDetails] = useState({
    schemeName: "",
    registrationNumber: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
  })


  const handleAddRow = () => {
    setMembers((prev) => [...prev, { member: "", gender: "", dob: "", annualSalary: "" }])
  }

  const handleRemoveRow = (index: number) => {
    setMembers((prev) => prev.filter((_, i) => i !== index))
  }

  const handleInputChange = (index: number, field: string, value: string) => {
    const updated = [...members]
    updated[index][field] = value
    setMembers(updated)
  }

  const parseFile = (file: File) => {
    const fileExt = file.name.split(".").pop()?.toLowerCase()
    setUploadedFile(file)

    const parseData = (data: any[]) => {
      const clean = data.filter((row) => Object.values(row).some(Boolean))
      const mapped = clean.map((r) => ({
        member: r["Member"] || "",
        gender: r["Gender"] || "",
        dob: r["DOB"] || "",
        annualSalary: r["Annual Salary"] || "",
      }))
      setMembers(mapped)
      toast.success(`${mapped.length} member records loaded`)
    }

    if (fileExt === "csv") {
      Papa.parse(file, {
        header: true,
        complete: (results) => parseData(results.data),
        error: (err) => toast.error(`CSV error: ${err.message}`),
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
      toast.error("Unsupported file format")
    }
  }

  const calculateAge = (dob: string) => {
    if (!dob) return 0
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  useEffect(() => {
    if (members.length === 0) {
      setSummary({
        membership: 0,
        totalSalary: 0,
        averageSalary: 0,
        minSalary: 0,
        maxSalary: 0,
        averageAge: 0,
        minAge: 0,
        maxAge: 0,
        percentMale: 0,
      })
      return
    }

    const validSalaries = members.map((m) => parseFloat(String(m.annualSalary).replace(/[^0-9.]/g, "")) || 0)
    const ages = members.map((m) => calculateAge(m.dob))
    const genders = members.map((m) => m.gender?.toUpperCase())

    const membership = members.length
    const totalSalary = validSalaries.reduce((a, b) => a + b, 0)
    const averageSalary = membership ? totalSalary / membership : 0
    const minSalary = validSalaries.length ? Math.min(...validSalaries) : 0
    const maxSalary = validSalaries.length ? Math.max(...validSalaries) : 0
    const averageAge = ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : 0
    const minAge = ages.length ? Math.min(...ages) : 0
    const maxAge = ages.length ? Math.max(...ages) : 0
    const percentMale = membership ? (genders.filter((g) => g === "M").length / membership) * 100 : 0

    setSummary({
      membership,
      totalSalary,
      averageSalary,
      minSalary,
      maxSalary,
      averageAge,
      minAge,
      maxAge,
      percentMale,
    })
  }, [members])

  const handleCalculate = async () => {
    try {
      setIsCalculating(true)
      setResult(null)

      const token = localStorage.getItem("token")

      const res = await fetch("https://njs.exclusivelife.co.bw/api/quotes/calculate-assurance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ members }),
      })

      const data = await res.json()
      console.log("🔥 RAW RESPONSE FROM BACKEND:", data)

      if (!res.ok) throw new Error(data.error || `Status ${res.status}`)

      // some backends return { output: {...} }, others return {...}
      const output = data.result || data.output || data
      setResult(output)
      setShowQuoteDialog(true)

      toast.success("Life Assurance quotation calculated")
    } catch (err: any) {
      console.error("Calculation error:", err)
      toast.error(`Calculation failed: ${err.message}`)
    } finally {
      setIsCalculating(false)
    }
  }
  const formatMoney = (v: number | null | undefined) =>
    v == null
      ? "-"
      : v.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })

  const formatPercentFromFraction = (v: number | null | undefined) =>
    v == null ? "-" : `${(v * 100).toFixed(3)}%`


  const handleCreateQuote = async () => {
    // Basic validation – you can tweak which fields are “required”
    const requiredFields: (keyof typeof customerDetails)[] = [
      "schemeName",
      "registrationNumber",
      "contactEmail",
    ];

    const missing = requiredFields.filter((field) => !customerDetails[field]);
    if (missing.length > 0) {
      toast.error(
        `Please fill in: ${missing
          .map((f) =>
            f === "schemeName"
              ? "Scheme / Corporate Name"
              : f === "registrationNumber"
                ? "Registration Number"
                : f === "contactEmail"
                  ? "Contact Email"
                  : f
          )
          .join(", ")}`
      );
      return;
    }

    if (!result) {
      toast.error("No calculation results available to save as a quote.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch("https://njs.exclusivelife.co.bw/api/new-quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          productType: "Exclusive Life Assurance",         
          client: {
            schemeName: customerDetails.schemeName,
            registrationNumber: customerDetails.registrationNumber,
            contactPerson: customerDetails.contactPerson,
            contactEmail: customerDetails.contactEmail,
            contactPhone: customerDetails.contactPhone,
          },
          // you can tweak what you consider "inputs"
          inputs: {
            members,
            summary,                    // the frontend summary you already compute
          },
          // outputs = full result coming back from Python calc
          outputs: result,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to save quote");
      }

      const data = await res.json();
      toast.success(`Quote ${data.quoteId} saved successfully!`);
      setShowQuoteDialog(false);
    } catch (err: any) {
      console.error("Save quote error:", err);
      toast.error(err.message || "Failed to save quote");
    }
  };

  return (
    <TooltipProvider>
      <div className="w-full max-w-6xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Upload or Enter Member Data</CardTitle>
                <CardDescription>
                  Upload your member CSV/Excel file or add rows manually
                </CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <HelpCircle className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-lg p-3 text-sm">
                  CSV/Excel should include columns: <br />
                  <b>Member, Gender, DOB, Annual Salary</b>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>

          <CardContent>
            {/* Upload zone */}
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center mb-6">
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <Label htmlFor="file-upload" className="cursor-pointer text-primary hover:text-primary/80">
                Click to upload CSV or Excel file
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) parseFile(file)
                }}
                className="hidden"
              />
              {uploadedFile && (
                <p className="text-sm text-green-600 font-medium mt-2">✓ {uploadedFile.name} uploaded</p>
              )}
            </div>

            {/* Member Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Member</th>
                    <th className="p-2 text-left">Gender</th>
                    <th className="p-2 text-left">DOB</th>
                    <th className="p-2 text-left">Annual Salary</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((row, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">
                        <Input
                          value={row.member}
                          onChange={(e) => handleInputChange(index, "member", e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          value={row.gender}
                          onChange={(e) => handleInputChange(index, "gender", e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="date"
                          value={row.dob}
                          onChange={(e) => handleInputChange(index, "dob", e.target.value)}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={row.annualSalary}
                          onChange={(e) => handleInputChange(index, "annualSalary", e.target.value)}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRow(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button variant="secondary" onClick={() => setMembers([])}>Clear Table</Button>
              <Button onClick={handleAddRow}>
                <Plus className="h-4 w-4 mr-2" /> Add Row
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Benefit Inputs Card */}
        <Card>
          <CardHeader>
            <CardTitle>Benefit Configuration</CardTitle>
            <CardDescription>
              Set maximum benefits and salary multiplier for the calculation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="maxDeathBenefit">Maximum Death Benefit</Label>
                <Input
                  id="maxDeathBenefit"
                  type="number"
                  placeholder="e.g. 500000"
                  value={maxDeathBenefit}
                  onChange={(e) => setMaxDeathBenefit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxODB">Maximum ODB</Label>
                <Input
                  id="maxODB"
                  type="number"
                  placeholder="e.g. 250000"
                  value={maxODB}
                  onChange={(e) => setMaxODB(e.target.value)}
                />
              </div>
            </div>

            {/* Salary Multiplier Selection */}
            <div className="space-y-2">
              <Label>Salary Multiplier</Label>
              <div className="flex gap-2">
                {[4, 3, 2].map((multiplier) => (
                  <Button
                    key={multiplier}
                    type="button"
                    variant={salaryMultiplier === multiplier ? "default" : "outline"}
                    className={salaryMultiplier === multiplier 
                      ? "bg-yellow-400 hover:bg-yellow-500 text-black font-semibold" 
                      : ""}
                    onClick={() => setSalaryMultiplier(multiplier)}
                  >
                    {multiplier} X Annual Salary
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleCalculate} disabled={members.length === 0 || isCalculating}>
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating...
              </>
            ) : (
              "Calculate"
            )}
          </Button>
        </div>
        <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Customer GLA Quotation</DialogTitle>
              <DialogDescription>
                Enter customer details and review calculation results
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
                    <Label>Scheme / Corporate Name</Label>
                    <Input
                      value={customerDetails.schemeName}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, schemeName: e.target.value }))}
                      placeholder="e.g. Exclusive Life Holdings"
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
                    <Label>Contact Person</Label>
                    <Input
                      value={customerDetails.contactPerson}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contact Number</Label>
                    <Input
                      value={customerDetails.contactPhone}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, contactPhone: e.target.value }))}
                      placeholder="e.g. +267 395 0000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      value={customerDetails.contactEmail}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, contactEmail: e.target.value }))}
                      placeholder="e.g. contact@exclusivelife.co.bw"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Calculation Results Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Calculation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 w-[50%]">Metric</th>
                            <th className="text-left p-3">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-muted-foreground/10">
                          {[
                            ["Maximum Death Benefit", maxDeathBenefit ? `BWP ${formatMoney(parseFloat(maxDeathBenefit))}` : "-"],
                            ["Maximum ODB", maxODB ? `BWP ${formatMoney(parseFloat(maxODB))}` : "-"],
                            ["Salary Multiplier", `${salaryMultiplier} X Annual Salary`],
                            ["Membership", result.membership],
                            ["Total Salary (BWP)", `BWP ${formatMoney(result.totalSalary)}`],
                            ["Average Salary (BWP)", `BWP ${formatMoney(result.averageSalary)}`],
                            ["Average Age", result.averageAge],
                            ["Min Age", result.minAge],
                            ["Max Age", result.maxAge],
                            ["% Male", result.percentMale != null ? `${result.percentMale}%` : "-"],
                            ["FCL", `BWP ${formatMoney(result.fcl)}`],
                            ["Total Expected Claims Cost", `BWP ${formatMoney(result.totalExpectedClaimsCost)}`],
                            ["Net Premium", `BWP ${formatMoney(result.netPremium)}`],
                            ["Commission", `BWP ${formatMoney(result.commission)}`],
                            ["Gross Premium", `BWP ${formatMoney(result.grossPremium)}`],
                            ["Total Annual Salary", `BWP ${formatMoney(result.totalAnnualSalary)}`],
                            ["Gross Rate GLA", formatPercentFromFraction(result.grossRateGLA)],
                            ["Gross Rate PHI", formatPercentFromFraction(result.grossRatePHI)],
                            ["Death", `BWP ${formatMoney(result.deathPremium)}`],
                            ["OBD", `BWP ${formatMoney(result.ODB)}`],
                            ["Total Premium", `BWP ${formatMoney(result.totalPremiums)}`],
                          ].map(([label, value]) => (
                            <tr key={label as string} className="hover:bg-muted/40">
                              <td className="p-3 text-muted-foreground">{label}</td>
                              <td className="p-3 font-medium">{value ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">No calculation results available</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <div className="flex justify-between mt-6">
              <Button variant="secondary" onClick={() => setShowQuoteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateQuote}>
                Generate Quote
              </Button>

            </div>
          </DialogContent>
        </Dialog>

      </div>
    </TooltipProvider>
  )
}

export default GroupLifeAssuranceForm
