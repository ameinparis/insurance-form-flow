import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { usePurchasePreview } from "@/hooks/usePurchasePreview"

const bwp = (v: string) => {
  const [i, d = "00"] = v.split(".")
  return `BWP ${i.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${d.padEnd(2, "0").slice(0, 2)}`
}
const groupUnits = (v: string) => { const [i, d] = v.split("."); return `${i.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${d}` }
const dmy = (iso: string) => iso.split("-").reverse().join(".")

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold text-right">{value}</span>
  </div>
)

export const PurchasePreviewSection = ({ policyId, fundId }: { policyId: string; fundId: string | null }) => {
  const [date, setDate] = useState("")
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
        <Row label="Purchase Status" value="Not yet purchased" />
      </div>}
      <p className="mt-3 text-xs text-muted-foreground">This is an estimate. No units are purchased and the policy is not changed.</p>
    </div>
  )
}
