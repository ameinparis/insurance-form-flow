import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Layers, Trash2, Pencil, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnnuityScenario } from "@/hooks/useAnnuityScenarios"

const fmt = (n?: number) =>
  typeof n === "number" && isFinite(n)
    ? `BWP ${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : "—"

type Props = {
  scenarios: AnnuityScenario[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  onClearSelected: () => void
  onRemove: (id: string) => void
  onRename: (id: string, label: string) => void
  onGenerate: () => void
  open: boolean
  onOpenChange: (o: boolean) => void
}

const AnnuityScenarioDrawer = ({
  scenarios,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearSelected,
  onRemove,
  onRename,
  onGenerate,
  open,
  onOpenChange,
}: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState("")
  const selectedCount = selectedIds.length
  const allSelected = scenarios.length > 0 && selectedCount === scenarios.length

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#009fe3]" />
            Scenarios ({scenarios.length})
          </SheetTitle>
        </SheetHeader>

        {scenarios.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 text-muted-foreground">
            <div className="rounded-full bg-[#009fe3]/10 p-4 mb-4">
              <Layers className="h-8 w-8 text-[#009fe3]" />
            </div>
            <p className="text-sm">
              No scenarios yet. Calculate a living annuity and click <strong>Add as Scenario</strong> to build a comparison.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between py-3 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={allSelected ? onClearSelected : onSelectAll}
                className="text-xs"
              >
                {allSelected ? "Clear all" : "Select all"}
              </Button>
              <span className="text-xs text-muted-foreground">{selectedCount} selected</span>
            </div>

            <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 space-y-3">
              {scenarios.map((s) => {
                const checked = selectedIds.includes(s.id)
                const isEditing = editingId === s.id
                return (
                  <div
                    key={s.id}
                    className={cn(
                      "rounded-2xl border p-4 transition-all",
                      checked
                        ? "border-[#009fe3] bg-[#009fe3]/5 shadow-sm"
                        : "border-border/60 bg-white/60 dark:bg-slate-800/40"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => onToggle(s.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex items-center gap-1 mb-2">
                            <Input
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              className="h-7 text-sm"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => {
                                onRename(s.id, editLabel.trim() || s.label)
                                setEditingId(null)
                              }}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm truncate">{s.label}</h4>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => {
                                  setEditingId(s.id)
                                  setEditLabel(s.label)
                                }}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-red-500 hover:text-red-600"
                                onClick={() => onRemove(s.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>
                            Drawdown {s.inputs.drawdown}% · Guarantee{" "}
                            {s.outputs.living?.guarantee_period ?? "—"}y · {s.inputs.frequency}
                          </div>
                          <div className="text-foreground font-medium pt-1">
                            {fmt(s.outputs.living?.guaranteed_annuity)} / {s.inputs.frequency.toLowerCase()}
                          </div>
                          <div>Funds remaining: {fmt(s.outputs.living?.funds_remaining)}</div>
                          {s.outputs.life && (
                            <div className="pt-1">
                              {typeof s.outputs.life.guarantee_period === "number" && (
                                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                  {s.outputs.life.guarantee_period}-Year Guarantee
                                </div>
                              )}
                              <div>Life annuity: {fmt(s.outputs.life.monthly_annuity)} / month</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="border-t pt-4">
              <Button
                onClick={onGenerate}
                disabled={selectedCount === 0}
                className="w-full"
              >
                Generate Quote ({selectedCount})
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default AnnuityScenarioDrawer

export const ScenarioDrawerTrigger = ({
  count,
  onClick,
}: {
  count: number
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className="fixed right-0 top-1/3 z-40 flex items-center gap-2 rounded-l-2xl bg-[#031d42] dark:bg-[#0ea5e9] text-white px-4 py-3 shadow-lg hover:px-5 transition-all"
  >
    <Layers className="h-4 w-4" />
    <span className="text-sm font-semibold">Scenarios</span>
    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{count}</span>
  </button>
)
