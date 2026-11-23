import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Row } from "@/components/client/PurchasePreviewSection"
import { batchRowUnitPrice, formatDate, formatMoney, formatPrice, formatUnits } from "@/lib/investmentStatement"
import type { MonthlyBatch } from "@/hooks/useMonthlyProcessing"

const pct = (v: string) => `${v}%`

const Rows = ({ d }: { d: MonthlyBatch }) => (
  <Table>
    <TableHeader><TableRow>
      <TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Number of Units</TableHead>
      <TableHead className="text-right">Unit Price</TableHead><TableHead className="text-right">Market Value</TableHead><TableHead className="text-right">Closing Balance</TableHead>
    </TableRow></TableHeader>
    <TableBody>{d.rows.map((r) => (
      <TableRow key={r.type}>
        <TableCell className="whitespace-nowrap">{formatDate(d.valuationDate)}</TableCell>
        <TableCell className="whitespace-nowrap">{r.description}</TableCell>
        <TableCell className="text-right">-</TableCell>
        <TableCell className="text-right whitespace-nowrap">{formatPrice(batchRowUnitPrice(d, r.type))}</TableCell>
        <TableCell className="text-right whitespace-nowrap">{formatMoney(r.movement)}</TableCell>
        <TableCell className="text-right whitespace-nowrap font-semibold">{formatMoney(r.closingBalance)}</TableCell>
      </TableRow>))}
    </TableBody>
  </Table>
)

/** Root Admin / Super Admin only. All figures come from the server; nothing is calculated here. */
export const MonthlyProcessingSection = ({ fundId, preview, confirm }: {
  fundId: string
  preview: (fundId: string, date: string) => Promise<MonthlyBatch>
  confirm: (fundId: string, p: MonthlyBatch) => Promise<unknown>
}) => {
  const [date, setDate] = useState("")
  const [data, setData] = useState<MonthlyBatch | null>(null)
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
    catch (e) { setConfirmError(e instanceof Error ? e.message : "Could not record monthly processing") }
    finally { setSaving(false) }
  }
  const inputs = data && [
    ["Previous Transaction Date", formatDate(data.previousDate)],
    ["Previous Unit Price", formatPrice(data.previousUnitPrice)],
    ["New Unit Price", formatPrice(data.newUnitPrice)],
    ["Units Held", formatUnits(data.unitsHeld)],
    ["Previous Closing Balance", formatMoney(data.previousClosingBalance)],
    ["Approved Allocation", pct(data.allocationPercent)],
    ["Policy Funeral Premium", formatMoney(data.funeralPremium)],
    ["Administration Fee Rate", pct(data.adminFeePercent)],
  ]
  return (
    <div data-monthly-processing className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold">Monthly Processing</h3>
        <Badge variant="outline" className="whitespace-nowrap">Requires confirmation</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Market price adjustment, funeral cover premium and administration fee, using the unit price recorded for the exact date.</p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="min-w-[12rem] text-xs font-medium text-muted-foreground">Valuation date
          <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setData(null) }} className="mt-1" aria-label="Valuation date" />
        </label>
        <Button onClick={run} disabled={!date || loading} className="rounded-full">{loading && <Loader2 className="h-4 w-4 animate-spin" />} Preview Monthly Processing</Button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {data && inputs && <div className="mt-4 space-y-4">
        <div className="max-w-xl">{inputs.map(([l, v]) => <Row key={l} label={l} value={v} />)}</div>
        <Rows d={data} />
        <Button className="rounded-full" onClick={() => { setTicked(false); setConfirmError(""); setOpen(true) }}>Confirm Monthly Processing</Button>
      </div>}
      {data && <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Confirm Monthly Processing</DialogTitle>
            <DialogDescription>These three entries are saved together and permanently. Units held do not change.</DialogDescription></DialogHeader>
          <div className="overflow-x-auto"><Rows d={data} /></div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={ticked} onCheckedChange={(v) => setTicked(v === true)} aria-label="Confirm monthly processing" />
            I confirm these monthly entries are correct.
          </label>
          {confirmError && <p role="alert" className="text-sm text-destructive">{confirmError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving} className="rounded-full">Cancel</Button>
            <Button onClick={submit} disabled={!ticked || saving} className="rounded-full">{saving && <Loader2 className="h-4 w-4 animate-spin" />} {saving ? "Recording…" : "Confirm Monthly Processing"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}
    </div>
  )
}
