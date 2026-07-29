import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { FilePlus2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toTitleCase } from "@/lib/quoteUtils"

interface ActivityQuote {
  id: string
  quoteId?: string
  type?: string
  clientName?: string
  fullName?: string
  schemeName?: string
  createdAt: string
  isLegacy?: boolean
}

interface RecentActivityProps {
  quotes: ActivityQuote[]
  loading: boolean
  limit?: number
}

const formatWhen = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  const now = new Date()
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const sameDay = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay) return `Today at ${time}`
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday at ${time}`
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} at ${time}`
}

export const RecentActivity = ({ quotes, loading, limit = 6 }: RecentActivityProps) => {
  const navigate = useNavigate()

  const items = useMemo(
    () =>
      [...quotes]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit),
    [quotes, limit]
  )

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-start justify-between gap-4 p-6 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Recent Activity</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Latest important actions across quotes, clients, policies, documents, and servicing
          </p>
        </div>
        <button
          onClick={() => navigate("/quotes")}
          className="text-sm font-semibold text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap"
        >
          View All
        </button>
      </div>

      <div className="px-6 pb-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-700/40 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            No activity yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {items.map((quote) => (
              <button
                key={quote.id}
                onClick={() => navigate(`/quotes/${quote.id}?legacy=${quote.isLegacy || false}`)}
                className="w-full flex items-center gap-4 py-4 text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/15 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FilePlus2 className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                    Quote Created for{" "}
                    <span className="font-bold text-slate-900 dark:text-white">
                      {toTitleCase(quote.clientName || quote.fullName || quote.schemeName || "Unnamed")}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formatWhen(quote.createdAt)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 whitespace-nowrap"
                >
                  {quote.type || "Quote"}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
