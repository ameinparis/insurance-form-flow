import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
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
import { AutocompleteInput, AutocompleteSuggestion } from "@/components/ui/autocomplete-input"
import { useClientSuggestions } from "@/hooks/useClientSuggestions"

const GeneratingOverlay = () => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
    <h2 className="text-xl font-semibold text-foreground">Generating Quote...</h2>
    <p className="text-muted-foreground mt-2">Please wait while we prepare your quote</p>
  </div>
)


// --- Date helpers for CSV/XLSX DOB handling ---

const normaliseMoney = (v: any): string => {
  if (v == null || v === "") return ""
  // keep digits + dot only (removes commas/spaces/currency)
  const cleaned = String(v).trim().replace(/[^0-9.]/g, "")
  return cleaned
}

// Convert Excel serial (e.g. 32876) to "YYYY-MM-DD"
const excelSerialToISODate = (serial: number): string => {
  if (serial == null || Number.isNaN(serial)) return ""
  const base = new Date(1899, 11, 30) // 1899-12-30 (Excel's 1900 bug offset)
  const ms = serial * 24 * 60 * 60 * 1000
  const d = new Date(base.getTime() + ms)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10) // "YYYY-MM-DD"
}

const normaliseDob = (value: any): string => {
  if (value == null || value === "") return ""

  // If xlsx gives us a JS Date object
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  // If xlsx gives us an Excel serial number
  if (typeof value === "number") {
    return excelSerialToISODate(value)
  }

  // Strings
  if (typeof value === "string") {
    const s = value.trim()
    if (!s) return ""

    // Already ISO "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

    // dd/mm/yyyy or dd-mm-yyyy or dd/mm/yy
    const m1 = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2}|\d{4})$/)
    if (m1) {
      let [, d, m, y] = m1
      if (y.length === 2) {
        const yy = parseInt(y, 10)
        // You can tweak this boundary. This says 30–99 → 19xx, else 20xx.
        y = (yy >= 30 ? 1900 + yy : 2000 + yy).toString()
      }
      const day = String(d).padStart(2, "0")
      const month = String(m).padStart(2, "0")
      return `${y}-${month}-${day}`
    }

    // yyyy/mm/dd or yyyy-mm-dd
    const m2 = s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/)
    if (m2) {
      const [, y, m, d] = m2
      const day = String(d).padStart(2, "0")
      const month = String(m).padStart(2, "0")
      return `${y}-${month}-${day}`
    }

    // Last resort: let JS parse and normalise
    const d = new Date(s)
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10)
    }

    return ""
  }

  // Anything weird → blank
  return ""
}

