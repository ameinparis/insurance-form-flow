import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { useInvestmentManagers } from "@/hooks/useInvestmentManagers"

export const InvestmentManagers = () => {
  const { managers, addManager, updateManager, removeManager } = useInvestmentManagers()
  const [newName, setNewName] = useState("")
  const [fundDrafts, setFundDrafts] = useState<Record<string, string>>({})

  const handleAdd = () => {
    if (!newName.trim()) {
      toast.error("Manager name is required")
      return
    }
    addManager(newName.trim())
    setNewName("")
    toast.success("Investment manager added")
  }

  const addFund = (id: string, funds: string[]) => {
    const value = (fundDrafts[id] || "").trim()
    if (!value) return
    if (funds.includes(value)) {
      toast.error("That fund already exists")
      return
    }
    updateManager(id, { funds: [...funds, value] })
    setFundDrafts((prev) => ({ ...prev, [id]: "" }))
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0">
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Investment / Asset Managers</h3>
            <p className="text-sm text-muted-foreground">
              Funds captured here appear in the Investment Portfolio step of the Convert to Policy wizard.
            </p>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label>Manager name</Label>
              <Input
                className="mt-1"
                value={newName}
                placeholder="e.g. Botswana Asset Management"
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add manager
            </Button>
          </div>
        </CardContent>
      </Card>

      {managers.map((manager) => (
        <Card key={manager.id} className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <Input
                  value={manager.name}
                  onChange={(e) => updateManager(manager.id, { name: e.target.value })}
                  className="max-w-md font-semibold"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {manager.funds.length} fund{manager.funds.length === 1 ? "" : "s"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                title="Remove manager"
                onClick={() => {
                  removeManager(manager.id)
                  toast.success("Investment manager removed")
                }}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {manager.funds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No funds captured yet</p>
              ) : (
                manager.funds.map((fund) => (
                  <Badge
                    key={fund}
                    variant="outline"
                    className="rounded-full px-3 py-1.5 text-xs font-medium border-gray-300 dark:border-gray-700 flex items-center gap-2"
                  >
                    {fund}
                    <button
                      type="button"
                      aria-label={`Remove ${fund}`}
                      onClick={() =>
                        updateManager(manager.id, { funds: manager.funds.filter((f) => f !== fund) })
                      }
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                    </button>
                  </Badge>
                ))
              )}
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label>Add fund</Label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Balanced Fund"
                  value={fundDrafts[manager.id] || ""}
                  onChange={(e) => setFundDrafts((prev) => ({ ...prev, [manager.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addFund(manager.id, manager.funds)}
                />
              </div>
              <Button variant="outline" onClick={() => addFund(manager.id, manager.funds)}>
                <Plus className="h-4 w-4 mr-2" />
                Add fund
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default InvestmentManagers
