import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  FileText,
  Users,
  Wallet,
  Briefcase,
  ClipboardList,
} from "lucide-react"
import { getClient, CRMClient, ClientPolicy } from "@/lib/clientStore"
import { toTitleCase } from "@/lib/quoteUtils"

const fmtBWP = (n?: number) =>
  typeof n === "number"
    ? `BWP ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—"

const PendingChip = () => (
  <Badge
    variant="outline"
    className="rounded-full bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 gap-1"
  >
    <AlertCircle className="h-3 w-3" /> Pending
  </Badge>
)

const DoneChip = () => (
  <Badge
    variant="outline"
    className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 gap-1"
  >
    <CheckCircle2 className="h-3 w-3" /> Captured
  </Badge>
)

const SectionCard = ({
  icon: Icon,
  title,
  pending,
  children,
}: {
  icon: typeof FileText
  title: string
  pending: boolean
  children: React.ReactNode
}) => (
  <Card className="rounded-3xl border-0 shadow-sm">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="font-heading font-semibold">{title}</h3>
        </div>
        {pending ? <PendingChip /> : <DoneChip />}
      </div>
      {children}
    </CardContent>
  </Card>
)

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between py-2 border-b border-border/60 last:border-0 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value ?? "—"}</span>
  </div>
)

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<CRMClient | null>(null)

  useEffect(() => {
    if (id) setClient(getClient(id) || null)
  }, [id])

  if (!client) {
    return (
      <div className="p-8">
        <Button variant="outline" onClick={() => navigate(-1)} className="rounded-full mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Card className="rounded-3xl">
          <CardContent className="py-16 text-center text-muted-foreground">
            Client not found.
          </CardContent>
        </Card>
      </div>
    )
  }

  const policy: ClientPolicy | undefined = client.policies[0]
  const initials = client.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="p-8 space-y-6">
      <Button variant="outline" onClick={() => navigate("/clients")} className="rounded-full">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Clients
      </Button>

      {/* Identity card */}
      <Card className="rounded-3xl border-0 shadow-sm">
        <CardContent className="p-8">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="h-20 w-20 rounded-full bg-[#163144] text-white flex items-center justify-center text-2xl font-semibold">
              {initials}
            </div>
            <div className="flex-1 min-w-[240px]">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-heading text-2xl font-bold">{toTitleCase(client.fullName)}</h1>
                {policy && (
                  <Badge
                    variant="outline"
                    className="rounded-full bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                  >
                    {policy.status}
                  </Badge>
                )}
                {policy && (
                  <Badge
                    variant="outline"
                    className="rounded-full bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
                  >
                    {policy.policyNumber}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {client.idNumber ? `ID ${client.idNumber}` : "ID not on file"}
                {client.contactNumber && ` · ${client.contactNumber}`}
                {client.email && ` · ${client.email}`}
              </p>
            </div>
          </div>

          {policy && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-border">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Investment</p>
                <p className="font-heading text-lg font-semibold mt-1">
                  {fmtBWP(policy.investmentAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Drawdown</p>
                <p className="font-heading text-lg font-semibold mt-1">
                  {policy.drawdown != null ? `${policy.drawdown}%` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Income / {policy.frequency || "Period"}</p>
                <p className="font-heading text-lg font-semibold mt-1">
                  {fmtBWP(policy.livingAnnuity)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Product</p>
                <p className="font-heading text-lg font-semibold mt-1">{policy.productName}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {policy && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Policy Details */}
          <SectionCard icon={ClipboardList} title="Policy Details" pending={false}>
            <Row label="Policy Number" value={policy.policyNumber} />
            <Row label="Product" value={policy.productName} />
            <Row label="Source Quote" value={policy.sourceQuoteRef || "—"} />
            <Row label="Created" value={new Date(policy.createdAt).toLocaleDateString()} />
            <Row label="Start Date" value={<span className="text-muted-foreground italic">Not set</span>} />
          </SectionCard>

          {/* Premiums */}
          <SectionCard icon={Wallet} title="Premiums" pending={false}>
            <Row label="Investment Amount" value={fmtBWP(policy.investmentAmount)} />
            <Row
              label="Purchase Premium (2%)"
              value={fmtBWP(policy.investmentAmount ? policy.investmentAmount * 0.02 : undefined)}
            />
            <Row
              label="Upfront Commission (1%)"
              value={fmtBWP(policy.investmentAmount ? policy.investmentAmount * 0.01 : undefined)}
            />
            <Row label="Administration Fee" value="0.083% p.m" />
          </SectionCard>

          {/* Salary / Income */}
          <SectionCard icon={FileText} title="Salary & Income" pending={false}>
            <Row label="Drawdown %" value={policy.drawdown != null ? `${policy.drawdown}%` : "—"} />
            <Row label="Frequency" value={policy.frequency || "—"} />
            <Row label="Living Annuity Salary" value={fmtBWP(policy.livingAnnuity)} />
            <Row label="Life Annuity Salary" value={fmtBWP(policy.monthlyLifeAnnuity)} />
            <Row label="Payment Day" value={<span className="text-muted-foreground italic">Not set</span>} />
          </SectionCard>

          {/* Documents */}
          <SectionCard icon={FileText} title="Documents" pending={!policy.documentsUploaded}>
            <p className="text-sm text-muted-foreground">
              Required: Identity, Proof of Address, Tax Documentation, Signed Application,
              Beneficiary Confirmation.
            </p>
            <p className="text-xs text-muted-foreground mt-3 italic">
              No documents uploaded yet. Document upload will be available in the next phase.
            </p>
          </SectionCard>

          {/* Beneficiaries */}
          <SectionCard icon={Users} title="Beneficiaries" pending={!policy.beneficiariesCaptured}>
            <p className="text-sm text-muted-foreground">
              Capture beneficiary names, allocation percentages, and benefit options. Total
              allocation must equal 100%.
            </p>
            <p className="text-xs text-muted-foreground mt-3 italic">
              No beneficiaries captured yet.
            </p>
          </SectionCard>

          {/* Investment Portfolio */}
          <SectionCard icon={Briefcase} title="Investment Portfolio" pending={!policy.portfolioAllocated}>
            <p className="text-sm text-muted-foreground">
              Select asset managers and investment funds. Allocation across funds must equal 100%.
            </p>
            <p className="text-xs text-muted-foreground mt-3 italic">
              Portfolio not allocated yet.
            </p>
          </SectionCard>
        </div>
      )}

      {policy && (
        <Card className="rounded-3xl border-0 shadow-sm bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <CardContent className="p-6 flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Policy is pending verification</p>
              <p className="text-sm text-muted-foreground mt-1">
                Documents, beneficiaries, and investment portfolio still need to be captured before
                this policy can be activated.
              </p>
            </div>
            <Button disabled className="rounded-full">Activate Policy</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
