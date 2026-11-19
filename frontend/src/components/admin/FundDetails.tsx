import { useState, type FormEvent } from "react"
import { ArrowLeft, Plus, Pencil, Loader2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAuth } from "@/lib/authlibrary"
import { useFundValuations, type FundValuation, type ValuationInput } from "@/hooks/useFundValuations"
import { formatUnitPrice } from "./unitPrice"

const price = formatUnitPrice
const timestamp = (value: string) => new Date(value).toLocaleString("en-BW")

function ValuationDialog({ valuation, save, close }: {
  valuation?: FundValuation; save: (input: ValuationInput, valuation?: FundValuation) => Promise<void>; close: () => void
}) {
  const [input, setInput] = useState<ValuationInput>({ unitPrice: valuation?.unitPrice || "", valuationDate: valuation?.valuationDate || "",
    source: valuation?.source || "", notes: valuation?.notes || "", reason: "", revision: valuation?.revision })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(input.unitPrice) || !/[1-9]/.test(input.unitPrice)) { setError("Enter a positive unit price with up to 6 decimal places."); return }
    if (valuation && !input.reason.trim()) { setError("A correction reason is required."); return }
    setSaving(true); setError("")
    try { await save(input, valuation); close() }
    catch (e) { setError(e instanceof Error ? e.message : "Could not save valuation") }
    finally { setSaving(false) }
  }
  const set = (key: keyof ValuationInput, value: string) => setInput((previous) => ({ ...previous, [key]: value }))
  return <Dialog open onOpenChange={(open) => { if (!open && !saving) close() }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg" onEscapeKeyDown={(event) => { if (saving) event.preventDefault() }} onPointerDownOutside={(event) => { if (saving) event.preventDefault() }}>
      <DialogHeader><DialogTitle>{valuation ? "Correct Valuation" : "Record Unit Price"}</DialogTitle></DialogHeader>
      <form onSubmit={submit} className="space-y-5">
        <fieldset disabled={saving} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="valuation-date">Valuation Date</Label><Input id="valuation-date" type="date" required value={input.valuationDate} readOnly={!!valuation} onChange={(e) => set("valuationDate", e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="unit-price">Unit Price (BWP)</Label><Input id="unit-price" inputMode="decimal" required value={input.unitPrice} onChange={(e) => set("unitPrice", e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="valuation-source">Source (optional)</Label><Input id="valuation-source" maxLength={500} value={input.source} onChange={(e) => set("source", e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="valuation-notes">Notes (optional)</Label><Textarea id="valuation-notes" maxLength={2000} value={input.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          {valuation && <div className="space-y-2"><Label htmlFor="correction-reason">Correction Reason</Label><Textarea id="correction-reason" required maxLength={2000} value={input.reason} onChange={(e) => set("reason", e.target.value)} /></div>}
        </fieldset>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={close}>Cancel</Button><Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? "Saving…" : valuation ? "Save Correction" : "Record Price"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}

export function FundDetails({ managerId, fundId, onBack }: { managerId: string; fundId: string; onBack: () => void }) {
  const { data, loading, error, refresh, save } = useFundValuations(managerId, fundId)
  const { permissions } = useAuth()
  const [dialog, setDialog] = useState<{ valuation?: FundValuation } | null>(null)
  if (loading && !data) return <div className="py-12 flex items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading fund…</div>
  if (!data) return <div className="space-y-4 py-6"><Button variant="ghost" onClick={onBack}><ArrowLeft />Funds</Button><p role="alert" className="text-destructive">{error}</p><Button variant="outline" onClick={() => void refresh()}>Retry</Button></div>
  const valuations = [...data.valuations].sort((a, b) => b.valuationDate.localeCompare(a.valuationDate))
  const latest = valuations[0]
  const audit = valuations.flatMap((valuation) => valuation.history.map((entry) => ({ ...entry, valuationDate: valuation.valuationDate, id: `${valuation._id}-${entry.revision}` })))
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
  return <div className="space-y-6 pt-6 min-w-0">
    <Button variant="ghost" size="sm" onClick={onBack} className="-ml-3 text-muted-foreground"><ArrowLeft />Funds</Button>
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
      <div className="min-w-0"><h3 className="text-2xl font-semibold break-words">{data.fund.name}</h3><p className="text-muted-foreground mt-1">{data.assetManager.name}</p></div>
      {permissions.canManageInvestments && <Button onClick={() => setDialog({})}><Plus />Record Unit Price</Button>}
    </header>
    {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
    <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[['Fund Code', data.fund.code || '—'], ['Fund Type', data.fund.type], ['Risk Level', data.fund.risk], ['Status', data.fund.status]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium break-words">{value}</dd></div>)}
    </dl>
    <section className="border-y border-border py-5"><h4 className="text-sm text-muted-foreground">Latest Unit Price</h4><p className="mt-1 text-3xl font-semibold tabular-nums">{latest ? price(latest.unitPrice) : '—'}</p><p className="mt-2 text-sm text-muted-foreground">{latest ? `Valuation date: ${latest.valuationDate}` : 'No valuations recorded'}</p></section>
    <section className="space-y-4"><h4 className="text-lg font-semibold">Unit Price History</h4>
      {valuations.length ? <>
        <div className="h-64 w-full min-w-0 text-muted-foreground" aria-label="Historical unit price chart">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={[...valuations].reverse().map((valuation) => ({ date: valuation.valuationDate, price: Number(valuation.unitPrice), exact: valuation.unitPrice }))} margin={{ top: 12, right: 16, left: 12, bottom: 12 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} /><YAxis domain={['auto', 'auto']} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
            <Tooltip formatter={(_value, _name, item) => [price(item.payload.exact), 'Unit Price']} contentStyle={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            <Line type="linear" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} isAnimationActive={false} />
          </LineChart></ResponsiveContainer>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-left text-sm"><thead className="bg-muted/40"><tr>{['Valuation Date', 'Unit Price (BWP)', 'Source / Notes', 'Revision', ''].map((label, index) => <th key={index} className="px-4 py-3 font-medium whitespace-nowrap">{label}</th>)}</tr></thead><tbody>{valuations.map((valuation) => <tr key={valuation._id} className="border-t border-border">
          <td className="px-4 py-3 whitespace-nowrap">{valuation.valuationDate}</td><td className="px-4 py-3 font-semibold whitespace-nowrap tabular-nums">{price(valuation.unitPrice)}</td><td className="px-4 py-3 min-w-40"><p>{valuation.source || '—'}</p>{valuation.notes && <p className="text-xs text-muted-foreground break-words">{valuation.notes}</p>}</td><td className="px-4 py-3"><Badge variant="secondary">{valuation.revision}</Badge></td><td className="px-4 py-3">{permissions.canManageInvestments && <Button variant="ghost" size="sm" onClick={() => setDialog({ valuation })}><Pencil />Correct</Button>}</td>
        </tr>)}</tbody></table></div>
      </> : <p className="text-sm text-muted-foreground py-6">No unit prices recorded.</p>}
    </section>
    <section className="space-y-4 border-t border-border pt-6"><h4 className="text-lg font-semibold">Valuation Audit Trail</h4>
      {audit.length ? <div className="divide-y divide-border">{audit.map((entry) => <div key={entry.id} className="py-4 grid gap-2 sm:grid-cols-[1fr_2fr]">
        <div><p className="text-sm font-medium">{entry.administratorName}</p><p className="text-xs text-muted-foreground">{timestamp(entry.recordedAt)}</p><p className="text-xs text-muted-foreground">Valuation: {entry.valuationDate} · Revision {entry.revision}</p></div>
        <div><p className="text-sm font-semibold tabular-nums">{entry.previousPrice ? `${price(entry.previousPrice)} → ${price(entry.replacementPrice)}` : `Recorded ${price(entry.replacementPrice)}`}</p>{entry.reason && <p className="text-sm mt-1 break-words">{entry.reason}</p>}{entry.source && <p className="text-xs text-muted-foreground mt-1 break-words">Source: {entry.source}</p>}{entry.notes && <p className="text-xs text-muted-foreground mt-1 break-words">{entry.notes}</p>}</div>
      </div>)}</div> : <p className="text-sm text-muted-foreground">No valuation activity yet.</p>}
    </section>
    {dialog && <ValuationDialog valuation={dialog.valuation} save={save} close={() => setDialog(null)} />}
  </div>
}