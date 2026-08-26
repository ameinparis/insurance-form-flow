import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { FilePlus2, Send, CheckCircle2, XCircle, Inbox } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toTitleCase } from "@/lib/quoteUtils"
import { usePolicyDrafts, type PolicyDraft } from "@/hooks/usePolicyDrafts"
import { useAuth } from "@/lib/authlibrary"

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

type Item = {
  key: string
  at: string
  label: React.ReactNode
  tag: string
  icon: typeof FilePlus2
  tone: string
  onClick: () => void
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
  const { drafts } = usePolicyDrafts()
  const { userId } = useAuth()

  const items = useMemo<Item[]>(() => {
    const me = String(userId || "")
    const name = (d: PolicyDraft) =>
      toTitleCase(d.form?.fullName || d.form?.clientName || "Unnamed policyholder")
    const open = (d: PolicyDraft) => () => navigate(`/policies/drafts/${d.id}`)

    const conversionEvents: Item[] = []
    drafts.forEach((d) => {
      const mine = String(d.initiatedBy || "") === me
      const assigned = String(d.assignedTo || "") === me

      if (d.submittedAt && (mine || assigned)) {
        conversionEvents.push({
          key: `${d.id}-submitted-${d.submittedAt}`,
          at: d.submittedAt,
          icon: mine ? Send : Inbox,
          tone: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
          tag: "Submitted",
          onClick: open(d),
          label: mine ? (
            <>
              You sent <span className="font-bold text-slate-900 dark:text-white">{name(d)}</span> for
              approval{d.assignedToName ? ` to ${d.assignedToName}` : ""}
            </>
          ) : (
            <>
              <span className="font-bold text-slate-900 dark:text-white">{name(d)}</span> was submitted
              for your approval{d.initiatedByName ? ` by ${d.initiatedByName}` : ""}
            </>
          ),
        })
      }

      if (d.approvedAt && (mine || assigned || String(d.approvedBy || "") === me)) {
        conversionEvents.push({
          key: `${d.id}-approved-${d.approvedAt}`,
          at: d.approvedAt,
          icon: CheckCircle2,
          tone: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
          tag: "Approved",
          onClick: open(d),
          label: (
            <>
              <span className="font-bold text-slate-900 dark:text-white">{name(d)}</span> was approved
              {d.approvedByName ? ` by ${d.approvedByName}` : ""}
            </>
          ),
        })
      }

      if (d.rejectedAt && (mine || assigned || String(d.rejectedBy || "") === me)) {
        conversionEvents.push({
          key: `${d.id}-rejected-${d.rejectedAt}`,
          at: d.rejectedAt,
          icon: XCircle,
          tone: "bg-red-500/15 text-red-600 dark:text-red-400",
          tag: "Returned",
          onClick: open(d),
          label: (
            <>
              <span className="font-bold text-slate-900 dark:text-white">{name(d)}</span> was returned
              {d.rejectedByName ? ` by ${d.rejectedByName}` : ""}
            </>
          ),
        })
      }
    })

    const quoteEvents: Item[] = quotes.map((quote) => ({
      key: `q-${quote.id}`,
      at: quote.createdAt,
      icon: FilePlus2,
      tone: "bg-blue-500/15 text-blue-500 dark:text-blue-400",
      tag: quote.type || "Quote",
      onClick: () => navigate(`/quotes/${quote.id}?legacy=${quote.isLegacy || false}`),
      label: (
        <>
          Quote Created for{" "}
          <span className="font-bold text-slate-900 dark:text-white">
            {toTitleCase(quote.clientName || quote.fullName || quote.schemeName || "Unnamed")}
          </span>
        </>
      ),
    }))

    return [...conversionEvents, ...quoteEvents]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, limit)
  }, [quotes, drafts, userId, limit, navigate])

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-start justify-between gap-4 p-6 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Recent Activity</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Latest important actions across quotes, conversions, approvals and clients
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
            {items.map((item) => (
              <button
                key={item.key}
                onClick={item.onClick}
                className="w-full flex items-center gap-4 py-4 text-left group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.tone}`}>
                  <item.icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{item.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatWhen(item.at)}</p>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 whitespace-nowrap"
                >
                  {item.tag}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
