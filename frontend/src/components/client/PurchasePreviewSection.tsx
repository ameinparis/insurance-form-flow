import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { usePurchasePreview } from "@/hooks/usePurchasePreview"
import type { ConfirmPurchaseInput } from "@/hooks/useUnitPurchases"

export const bwp = (v: string) => {
  const [i, d = "00"] = v.split(".")
  return `BWP ${i.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${d.padEnd(2, "0").slice(0, 2)}`
}
export const groupUnits = (v: string) => { const [i, d] = v.split("."); return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${d}` }
export const dmy = (iso: string) => iso.split("-").reverse().join(".")

export const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold text-right">{value}</span>
  </div>
)

export const PurchasePreviewSection = ({ policyId, fundId, onConfirm }: { policyId: string; fundId: string | null; onConfirm: (fundId: string, input: ConfirmPurchaseInput) => Promise<unknown> }) => {
  const [date, setDate] = useState("")
  const [open, setOpen] = useState(false)
  const [ticked, setTicked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmError, setConfirmError] = useState("")
  const submit = async () => {
    if (!data || !fundId) return
    setSaving(true); setConfirmError("")
    try {
      await onConfirm(fundId, { purchaseDate: data.purchaseDate, approvedAmount: data.approvedAmount, unitPrice: data.unitPrice,
        valuationId: data.valuationId, valuationRevision: data.valuationRevision, inputHash: data.inputHash })
      setOpen(false)
    } catch (e) { setConfirmError(e instanceof Error ? e.message : "Could not record the unit purchase") }
    finally { setSaving(false) }
  }
  const { data, error, loading, run } = usePurchasePreview(policyId, fundId)
  return (
    <div data-purchase-preview className="mt-6 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Purchase Preview — Not Yet Activated</p>
        <Badge variant="outline" className="whitespace-nowrap">Preview only</Badge>
      </div>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex-1 min-w-[10rem] text-xs font-medium text-muted-foreground">Intended purchase date
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" aria-label="Intended purchase date" />
        </label>
        <Button onClick={() => run(date)} disabled={!date || loading} className="rounded-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Preview units
        </Button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {data && <div className="mt-3">
        <Row label="Investment Amount" value={bwp(data.approvedAmount)} />
        <Row label="Purchase Date" value={dmy(data.purchaseDate)} />
        <Row label="Unit Price" value={`BWP ${data.unitPrice} (valued ${dmy(data.valuationDate)})`} />
        <Row label="Estimated Units" value={groupUnits(data.displayedUnits)} />
        <Row label="Initial Closing Balance" value={bwp(data.closingBalance)} />
        <Row label="Purchase Status" value="Not yet purchased" />
        <Button className="mt-3 w-full rounded-full" onClick={() => { setTicked(false); setConfirmError(""); setOpen(true) }}>Confirm Unit Purchase</Button>
      </div>}
      {data && <Dialog open={open} onOpenChange={(o) => !saving && setOpen(o)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Unit Purchase</DialogTitle>
            <DialogDescription>This records the initial unit purchase for this fund only. It cannot be undone here.</DialogDescription></DialogHeader>
          <div>
            <Row label="Fund" value={data.fundName} />
            <Row label="Purchase Date" value={dmy(data.purchaseDate)} />
            <Row label="Investment Amount" value={bwp(data.approvedAmount)} />
            <Row label="Unit Price" value={`BWP ${data.unitPrice}`} />
            <Row label="Units" value={groupUnits(data.displayedUnits)} />
            <Row label="Initial Closing Balance" value={bwp(data.closingBalance)} />
          </div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox checked={ticked} onCheckedChange={(v) => setTicked(v === true)} aria-label="Confirm purchase details" />
            I confirm these purchase details are correct.
          </label>
          {confirmError && <p role="alert" className="text-sm text-destructive">{confirmError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving} className="rounded-full">Cancel</Button>
            <Button onClick={submit} disabled={!ticked || saving} className="rounded-full">{saving && <Loader2 className="h-4 w-4 animate-spin" />} {saving ? "Recording…" : "Confirm Purchase"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}
      <p className="mt-3 text-xs text-muted-foreground">This is an estimate until you confirm. Previewing never purchases units or changes the policy.</p>
    </div>
  )
}
