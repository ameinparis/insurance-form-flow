import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useFeeConfig, DEFAULT_FEE_CONFIG, FeeConfig } from "@/hooks/useFeeConfig"

const FIELDS: { key: keyof FeeConfig; label: string; hint: string; suffix: string; step: string }[] = [
  { key: "purchasePremiumPct", label: "Purchase Premium", hint: "% of Investment Amount Premium", suffix: "%", step: "0.001" },
  { key: "upfrontCommissionPct", label: "Upfront Commission", hint: "% of Investment Amount Premium (optional per policy)", suffix: "%", step: "0.001" },
  { key: "administrationFeePct", label: "Administration Fee", hint: "% of Investment Amount Premium", suffix: "%", step: "0.001" },
  { key: "ongoingAdvisoryMaxPct", label: "Ongoing Advisory Fee (max)", hint: "Upper limit advisors may capture", suffix: "%", step: "0.001" },
  { key: "switchFee", label: "Switch Fee", hint: "Fixed amount", suffix: "BWP", step: "1" },
  { key: "funeralPremium", label: "Funeral Premium", hint: "Fixed amount", suffix: "BWP", step: "1" },
]

export const FeeConfiguration = () => {
  const { config, saveConfig, resetConfig } = useFeeConfig()
  const [draft, setDraft] = useState<Record<string, string>>({})

  useEffect(() => {
    setDraft(
      Object.fromEntries(Object.entries(config).map(([k, v]) => [k, String(v)])) as Record<string, string>,
    )
  }, [config])

  const handleSave = () => {
    const next: Partial<FeeConfig> = {}
    for (const field of FIELDS) {
      const parsed = Number(draft[field.key])
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast.error(`${field.label} must be a valid positive number`)
        return
      }
      next[field.key] = parsed
    }
    saveConfig(next)
    toast.success("Fee configuration saved")
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0">
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Fee Configuration</h3>
            <p className="text-sm text-muted-foreground">
              These percentages drive the Premium and Policy Fees step of the Convert to Policy wizard.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {FIELDS.map((field) => (
              <div key={field.key}>
                <Label>{field.label}</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    type="number"
                    step={field.step}
                    min="0"
                    value={draft[field.key] ?? ""}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  />
                  <span className="text-xs text-muted-foreground w-10">{field.suffix}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{field.hint}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                resetConfig()
                setDraft(
                  Object.fromEntries(
                    Object.entries(DEFAULT_FEE_CONFIG).map(([k, v]) => [k, String(v)]),
                  ) as Record<string, string>,
                )
                toast.success("Restored default percentages")
              }}
            >
              Restore defaults
            </Button>
            <Button onClick={handleSave}>Save changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FeeConfiguration
