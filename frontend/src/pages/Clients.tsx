import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useClients } from "@/hooks/useClients"

/**
 * Client directory — sourced exclusively from GET /api/clients so each client
 * appears once, regardless of how many policies they hold.
 */
const Clients = () => {
  const [term, setTerm] = useState("")
  const { clients, loading, error } = useClients()
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) =>
      `${c.fullName} ${c.clientNumber || ""} ${c.email || ""} ${c.contactNumber || ""} ${c.idNumber || ""}`
        .toLowerCase()
        .includes(q),
    )
  }, [clients, term])

  return (
    <div className="relative min-h-full -m-6 bg-slate-50 dark:bg-slate-900">
      <div className="sticky top-0 z-30 px-6 pt-6 pb-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Clients</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Permanent customer records. One entry per client, with all of their policies.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search clients..."
              className="pl-11 h-11 rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {error && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-500/10 px-5 py-3 text-sm text-amber-700 dark:text-amber-400">
            {error}
          </div>
        )}

        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading clients…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 px-6">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-5">
                <Users className="h-7 w-7 text-slate-400 dark:text-slate-300" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {clients.length === 0 ? "No clients yet" : "No matching clients"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                Clients appear here once a policy conversion has been approved.
              </p>
              {clients.length === 0 && (
                <Button className="rounded-full mt-5" onClick={() => navigate("/conversions")}>
                  Go to Conversions
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filtered.map((client) => (
                <button
                  key={client._id}
                  onClick={() => navigate(`/clients/${client._id}`)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:underline">
                        {client.fullName}
                      </p>
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
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {[client.clientNumber, client.email, client.contactNumber].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[#009fe3] shrink-0">View</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Clients
