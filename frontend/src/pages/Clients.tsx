import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Users, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useClientDirectory } from "@/hooks/useClientDirectory"
import { usePolicyDrafts, draftStatus } from "@/hooks/usePolicyDrafts"
import { formatCurrency, formatDate } from "@/lib/quoteUtils"

const Clients = () => {
  const [term, setTerm] = useState("")
  const { clients, removeClient, addClient } = useClientDirectory()
  const { drafts } = usePolicyDrafts()

  const navigate = useNavigate()

  // Approved/active conversions are policies, not work in progress: make sure a client
  // record exists for each one (addClient de-dupes).
 useEffect(() => {
  drafts
    .filter((d) => {
      const s = String(draftStatus(d))

      return (
        s === "approved" ||
        s === "APPROVED" ||
        s === "ACTIVE" ||
        s === "active"
      )
    })
    .forEach((d) =>
      addClient({
        fullName: d.form?.fullName || d.form?.clientName || "Unnamed Client",
        email: d.form?.email,
        contactNumber: d.form?.contactNumber,
        idNumber: d.form?.idNumber,
        dateOfBirth: d.form?.dateOfBirth,
        productType: d.productType || d.form?.productName || "Policy",
        optionLabel: d.optionLabel,
        quoteId: d.quoteId,
        draftId: d.id,
        premium: d.premium,
      }),
    )
}, [drafts, addClient])

  // Clients open the same conversion review view used from Approvals.
  const openClient = (client: { draftId?: string; quoteId?: string; optionLabel?: string; fullName: string }) => {
    const approvedStatuses = new Set(["approved", "APPROVED", "ACTIVE", "active"])
    const match =
      (client.draftId && drafts.find((d) => d.id === client.draftId && approvedStatuses.has(draftStatus(d)))) ||
      drafts.find(
        (d) =>
          approvedStatuses.has(draftStatus(d)) &&
          (d.form?.fullName || "").toLowerCase() === client.fullName.toLowerCase() &&
          d.quoteId === client.quoteId &&
          d.optionLabel === client.optionLabel,
      )
    if (match) navigate(`/policies/drafts/${match.id}`)
    else toast.error("No policy record found for this client.")
  }

  // Approved conversions come from the shared store, so every user sees the same
  // client list; locally-stored clients without a conversion are appended.
  const directory = useMemo(() => {
    const fromDrafts = drafts
      .filter((d) => ["approved", "APPROVED", "ACTIVE", "active"].includes(String(draftStatus(d))))
      .map((d) => ({
        id: d.id,
        draftId: d.id,
        fullName: d.form?.fullName || d.form?.clientName || "Unnamed Client",
        email: d.form?.email,
        contactNumber: d.form?.contactNumber,
        productType: d.productType || d.form?.productName || "Policy",
        optionLabel: d.optionLabel,
        quoteId: d.quoteId,
        premium: d.premium,
        createdAt: d.approvedAt || d.updatedAt,
      }))
    const seen = new Set(fromDrafts.map((c) => c.draftId))
    const extras = clients.filter((c) => !c.draftId || !seen.has(c.draftId))
    return [...fromDrafts, ...extras].sort((a, b) =>
      (a.createdAt || "") < (b.createdAt || "") ? 1 : -1,
    )
  }, [drafts, clients])

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase()
    if (!q) return directory
    return directory.filter((c) =>
      `${c.fullName} ${c.email || ""} ${c.contactNumber || ""} ${c.quoteId || ""}`.toLowerCase().includes(q)
    )
  }, [directory, term])

  return (
    <div className="relative min-h-full -m-6 bg-slate-50 dark:bg-slate-900">
      <div className="sticky top-0 z-30 px-6 pt-6 pb-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Clients</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Annuity policyholders from approved conversions.
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
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-24 px-6">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-5">
                <Users className="h-7 w-7 text-slate-400 dark:text-slate-300" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {directory.length === 0 ? "No clients yet" : "No matching clients"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
                Clients appear here once a policy conversion has been approved.
              </p>
              {directory.length === 0 && (
                <Button className="rounded-full mt-5" onClick={() => navigate("/conversions")}>
                  Go to Conversions
                </Button>
              )}
            </div>

          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filtered.map((client) => (
                <div key={client.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <button
                    className="min-w-0 text-left group"
                    onClick={() => openClient(client)}
                  >
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:underline">{client.fullName}</p>
                      <Badge
                        variant="outline"
                        className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 whitespace-nowrap"
                      >
                        {client.productType}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {[client.optionLabel, client.email, client.contactNumber].filter(Boolean).join(" · ")}
                    </p>
                  </button>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {client.premium != null ? formatCurrency(client.premium) : "—"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(client.createdAt)}</p>
                    </div>
                    {!client.draftId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-slate-400 hover:text-red-500"
                        onClick={() => {
                          removeClient(client.id)
                          toast.success("Client removed.")
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Clients
