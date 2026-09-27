import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Building2 } from "lucide-react"
import { PageLoader } from "@/components/PageLoader"
import { toast } from "sonner"
import { organisationsApi, type Organisation } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

const AVAILABLE_CALCULATORS = [
  { id: "annuity", label: "Annuity" },
  { id: "funeral", label: "Funeral" },
  { id: "life-assurance", label: "Life Assurance" },
  { id: "individual-life-cover", label: "Individual Life Cover" },
]

const generateCodeFromName = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ""
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase()
  }
  const firstWord = words[0]
  if (firstWord.length >= 2 && firstWord.length <= 4) {
    return firstWord.toUpperCase()
  }
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

const Organisations = () => {
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)

  const [newOrg, setNewOrg] = useState({
    name: "",
    code: "",
    codeManuallyEdited: false,
  })

  const [selectedCalculators, setSelectedCalculators] = useState<string[]>([
    "annuity",
  ])

  const fetchOrganisations = async () => {
    try {
      setLoading(true)
      const data = await organisationsApi.getAll()
      setOrganisations(data)
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch organisations")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganisations()
  }, [])

  const handleNameChange = (val: string) => {
    setNewOrg((prev) => {
      if (prev.codeManuallyEdited) {
        return { ...prev, name: val }
      }
      const generated = generateCodeFromName(val)
      return { name: val, code: generated, codeManuallyEdited: false }
    })
  }

  const handleCodeChange = (val: string) => {
    setNewOrg((prev) => ({
      ...prev,
      code: val.toUpperCase(),
      codeManuallyEdited: true,
    }))
  }

  const handleCalculatorChange = (calcId: string, checked: boolean) => {
    if (checked) {
      setSelectedCalculators((prev) => [...prev, calcId])
    } else {
      setSelectedCalculators((prev) => prev.filter((c) => c !== calcId))
    }
  }

  const getUniqueCode = (baseCode: string): string => {
    const existingCodes = organisations.map((org) => org.code.toUpperCase())
    if (!existingCodes.includes(baseCode.toUpperCase())) {
      return baseCode
    }
    let counter = 2
    while (existingCodes.includes(`${baseCode}${counter}`)) {
      counter++
    }
    return `${baseCode}${counter}`
  }

  const handleCreateOrg = async () => {
    const trimmedName = newOrg.name.trim()
    if (!trimmedName || !newOrg.code.trim()) {
      toast.error("Organisation name and code are required")
      return
    }

    if (selectedCalculators.length === 0) {
      toast.error("Select at least one calculator")
      return
    }

    setCreateLoading(true)
    try {
      const rootOrg = organisations.find((org) => org.isRootOrganisation)

      if (!rootOrg) {
        toast.error("Root organisation not found")
        return
      }

      const uniqueCode = getUniqueCode(newOrg.code.trim().toUpperCase())

      const responseData = await organisationsApi.create({
        name: trimmedName,
        code: uniqueCode,
        allowedCalculators: selectedCalculators,
        parentOrganisationId: rootOrg._id,
        isRootOrganisation: false,
      })

      const created = responseData.organisation || responseData

      setOrganisations((prev) => {
        const filtered = prev.filter((org) => !org._id.startsWith("temp_"))
        return [...filtered, created].sort((a, b) =>
          a.isRootOrganisation === b.isRootOrganisation ? 0 : a.isRootOrganisation ? -1 : 1
        )
      })
      fetchOrganisations()
      setShowCreateDialog(false)
      setNewOrg({ name: "", code: "", codeManuallyEdited: false })
      setSelectedCalculators(["annuity"])
      toast.success("Organisation created successfully")
    } catch (err: any) {
      toast.error(err.message || "Failed to create organisation")
    } finally {
      setCreateLoading(false)
    }
  }

  const resetCreateForm = () => {
    setShowCreateDialog(false)
    setNewOrg({ name: "", code: "", codeManuallyEdited: false })
    setSelectedCalculators(["annuity"])
  }

  const getStatusBadgeClass = (isActive: boolean) => {
    if (isActive) {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700"
    }
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700"
  }

  const getTypeBadgeClass = (isRoot: boolean) => {
    if (isRoot) {
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700"
    }
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700"
  }

  return (
    <div className="-mx-6 -mb-6">
      <div className="sticky top-0 z-30 bg-card px-6 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Organisations</h2>
          <p className="text-muted-foreground">Manage your organisations and their settings.</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Organisation
        </Button>
      </div>
      <div className="px-6 pb-6 space-y-6">
        {loading ? (
          <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0">
            <CardContent className="py-6">
              <PageLoader />
            </CardContent>
          </Card>
        ) : organisations.length === 0 ? (
          <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0">
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No organisations yet</h3>
              <p className="text-muted-foreground mb-4">Add your first organisation to get started.</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Organisation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-gray-50 dark:bg-slate-800 rounded-3xl p-6">
            <div className="overflow-x-auto">
              <Table className="border-separate border-spacing-y-3 w-full">
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="bg-gray-100 dark:bg-slate-700/50 border-0 rounded-full">
                    <TableHead className="font-normal text-gray-500 dark:text-gray-400 py-3 px-6 text-xs rounded-l-full">
                      Name
                    </TableHead>
                    <TableHead className="font-normal text-gray-500 dark:text-gray-400 py-3 px-6 text-xs">
                      Code
                    </TableHead>
                    <TableHead className="font-normal text-gray-500 dark:text-gray-400 py-3 px-6 text-xs">
                      Type
                    </TableHead>
                    <TableHead className="font-normal text-gray-500 dark:text-gray-400 py-3 px-6 text-xs">
                      Allowed Calculators
                    </TableHead>
                    <TableHead className="font-normal text-gray-500 dark:text-gray-400 py-3 px-6 text-xs rounded-r-full">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organisations.map((org) => (
                    <TableRow
                      key={org._id}
                      className="group bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all duration-200 my-2 overflow-hidden"
                    >
                      <TableCell className="py-5 px-6 rounded-l-xl group-hover:bg-sky-100 dark:group-hover:bg-sky-900/30 transition-colors duration-200">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{org.name}</span>
                      </TableCell>
                      <TableCell className="py-5 px-6 text-gray-700 dark:text-gray-300 font-normal group-hover:bg-sky-100 dark:group-hover:bg-sky-900/30 transition-colors duration-200">
                        {org.code}
                      </TableCell>
                      <TableCell className="py-5 px-6 group-hover:bg-sky-100 dark:group-hover:bg-sky-900/30 transition-colors duration-200">
                        <Badge
                          variant="outline"
                          className={`rounded-full px-2 py-1.5 text-xs font-medium border ${getTypeBadgeClass(org.isRootOrganisation)}`}
                        >
                          {org.isRootOrganisation ? "Root Organisation" : "External Organisation"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 px-6 text-gray-700 dark:text-gray-300 font-normal group-hover:bg-sky-100 dark:group-hover:bg-sky-900/30 transition-colors duration-200">
                        {Array.isArray((org as any).allowedCalculators) && (org as any).allowedCalculators.length > 0
                          ? (org as any).allowedCalculators.join(", ")
                          : "—"}
                      </TableCell>
                      <TableCell className="py-5 px-6 rounded-r-xl group-hover:bg-sky-100 dark:group-hover:bg-sky-900/30 transition-colors duration-200">
                        <Badge
                          variant="outline"
                          className={`rounded-full px-2 py-1.5 text-xs font-medium border ${getStatusBadgeClass(org.isActive !== false)}`}
                        >
                          {org.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-white dark:bg-slate-900 rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Organisation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Organisation Name</Label>
              <Input
                name="name"
                value={newOrg.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="mt-1"
                placeholder="Enter organisation name"
              />
            </div>
            <div>
              <Label>Code</Label>
              <Input
                name="code"
                value={newOrg.code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="mt-1"
                placeholder="Auto-generated from name"
              />
            </div>
            <div>
              <Label>Allowed Calculators</Label>
              <div className="mt-1 space-y-2">
                {AVAILABLE_CALCULATORS.map((calc) => (
                  <div key={calc.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={calc.id}
                      checked={selectedCalculators.includes(calc.id)}
                      onCheckedChange={(checked) =>
                        handleCalculatorChange(calc.id, !!checked)
                      }
                    />
                    <Label htmlFor={calc.id} className="text-sm font-medium">
                      {calc.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={resetCreateForm} disabled={createLoading}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrg} disabled={createLoading}>
                {createLoading ? "Creating..." : "Create Organisation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Organisations
