import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toTitleCase } from "@/lib/quoteUtils"
import { FUND_TYPES, RISK_LEVELS, type AssetManager, type Fund, type FundType, type RiskLevel, type Status } from "./assetManagerModel"

function StatusField({ value, onChange }: { value: Status; onChange: (value: Status) => void }) {
  return <div className="space-y-2">
    <Label htmlFor="record-status">Status</Label>
    <Select value={value} onValueChange={(next) => onChange(next as Status)}>
      <SelectTrigger id="record-status"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent>
    </Select>
  </div>
}

export function AssetManagerForm({ manager, onSave, onClose }: {
  manager?: AssetManager
  onSave: (manager: AssetManager) => void
  onClose: () => void
}) {
  const [name, setName] = useState(manager?.name ?? "")
  const [description, setDescription] = useState(manager?.description ?? "")
  const [status, setStatus] = useState<Status>(manager?.status ?? "Active")
  const [error, setError] = useState("")
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) { setError("Asset Manager Name is required."); return }
    onSave({ id: manager?.id ?? crypto.randomUUID(), name: toTitleCase(name.trim()), description: description.trim(), status, funds: manager?.funds ?? [] })
  }
  return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg bg-card sm:max-w-lg">
      <DialogHeader><DialogTitle className="tracking-normal">{manager ? "Edit Asset Manager" : "Add Asset Manager"}</DialogTitle><DialogDescription>Asset manager profile</DialogDescription></DialogHeader>
      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="space-y-2"><Label htmlFor="manager-name">Asset Manager Name <span aria-hidden="true">*</span></Label><Input id="manager-name" value={name} onChange={(event) => { setName(event.target.value); setError("") }} required aria-invalid={!!error} aria-describedby={error ? "manager-error" : undefined} placeholder="Asset manager name" />{error && <p id="manager-error" role="alert" className="text-sm text-destructive">{error}</p>}</div>
        <div className="space-y-2"><Label htmlFor="manager-description">Description <span className="text-muted-foreground">(optional)</span></Label><Textarea id="manager-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} /></div>
        <StatusField value={status} onChange={setStatus} />
        <DialogFooter className="gap-2 border-t border-border pt-4"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">{manager ? "Save Changes" : "Create Asset Manager"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}

export function FundForm({ managerName, fund, onSave, onClose }: {
  managerName: string
  fund?: Fund
  onSave: (fund: Fund) => void
  onClose: () => void
}) {
  const [name, setName] = useState(fund?.name ?? "")
  const [type, setType] = useState<FundType>(fund?.type ?? "Money Market")
  const [code, setCode] = useState(fund?.code ?? "")
  const [risk, setRisk] = useState<RiskLevel>(fund?.risk ?? "Low")
  const [description, setDescription] = useState(fund?.description ?? "")
  const [status, setStatus] = useState<Status>(fund?.status ?? "Active")
  const [error, setError] = useState("")
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) { setError("Fund Name is required."); return }
    onSave({ id: fund?.id ?? crypto.randomUUID(), name: toTitleCase(name.trim()), type, code: code.trim(), risk, description: description.trim(), status })
  }
  return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
    <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg bg-card sm:max-w-xl">
      <DialogHeader><DialogTitle className="tracking-normal">{fund ? "Edit Fund" : "Add Fund"}</DialogTitle><DialogDescription className="break-words">{managerName}</DialogDescription></DialogHeader>
      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="space-y-2"><Label htmlFor="fund-name">Fund Name <span aria-hidden="true">*</span></Label><Input id="fund-name" value={name} onChange={(event) => { setName(event.target.value); setError("") }} required aria-invalid={!!error} aria-describedby={error ? "fund-error" : undefined} placeholder="Fund name" />{error && <p id="fund-error" role="alert" className="text-sm text-destructive">{error}</p>}</div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="fund-type">Fund Type</Label><Select value={type} onValueChange={(value) => setType(value as FundType)}><SelectTrigger id="fund-type"><SelectValue /></SelectTrigger><SelectContent>{FUND_TYPES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="fund-risk">Risk Level</Label><Select value={risk} onValueChange={(value) => setRisk(value as RiskLevel)}><SelectTrigger id="fund-risk"><SelectValue /></SelectTrigger><SelectContent>{RISK_LEVELS.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="space-y-2"><Label htmlFor="fund-code">Fund Code <span className="text-muted-foreground">(optional)</span></Label><Input id="fund-code" value={code} onChange={(event) => setCode(event.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="fund-description">Fund Description <span className="text-muted-foreground">(optional)</span></Label><Textarea id="fund-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} /></div>
        <StatusField value={status} onChange={setStatus} />
        <DialogFooter className="gap-2 border-t border-border pt-4"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">{fund ? "Save Changes" : "Create Fund"}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
}