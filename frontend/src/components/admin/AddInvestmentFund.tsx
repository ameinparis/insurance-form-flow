import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { toast } from "sonner"

interface AddInvestmentFundProps {
  managerId: string
  managerName: string
  onAdd?: (managerId: string, fund: { name: string; type: string; code?: string; status: string }) => void
}

const FUND_TYPES = [
  "Money Market",
  "Balanced / Multi-asset",
  "Equity",
  "Fixed Income / Bond",
  "Other",
] as const

export const AddInvestmentFund = ({ managerId, managerName, onAdd }: AddInvestmentFundProps) => {
  const [open, setOpen] = useState(false)
  const [fundName, setFundName] = useState("")
  const [fundType, setFundType] = useState<typeof FUND_TYPES[number]>("Money Market")
  const [fundCode, setFundCode] = useState("")
  const [status, setStatus] = useState("Active")

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fundName.trim()) {
      toast.error("Fund name is required")
      return
    }
    onAdd?.(managerId, {
      name: fundName.trim(),
      type: fundType,
      code: fundCode.trim(),
      status,
    })
    setFundName("")
    setFundType("Money Market")
    setFundCode("")
    setStatus("Active")
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="text-xs px-3 py-1.5"
      >
        <Plus className="h-3 w-3 mr-1.5" />
        Add Fund
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-2xl border bg-background p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle>Add Investment Fund</DialogTitle>
            <DialogDescription>
              Add a new fund under <strong>{managerName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Asset Manager</Label>
              <Input
                disabled
                value={managerName}
                className="bg-muted/50 dark:bg-slate-800/50 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label>Fund Name</Label>
              <Input
                id="fund-name"
                placeholder="e.g. Balanced Fund"
                value={fundName}
                onChange={(e) => setFundName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Fund Type</Label>
              <Select
                value={fundType}
                onValueChange={(v) => setFundType(v as typeof FUND_TYPES[number])}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select fund type" />
                </SelectTrigger>
                <SelectContent>
                  {FUND_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fund Code</Label>
              <Input
                id="fund-code"
                placeholder="e.g. BMF-001"
                value={fundCode}
                onChange={(e) => setFundCode(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional code used to identify this fund in reports.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="Active"
                    checked={status === "Active"}
                    onChange={() => setStatus("Active")}
                    className="rounded bg-[#009fe3] border-[#009fe3] text-[#009fe3] focus:ring-[#009fe3] dark:bg-[#009fe3] dark:text-white"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value="Inactive"
                    checked={status === "Inactive"}
                    onChange={() => setStatus("Inactive")}
                    className="rounded border-input bg-background dark:bg-slate-800 focus:ring-ring focus:ring-offset-background dark:focus:ring-offset-slate-900"
                  />
                  Inactive
                </label>
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Add Fund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AddInvestmentFund
