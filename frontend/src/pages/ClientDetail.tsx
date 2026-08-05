import { useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useClientDirectory } from "@/hooks/useClientDirectory"
import { formatCurrency } from "@/lib/quoteUtils"

const Pending = () => (
  <span className="text-slate-400 dark:text-slate-500 italic font-normal">Pending</span>
)

const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-[1.75rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-7">
    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">{title}</h3>
    {children}
  </div>
)

const Row = ({
  label,
  sub,
  value,
  accent,
}: {
  label: React.ReactNode
  sub?: string
  value: React.ReactNode
  accent?: boolean
}) => (
  <div className="flex items-start justify-between gap-4 py-3.5 border-b border-slate-100 dark:border-slate-700/60 last:border-0">
    <div className="min-w-0">
      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{label}</p>
      {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>}
    </div>
    <p
      className={`text-sm font-bold shrink-0 ${
        accent ? "text-sky-600 dark:text-sky-400" : "text-slate-900 dark:text-white"
      }`}
    >
      {value}
    </p>
  </div>
)

const ClientDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { clients } = useClientDirectory()

  const client = useMemo(() => clients.find((c) => c.id === id), [clients, id])

  const initials = (client?.fullName || "New Client")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("")

  return (
    <div className="relative min-h-full -m-6 bg-slate-50 dark:bg-slate-900">
      <div className="sticky top-0 z-30 px-6 pt-6 pb-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <Button variant="ghost" className="rounded-full -ml-2" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-4 w-4" /> Back to Clients
        </Button>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Header card */}
        <div className="rounded-[1.75rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-8">
          <div className="flex flex-wrap items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-[#0b4f71] text-white flex items-center justify-center text-3xl font-bold shrink-0">
              {initials || "—"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {client?.fullName || "Unnamed Client"}
                </h2>
                <Badge className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border-0 px-3 py-1 text-xs font-bold whitespace-nowrap">
                  Info Pending
                </Badge>
                <Badge className="rounded-full bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400 border-0 px-3 py-1 text-xs font-bold whitespace-nowrap">
                  {client?.quoteId ? `Quote ${client.quoteId}` : "No quote linked"}
                </Badge>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                {[client?.contactNumber, client?.email].filter(Boolean).join(" · ") || "Contact details pending"}
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-7">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lifetime Value</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {client?.premium != null ? formatCurrency(client.premium) : <Pending />}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tenure</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    <Pending />
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Products</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">1 active</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Risk Score</p>
                  <p className="text-xl font-bold text-sky-600 dark:text-sky-400 mt-1">
                    <Pending />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid of panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Panel title="Active Policies">
            <Row
              label={client?.optionLabel || client?.productType || "Annuity Policy"}
              sub="Sum assured: Pending"
              value={
                <span className="rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 px-3 py-1 text-xs font-bold">
                  Active
                </span>
              }
            />
            <Row label="Additional cover" sub="Awaiting onboarding" value={<Pending />} />
          </Panel>

          <Panel title="Pension Products">
            <Row label={client?.productType || "Annuity"} value={client?.premium != null ? formatCurrency(client.premium) : <Pending />} />
            <Row label="Group Pension" value={<Pending />} />
            <Row label="Projected payout @ 65" value={<Pending />} />
          </Panel>

          <Panel title="Beneficiaries">
            <Row label="Beneficiary 1" sub="Relationship pending" value={<Pending />} accent />
            <Row label="Beneficiary 2" sub="Relationship pending" value={<Pending />} accent />
            <Row label="Beneficiary 3" sub="Relationship pending" value={<Pending />} accent />
          </Panel>

          <Panel title="Claims History">
            <p className="text-sm text-slate-500 dark:text-slate-400">No claims recorded yet.</p>
          </Panel>

          <Panel title="Premium Payment Status">
            <Row label="Next due" value={<Pending />} />
            <Row label="Monthly premium" value={client?.premium != null ? formatCurrency(client.premium) : <Pending />} />
            <Row label="Payment method" value={<Pending />} />
          </Panel>

          <Panel title="Documents">
            {["ID Copy.pdf", "Policy Schedule.pdf", "Signed Quotation.pdf"].map((doc) => (
              <div
                key={doc}
                className="flex items-center justify-between gap-4 py-3.5 border-b border-slate-100 dark:border-slate-700/60 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{doc}</p>
                </div>
                <span className="text-sm font-bold text-slate-400 dark:text-slate-500 shrink-0">Pending</span>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  )
}

export default ClientDetail
