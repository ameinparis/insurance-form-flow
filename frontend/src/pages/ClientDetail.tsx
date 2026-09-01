import { useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useClient } from "@/hooks/useClients"
import PolicyRecordView from "@/components/client/PolicyRecordView"
import { formatCurrency, formatDate } from "@/lib/quoteUtils"

/**
 * Permanent client record: identity comes from GET /api/clients/:id and the
 * policy list from GET /api/clients/:id/policies. No conversion workflow here.
 */
const ClientDetail = () => {
  const { id, policyId } = useParams()
  const navigate = useNavigate()
  const { client, policies, loading, error } = useClient(id)

  const selected = useMemo(() => {
    if (policyId) return policies.find((p) => p.id === policyId) || null
    return policies.length === 1 ? policies[0] : null
  }, [policies, policyId])

  if (loading || !client) {
    return (
      <div className="relative min-h-full -m-6 bg-slate-50 dark:bg-slate-900 p-6">
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-10 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {loading ? "Loading client…" : error || "This client no longer exists."}
          </p>
          <Button className="rounded-full mt-5" onClick={() => navigate("/clients")}>
            Back to Clients
          </Button>
        </div>
      </div>
    )
  }

  const details = [
    { label: "Full Name", value: client.fullName },
    { label: "Client Number", value: client.clientNumber },
    { label: "ID Number", value: client.idNumber },
    { label: "Date of Birth", value: client.dateOfBirth },
    { label: "Email Address", value: client.email },
    { label: "Contact Number", value: client.contactNumber },
    { label: "Status", value: client.status || "ACTIVE" },
    { label: "Client Since", value: client.createdAt ? formatDate(client.createdAt) : "" },
  ]

  return (
    <div className="relative min-h-full -m-6 bg-slate-50 dark:bg-slate-900">
      <div className="sticky top-0 z-30 px-6 pt-6 pb-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => navigate(policyId ? `/clients/${client._id}` : "/clients")}
          className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          {policyId ? `Back to ${client.fullName}` : "Back to Clients"}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {client.fullName}
              </h2>
              <Badge
                variant="outline"
                className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${
                  (client.status || "ACTIVE") === "ACTIVE"
                    ? "border-emerald-300 text-emerald-600 dark:text-emerald-400"
                    : "border-slate-300 text-slate-500 dark:text-slate-400"
                }`}
              >
                {client.status || "ACTIVE"}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Client {client.clientNumber}
              {policyId && selected ? ` · Policy ${selected.form?.policyNumber || selected.id}` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {!policyId && (
          <div className="rounded-[1.75rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-7">
            <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-5">
              Client Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-1">
              {details.map((item) => (
                <div key={item.label} className="py-2.5 border-b border-slate-100 dark:border-slate-700/60">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {item.label}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 truncate">
                    {item.value || "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zero policies */}
        {policies.length === 0 && (
          <div className="rounded-[1.75rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No policies are currently linked to this client.
            </p>
          </div>
        )}

        {/* Many policies — list first, unless one is selected */}
        {policies.length > 1 && !selected && (
          <div className="rounded-[1.75rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-7 py-5 border-b border-slate-100 dark:border-slate-700/60">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Policies ({policies.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {policies.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/clients/${client._id}/policies/${p.id}`)}
                  className="w-full flex flex-wrap items-center justify-between gap-4 px-7 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:underline">
                        {p.form?.policyNumber || p.id}
                      </p>
                      <Badge
                        variant="outline"
                        className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap border-emerald-300 text-emerald-600 dark:text-emerald-400"
                      >
                        {p.status || "APPROVED"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {[p.productType, p.optionLabel, p.form?.policyStartDate].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {p.premium != null ? formatCurrency(p.premium) : "—"}
                    </p>
                    <span className="text-xs font-semibold text-[#009fe3]">View Policy</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Single policy, or an explicitly selected one */}
        {selected && <PolicyRecordView policy={selected} />}

        {policyId && !selected && policies.length > 0 && (
          <div className="rounded-[1.75rem] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              That policy is not linked to this client.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientDetail
