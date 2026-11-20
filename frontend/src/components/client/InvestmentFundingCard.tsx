import { useState } from "react"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { readFundingAmounts } from "@/components/policy/policyReview"
import type { PolicyFundingStatus } from "@/hooks/usePolicyFunding"

const money = (n: number | null) =>
  n == null ? "—" : `BWP ${n.toLocaleString("en-BW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

interface Props {
  form: Record<string, string>
  funding: { data: PolicyFundingStatus | null; loading: boolean; error: string; confirm: () => Promise<void> }
  className?: string
}

/** Confirms receipt only. Never activates the investment or purchases units. */
export const InvestmentFundingCard = ({ form, funding, className = "" }: Props) => {
  const { gross, net, grossFlag } = readFundingAmounts(form)
  const [checked, setChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  const { data, loading, error } = funding
  const confirmed = data?.status === "confirmed"

  const submit = async () => {
    setBusy(true)
    try { await funding.confirm(); toast.success("Funds confirmed") }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed to confirm funds") }
    finally { setBusy(false); setChecked(false) }
  }

  return (
    <div className={className} data-investment-funding>
      <div className="flex items-center justify-between gap-4 mb-5">
        <h3 className="text-xl font-bold tracking-tight text-foreground">Investment Funding</h3>
        {confirmed
          ? <Badge className="whitespace-nowrap bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15">Funds Confirmed</Badge>
          : !loading && !error && <Badge variant="outline" className="whitespace-nowrap">Awaiting funds confirmation</Badge>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Gross Investment Amount</p>
          {grossFlag
            ? <p className="mt-1 flex items-start gap-2 text-sm font-medium text-amber-700 dark:text-amber-400"><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />{grossFlag}</p>
            : <p className="mt-1 text-lg font-bold tabular-nums">{money(gross)}</p>}
        </div>
        <div className="rounded-xl border border-border px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Net Investment Amount</p>
          <p className="mt-1 text-lg font-bold tabular-nums">{money(net)}</p>
        </div>
      </div>

      <div className="mt-5">
        {loading && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading funding status…</p>}
        {!loading && error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && confirmed && (
          <p className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Confirmed by <span className="font-semibold">{data?.confirmedByName || data?.confirmedBy}</span>
            {data?.confirmedAt && <> on <span className="font-semibold">{new Date(data.confirmedAt).toLocaleString("en-GB")}</span></>}
          </p>
        )}
        {!loading && !error && !confirmed && data?.canConfirm && (
          <div className="space-y-4">
            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} disabled={busy} aria-label="I confirm that the client's investment funds have been received." className="mt-0.5" />
              <span>I confirm that the client's investment funds have been received.</span>
            </label>
            <Button onClick={submit} disabled={!checked || busy} className="rounded-full">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? "Confirming…" : "Confirm Funds Received"}
            </Button>
          </div>
        )}
        {!loading && !error && !confirmed && !data?.canConfirm && (
          <p className="text-sm text-muted-foreground">Funds receipt has not yet been confirmed by an authorised administrator.</p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">Confirming funds does not activate the investment or purchase units.</p>
      </div>
    </div>
  )
}

export default InvestmentFundingCard
