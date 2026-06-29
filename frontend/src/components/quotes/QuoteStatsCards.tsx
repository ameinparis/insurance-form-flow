import { useMemo } from "react"
import { FileText, FileEdit, Clock, CheckCircle2, XCircle, Calendar, TrendingUp } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { InfoTooltip } from "@/components/ui/info-tooltip"

interface Quote {
  id: string
  type?: string
  status?: string
  createdAt: string
}

interface QuoteStatsCardsProps {
  quotes: Quote[]
  loading: boolean
  onTypeFilter?: (type: string | null) => void
  activeFilter?: string | null
}

const COLORS = ["#009fe3", "#a855f7", "#10b981", "#f59e0b", "#ef4444", "#ec4899"]

const ICON_STYLES = [
  { grad: "bg-[radial-gradient(circle_at_30%_25%,#a5d8ff_0%,#4dabf7_45%,#1c7ed6_100%)]", shadow: "shadow-[0_8px_20px_-6px_rgba(28,126,214,0.55)]" },
  { grad: "bg-[radial-gradient(circle_at_30%_25%,#cbd5e1_0%,#94a3b8_45%,#475569_100%)]", shadow: "shadow-[0_8px_20px_-6px_rgba(71,85,105,0.5)]" },
  { grad: "bg-[radial-gradient(circle_at_30%_25%,#fde68a_0%,#fbbf24_45%,#d97706_100%)]", shadow: "shadow-[0_8px_20px_-6px_rgba(217,119,6,0.5)]" },
  { grad: "bg-[radial-gradient(circle_at_30%_25%,#b2f2bb_0%,#51cf66_45%,#2f9e44_100%)]", shadow: "shadow-[0_8px_20px_-6px_rgba(47,158,68,0.5)]" },
  { grad: "bg-[radial-gradient(circle_at_30%_25%,#fecaca_0%,#f87171_45%,#b91c1c_100%)]", shadow: "shadow-[0_8px_20px_-6px_rgba(185,28,28,0.5)]" },
  { grad: "bg-[radial-gradient(circle_at_30%_25%,#e599f7_0%,#cc5de8_45%,#9c36b5_100%)]", shadow: "shadow-[0_8px_20px_-6px_rgba(156,54,181,0.55)]" },
  { grad: "bg-[radial-gradient(circle_at_30%_25%,#ffc9a8_0%,#ff8a65_45%,#e8542b_100%)]", shadow: "shadow-[0_8px_20px_-6px_rgba(232,84,43,0.55)]" },
]

const normalizeStatus = (s?: string) => (s || "draft").toLowerCase()

