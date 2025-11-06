import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Upload, Plus, Trash2, HelpCircle } from "lucide-react"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { toast } from "sonner"

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
    percentMale: 0
  })

  const handleAddRow = () => {
    setMembers((prev) => [
      ...prev,
      { member: "", gender: "", dob: "", annualSalary: "" },
    ])
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
    const percentMale = membership
      ? (genders.filter((g) => g === "M").length / membership) * 100
      : 0

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

  return (
    <TooltipProvider>
      <div className="w-full max-w-6xl mx-auto space-y-8">
        {/* Upload Section */}
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

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Summary Statistics</CardTitle>
            <CardDescription>Automatically calculated from member data</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries({
              Membership: summary.membership,
              "Total Salary": summary.totalSalary.toLocaleString(undefined, { maximumFractionDigits: 2 }),
              "Average Salary": summary.averageSalary.toFixed(2),
              "Min Salary": summary.minSalary.toFixed(2),
              "Max Salary": summary.maxSalary.toFixed(2),
              "Average Age": summary.averageAge.toFixed(1),
              "Min Age": summary.minAge.toFixed(0),
              "Max Age": summary.maxAge.toFixed(0),
              "% Male": `${summary.percentMale.toFixed(1)}%`,
            }).map(([label, val]) => (
              <div key={label} className="p-3 rounded-lg border bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-semibold text-lg">{val}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Calculate Button */}
        <div className="flex justify-end">
          <Button disabled={members.length === 0}>Calculate GLA Quote</Button>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default GroupLifeAssuranceForm
