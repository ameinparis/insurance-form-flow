import { useState } from "react"
import { ArrowLeft, ArrowUpRight, Building2, Check, Circle, Layers3, Pencil, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { AssetManagerForm, FundForm } from "./AssetManagerForms"
import { RISK_LEVELS, saveFund, type AssetManager, type Fund, type RiskLevel, type Status } from "./assetManagerModel"

const riskClasses: Record<RiskLevel, string> = {
  "Low": "investment-risk-low", "Low–Moderate": "investment-risk-low-moderate", "Moderate": "investment-risk-moderate", "Moderate–High": "investment-risk-moderate-high", "High": "investment-risk-high",
}

function StatusBadge({ status }: { status: Status }) {
  return <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${status === "Active" ? "investment-risk investment-risk-low" : "border-border bg-muted/40 text-muted-foreground"}`}>
    {status === "Active" ? <Check className="h-3 w-3" /> : <Circle className="h-2.5 w-2.5" />}{status}
  </span>
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  return <span className={`investment-risk ${riskClasses[risk]} inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{risk}</span>
}

export const InvestmentManagers = () => {
  const [managers, setManagers] = useState<AssetManager[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [managerDialog, setManagerDialog] = useState<{ manager?: AssetManager } | null>(null)
  const [fundDialog, setFundDialog] = useState<{ fund?: Fund } | null>(null)
  const [query, setQuery] = useState("")
  const selected = managers.find((manager) => manager.id === selectedId)
  const filtered = managers.filter((manager) => manager.name.toLowerCase().includes(query.trim().toLowerCase()))
  const primaryAction = "bg-primary text-primary-foreground hover:bg-primary/90"

  const handleManagerSave = (manager: AssetManager) => {
    setManagers((previous) => previous.some((item) => item.id === manager.id)
      ? previous.map((item) => item.id === manager.id ? manager : item)
      : [...previous, manager])
    setManagerDialog(null)
    toast.success("Asset manager updated for this session")
  }

  return (
    <div className="min-w-0 space-y-6 pt-6">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-md border border-border bg-muted/40 px-2 py-1 font-medium">Interface Preview</span>
        <span>Changes are temporary and reset when you leave this tab.</span>
      </div>

      {selected ? <>
        <Button variant="ghost" size="sm" onClick={() => { setSelectedId(null); setFundDialog(null) }} className="-ml-3 text-muted-foreground"><ArrowLeft />Asset Managers</Button>
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary"><Building2 className="h-6 w-6" /></div>
            <div className="min-w-0 space-y-2"><h3 className="break-words text-2xl font-semibold tracking-normal">{selected.name}</h3><div className="flex flex-wrap items-center gap-3"><StatusBadge status={selected.status} /><span className="text-sm text-muted-foreground">{selected.funds.length} {selected.funds.length === 1 ? "fund" : "funds"}</span></div>{selected.description && <p className="max-w-2xl whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{selected.description}</p>}</div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setManagerDialog({ manager: selected })}><Pencil />Edit Profile</Button>
        </header>
        <div className="flex items-center justify-between gap-3"><h4 className="text-lg font-semibold tracking-normal">Funds <span className="ml-1 text-sm font-normal text-muted-foreground">({selected.funds.length})</span></h4><Button size="sm" className={primaryAction} onClick={() => setFundDialog({})}><Plus />Add Fund</Button></div>
        {selected.funds.length === 0 ? <div className="flex flex-col items-center gap-3 border-y border-dashed border-border py-14 text-center"><Layers3 className="h-8 w-8 text-muted-foreground" /><h4 className="text-base font-semibold tracking-normal">No funds yet</h4><Button variant="secondary" size="sm" onClick={() => setFundDialog({})}><Plus />Add Fund</Button></div>
          : <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{selected.funds.map((fund) => <article key={fund.id} className="min-w-0 rounded-lg border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h5 className="break-words text-base font-semibold tracking-normal">{fund.name}</h5><p className="mt-1 text-sm text-muted-foreground">{fund.type}</p></div><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" title={`Edit ${fund.name}`} aria-label={`Edit ${fund.name}`} onClick={() => setFundDialog({ fund })}><Pencil /></Button></div>
            <div className="mt-4 flex flex-wrap gap-2"><RiskBadge risk={fund.risk} /><StatusBadge status={fund.status} /></div>
            {fund.description && <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{fund.description}</p>}
            {fund.code && <p className="mt-4 break-words border-t border-border pt-3 text-xs text-muted-foreground">Fund Code <span className="ml-2 font-medium text-foreground">{fund.code}</span></p>}
          </article>)}</div>}
      </> : <>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="text-2xl font-semibold tracking-normal">Asset Managers</h3><p className="mt-1 text-sm text-muted-foreground">{managers.length} {managers.length === 1 ? "manager" : "managers"} · {managers.reduce((sum, manager) => sum + manager.funds.length, 0)} funds</p></div><Button className={`${primaryAction} self-start`} onClick={() => setManagerDialog({})}><Plus />Add Asset Manager</Button></header>
        {managers.length > 0 && <div className="relative max-w-sm"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search asset managers" placeholder="Search asset managers" value={query} onChange={(event) => setQuery(event.target.value)} className="bg-card pl-9" /></div>}
        {managers.length === 0 ? <div className="flex flex-col items-center gap-4 border-y border-dashed border-border py-20 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground"><Building2 className="h-7 w-7" /></div><h4 className="text-lg font-semibold tracking-normal">No asset managers yet</h4><Button variant="secondary" onClick={() => setManagerDialog({})}><Plus />Add Asset Manager</Button></div>
          : filtered.length === 0 ? <p className="py-12 text-center text-sm text-muted-foreground">No asset managers match your search.</p>
          : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((manager) => <article key={manager.id} className="flex min-w-0 flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-ring/40">
            <div className="flex items-center justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 text-primary"><Building2 className="h-5 w-5" /></div><StatusBadge status={manager.status} /></div>
            <h4 className="mt-5 break-words text-lg font-semibold tracking-normal">{manager.name}</h4>
            {manager.description && <p className="mt-2 line-clamp-2 break-words text-sm leading-relaxed text-muted-foreground">{manager.description}</p>}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4"><span className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground"><Layers3 className="h-4 w-4" />{manager.funds.length} {manager.funds.length === 1 ? "fund" : "funds"}</span><Button variant="ghost" size="sm" className="mt-4" aria-label={`Open ${manager.name} profile`} onClick={() => setSelectedId(manager.id)}>View Profile<ArrowUpRight /></Button></div>
          </article>)}</div>}
      </>}
      {managerDialog && <AssetManagerForm manager={managerDialog.manager} onSave={handleManagerSave} onClose={() => setManagerDialog(null)} />}
      {fundDialog && selected && <FundForm managerName={selected.name} fund={fundDialog.fund} onSave={(fund) => { setManagers((previous) => saveFund(previous, selected.id, fund)); setFundDialog(null); toast.success("Fund updated for this session") }} onClose={() => setFundDialog(null)} />}
    </div>
  )
}

export default InvestmentManagers