export const QuoteStatsCards = ({ quotes, loading, onTypeFilter, activeFilter }: QuoteStatsCardsProps) => {
  const stats = useMemo(() => {
    const total = quotes.length
    const byStatus = (status: string) =>
      quotes.filter(q => normalizeStatus(q.status) === status).length

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - 7)

    const thisMonth = quotes.filter(q => new Date(q.createdAt) >= startOfMonth).length
    const thisWeek = quotes.filter(q => new Date(q.createdAt) >= startOfWeek).length

    const typeGroups: Record<string, number> = {}
    quotes.forEach(q => {
      const t = q.type || "Unknown"
      typeGroups[t] = (typeGroups[t] || 0) + 1
    })
    const pieData = Object.entries(typeGroups).map(([name, value]) => ({ name, value }))

    return {
      total,
      draft: byStatus("draft"),
      pending: byStatus("pending"),
      converted: byStatus("converted"),
      rejected: byStatus("rejected"),
      thisMonth,
      thisWeek,
      pieData,
    }
  }, [quotes])

  const handlePieClick = (data: { name: string }) => {
    if (onTypeFilter) onTypeFilter(activeFilter === data.name ? null : data.name)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 p-5 rounded-[2rem] shadow-xl shadow-slate-200/30 animate-pulse h-28" />
          ))}
        </div>
        <div className="lg:col-span-2 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] shadow-xl shadow-slate-200/30 animate-pulse h-full min-h-[280px]" />
      </div>
    )
  }

  const tiles = [
    { title: "Total Quotations", value: stats.total, icon: FileText, info: "All quotations created in the system.", style: ICON_STYLES[0] },
    { title: "Draft", value: stats.draft, icon: FileEdit, info: "Quotes started but not yet submitted for review.", style: ICON_STYLES[1] },
    { title: "Pending", value: stats.pending, icon: Clock, info: "Quotes awaiting client decision or internal review.", style: ICON_STYLES[2] },
    { title: "Converted", value: stats.converted, icon: CheckCircle2, info: "Quotes accepted/approved and moved into the client or policy onboarding process.", style: ICON_STYLES[3] },
    { title: "Rejected", value: stats.rejected, icon: XCircle, info: "Quotes that were declined or withdrawn.", style: ICON_STYLES[4] },
    { title: "This Month", value: stats.thisMonth, icon: Calendar, info: "Quotations created during the current month.", style: ICON_STYLES[5] },
    { title: "This Week", value: stats.thisWeek, icon: TrendingUp, info: "Quotations created in the last 7 days.", style: ICON_STYLES[6] },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
      <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4 content-start">
        {tiles.map((card, i) => (
          <div
            key={i}
            className="group relative overflow-hidden bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 p-4 rounded-[1.75rem] shadow-xl shadow-slate-200/40 dark:shadow-black/20 transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`relative w-9 h-9 rounded-full ${card.style.grad} ${card.style.shadow} flex items-center justify-center shrink-0`}>
                <div className="absolute top-1 left-1.5 w-2 h-1.5 rounded-full bg-white/50 blur-[1px]" />
                <card.icon className="h-4 w-4 text-white relative z-10" strokeWidth={2.25} />
              </div>
              <p className="text-xs font-semibold text-[#163144] dark:text-[#DFF3EB] tracking-wide truncate flex items-center gap-1">
                {card.title}
                <InfoTooltip text={card.info} />
              </p>
            </div>
            <p className="font-heading text-3xl font-extrabold text-[#163144] dark:text-[#DFF3EB] tracking-tight mt-3">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="lg:col-span-2 relative overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-black/20 p-6 flex flex-col">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-200/30 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative mb-2 flex items-center gap-2">
          <h3 className="font-heading text-lg font-bold text-[#163144] dark:text-[#DFF3EB] tracking-tight">Quotations by Type</h3>
          <InfoTooltip text="Distribution of quotations across product types." />
        </div>
        {stats.pieData.length > 0 ? (
          <div className="flex-1 grid grid-cols-[1fr_auto] gap-4 items-center min-h-[220px]">
            <div className="relative h-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {COLORS.map((color, i) => (
                      <pattern key={i} id={`qstripe-${i}`} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                        <rect width="8" height="8" fill={color} fillOpacity="0.08" />
                        <line x1="0" y1="0" x2="0" y2="8" stroke={color} strokeWidth="3.5" />
                      </pattern>
                    ))}
                  </defs>
                  <Pie
                    data={stats.pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                    paddingAngle={2} dataKey="value" stroke="none"
                    onClick={(_, index) => handlePieClick(stats.pieData[index])}
                    style={{ cursor: "pointer" }}
                  >
                    {stats.pieData.map((_, i) => (
                      <Cell key={i} fill={`url(#qstripe-${i % COLORS.length})`}
                        opacity={activeFilter && activeFilter !== stats.pieData[i].name ? 0.35 : 1} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [`${v} quotes`, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="font-heading text-2xl font-extrabold text-[#163144] dark:text-[#DFF3EB]">{stats.total}</p>
                <p className="text-[11px] text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide">{activeFilter || "Total"}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 min-w-[110px]">
              {stats.pieData.map((entry, i) => {
                const pct = Math.round((entry.value / stats.total) * 100)
                const dim = activeFilter && activeFilter !== entry.name
                return (
                  <button key={entry.name} onClick={() => handlePieClick(entry)}
                    className={`flex items-center gap-2 text-left transition-opacity ${dim ? "opacity-40" : ""}`}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <div className="flex flex-col leading-tight">
                      <span className="text-[11px] font-medium text-[#1B405B]/80 dark:text-[#DFF3EB]/70 tracking-wide">{entry.name}</span>
                      <span className="text-sm font-bold text-[#163144] dark:text-[#DFF3EB]">{pct}%</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">No data</div>
        )}
      </div>
    </div>
  )
}