const GroupLifeAssuranceForm = () => {
  const navigate = useNavigate()
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
  const [isSavingQuote, setIsSavingQuote] = useState(false)

  // New inputs
  const [maxDeathBenefit, setMaxDeathBenefit] = useState<string>("")
  const [maxODB, setMaxODB] = useState<string>("")
  const [salaryMultiplier, setSalaryMultiplier] = useState<number>(4)

  const { searchClients, loading: clientsLoading } = useClientSuggestions()

  const [customerDetails, setCustomerDetails] = useState({
    schemeName: "",
    registrationNumber: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
  })

  // Generate suggestions based on scheme name input
  const schemeSuggestions = useMemo((): AutocompleteSuggestion[] => {
    return searchClients(customerDetails.schemeName, "corporate").map((client) => ({
      label: client.schemeName || client.companyName || "",
      subtitle: client.registrationNumber || "",
      data: client
    }))
  }, [customerDetails.schemeName, searchClients])

  const handleSchemeSelect = (suggestion: AutocompleteSuggestion) => {
    const client = suggestion.data
    setCustomerDetails({
      schemeName: client.schemeName || client.companyName || "",
      registrationNumber: client.registrationNumber || "",
      contactPerson: client.contactPerson || "",
      contactEmail: client.contactEmail || client.companyEmail || "",
      contactPhone: client.contactPhone || client.companyContact || ""
    })
  }


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

      const mapped = clean.map((r) => {
        const rawDob =
          r["DOB"] ??
          r["Dob"] ??
          r["dob"] ??
          r["Date of Birth"] ??
          r["Date of birth"] ??
          r["date of birth"] ??
          r["DoB"]

        const rawSalary =
          r["Annual Salary"] ??
          r["AnnualSalary"] ??
          r["annualSalary"] ??
          r["annual salary"] ??
          ""

        return {
          member: r["Member"] || "",
          gender: r["Gender"] || "",
          dob: normaliseDob(rawDob),
          annualSalary: normaliseMoney(rawSalary),
        }
      })

      setMembers(mapped)
      console.log("Mapped members (first 5):", mapped.slice(0, 5))
      toast.success(`${mapped.length} member records loaded`)

      // ✅ DOB missing warning (must be here)
      const missingDob = mapped.filter((m) => !m.dob).length
      if (missingDob > 0) {
        toast.error(
          `${missingDob} DOB value(s) could not be read. Please ensure the DOB column is formatted as a Date (dd/mm/yyyy).`
        )
      }
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
        if (!data) {
          toast.error("Could not read file data")
          return
        }

        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: true, // try to give us Date objects
        })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
          raw: true,
        })
        parseData(json)
      }
      reader.readAsArrayBuffer(file)
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

      const res = await fetch("http://localhost:5002/api/quotes/calculate-assurance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          members,
          salaryMultiplier,                                  // 2 / 3 / 4
          maxDeathBenefit: maxDeathBenefit || null,         // optional
          maxODB: maxODB || null,                           // optional
        }),

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
      setIsSavingQuote(true);
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:5002/api/new-quotes", {
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
          inputs: {
            members,
            summary,
            salaryMultiplier,
            maxDeathBenefit: maxDeathBenefit
              ? Number(maxDeathBenefit)
              : null,
            maxODB: maxODB
              ? Number(maxODB)
              : null,
          },
          outputs: result,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || "Failed to save quote");
      }

      const data = await res.json();

      toast.success(`Quote ${data.quoteId} saved successfully! Redirecting...`);
      setShowQuoteDialog(false);
      setTimeout(() => navigate(`/quotes/${data._id}`), 1500);
    } catch (err: any) {
      console.error("Save quote error:", err);
      toast.error(err.message || "Failed to save quote");
    } finally {
      setIsSavingQuote(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="w-full space-y-8">
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
                <TooltipContent side="left" className="max-w-2xl p-4">
                  <div className="space-y-2">
                    <p className="font-semibold text-sm mb-2">
                      Required File Structure (CSV or Excel):
                    </p>

                    <p className="text-xs text-muted-foreground mb-3">
                      <span className="font-semibold text-foreground">Headers must match exactly.</span>{" "}
                      DOB can be <b>DOB</b> or <b>Date of Birth</b>. Gender must be <b>M</b> or <b>F</b>.
                    </p>

                    <div className="rounded-md border border-muted-foreground/20 bg-muted/30 p-2 text-xs">
                      <span className="font-semibold text-foreground">Tip:</span>{" "}
                      In Excel, format the DOB column as <span className="font-semibold">Date</span> (not Text).
                      If DOB is not a real date, it may import blank.
                    </div>

                    <div className="overflow-x-auto">
                      <table className="text-xs border-collapse w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="px-2 py-1 text-left font-semibold">Member</th>
                            <th className="px-2 py-1 text-left font-semibold">Gender</th>
                            <th className="px-2 py-1 text-left font-semibold">DOB</th>
                            <th className="px-2 py-1 text-left font-semibold">Annual Salary</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="px-2 py-1">1112</td>
                            <td className="px-2 py-1">F</td>
                            <td className="px-2 py-1">27/02/92</td>
                            <td className="px-2 py-1">240,000.00</td>
                          </tr>
                          <tr className="border-b">
                            <td className="px-2 py-1">227</td>
                            <td className="px-2 py-1">M</td>
                            <td className="px-2 py-1">08/06/88</td>
                            <td className="px-2 py-1">68,000.00</td>
                          </tr>
                          <tr>
                            <td className="px-2 py-1">167</td>
                            <td className="px-2 py-1">M</td>
                            <td className="px-2 py-1">09/06/89</td>
                            <td className="px-2 py-1">68,000.00</td>
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
            <CardTitle>Policy Specifications</CardTitle>
            <CardDescription>
              Set maximum benefits and salary multiplier for the client
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
                      ? "bg-[#5bb5e0] hover:bg-[#4aa8d4] text-black font-semibold"
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
                    <AutocompleteInput
                      value={customerDetails.schemeName}
                      onChange={(e) => setCustomerDetails((prev) => ({ ...prev, schemeName: e.target.value }))}
                      placeholder="e.g. Exclusive Life Holdings"
                      suggestions={schemeSuggestions}
                      onSelect={handleSchemeSelect}
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

export default GroupLifeAssuranceForm


