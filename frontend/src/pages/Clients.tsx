import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Users, FileText } from "lucide-react"
import { listClients, CRMClient } from "@/lib/clientStore"
import { toTitleCase } from "@/lib/quoteUtils"

export default function Clients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<CRMClient[]>([])
  const [query, setQuery] = useState("")

  useEffect(() => {
    setClients(listClients())
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.idNumber?.toLowerCase().includes(q),
    )
  }, [clients, query])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Annuity policyholders converted from approved quotes.
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 rounded-full"
          />
        </div>
      </div>

      <Card className="rounded-3xl border-0 shadow-sm">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center px-6">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-heading text-lg font-semibold mb-1">No clients yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Convert an approved annuity quote into a policy to add the policyholder here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-200 dark:bg-slate-700 text-left">
                  <tr>
                    <th className="px-6 py-3 font-semibold rounded-l-xl">Client</th>
                    <th className="px-6 py-3 font-semibold">ID Number</th>
                    <th className="px-6 py-3 font-semibold">Contact</th>
                    <th className="px-6 py-3 font-semibold">Policies</th>
                    <th className="px-6 py-3 font-semibold rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const latest = c.policies[0]
                    return (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/clients/${c.id}`)}
                        className="border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium">{toTitleCase(c.fullName)}</div>
                          <div className="text-xs text-muted-foreground">{c.email || "—"}</div>
                        </td>
                        <td className="px-6 py-4">{c.idNumber || "—"}</td>
                        <td className="px-6 py-4">{c.contactNumber || "—"}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            {c.policies.length}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {latest ? (
                            <Badge
                              variant="outline"
                              className="whitespace-nowrap rounded-full bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                            >
                              {latest.status}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
