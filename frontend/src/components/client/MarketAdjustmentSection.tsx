import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Row } from "@/components/client/PurchasePreviewSection"
import { formatDate, formatMoney, formatPrice, formatUnits } from "@/lib/investmentStatement"
import type { MarketAdjustment } from "@/hooks/useMarketAdjustments"

const signedMoney = (v: string) => (v.startsWith("-") ? formatMoney(v) : `+${formatMoney(v)}`)

/** Root Admin / Super Admin only. All figures come from the server; nothing is calculated here. */
export const MarketAdjustmentSection = ({ fundId, preview, confirm }: {
  fundId: string
  preview: (fundId: string, date: string) => Promise<MarketAdjustment>
  confirm: (fundId: string, p: MarketAdjustment) => Promise<unknown>
}) => {
  const [date, setDate] = useState("")
  const [data, setData] = useState<MarketAdjustment | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [ticked, setTicked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmError, setConfirmError] = useState("")

  const run = async () => {
    setLoading(true); setError(""); setData(null)
    try { setData(await preview(fundId, date)) } catch (e) { setError(e instanceof Error ? e.message : "Could not prepare the preview") }
    finally { setLoading(false) }
  }
  const submit = async () => {
    if (!data) return
    setSaving(true); setConfirmError("")
    try { await confirm(fundId, data); setOpen(false); setData(null); setDate("") }
    catch (e) { setConfirmError(e instanceof Error ? e.message : "Could not record the adjustment") }
    finally { setSaving(false) }
  }
  const rows = data && [
    ["Valuation Date", formatDate(data.valuationDate)],
    ["Previous Unit Price", formatPrice(data.previousUnitPrice)],
    ["New Unit Price", formatPrice(data.newUnitPrice)],
    ["Units Held", formatUnits(data.unitsHeld)],
    ["Market Price Adjustment", signedMoney(data.adjustment)],
    ["Previous Closing Balance", formatMoney(data.previousClosingBalance)],
    ["New Closing Balance", formatMoney(data.newClosingBalance)],
  ]
  return (
    <div data-market-adjustment className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold">Market Price Adjustment</h3>
        <Badge variant="outline" className="whitespace-nowrap">Requires confirmation</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Uses the unit price recorded in Administration → Investment Managers for the exact date.</p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="min-w-[12rem] text-xs font-medium text-muted-foreground">Valuation date
          <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setData(null) }} className="mt-1" aria-label="Valuation date" />
        </label>
        <Button onClick={run} disabled={!date || loading} className="rounded-full">{loading && <Loader2 className="h-4 w-4 animate-spin" />} Preview adjustment</Button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {rows && <div className="mt-3 max-w-xl">
        {rows.map(([l, v]) => <Row key={l} label={l} value={v} />)}
        <Button className="mt-3 rounded-full" onClick={() => { setTicked(false); setConfirmError(""); setOpen(true) }}>Confirm Market Adjustment</Button>
      </div>}
      {rows && <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Market Adjustment</DialogTitle>
            <DialogDescription>This adds a permanent statement entry. Units held do not change.</DialogDescription></DialogHeader>
          <div>{rows.map(([l, v]) => <Row key={l} label={l} value={v} />)}</div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={ticked} onCheckedChange={(v) => setTicked(v === true)} aria-label="Confirm adjustment details" />
            I confirm these adjustment details are correct.
          </label>
          {confirmError && <p role="alert" className="text-sm text-destructive">{confirmError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving} className="rounded-full">Cancel</Button>
            <Button onClick={submit} disabled={!ticked || saving} className="rounded-full">{saving && <Loader2 className="h-4 w-4 animate-spin" />} {saving ? "Recording…" : "Confirm Adjustment"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}
    </div>
  )
}
