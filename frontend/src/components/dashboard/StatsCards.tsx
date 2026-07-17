import { useMemo } from "react"
import { FileText, Users, TrendingUp, Calendar, ArrowUpRight } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface Quote {
  id: string
  type?: string
  clientName?: string
  fullName?: string
  createdAt: string
}

interface StatsCardsProps {
  quotes: Quote[]
  loading: boolean
  onTypeFilter?: (type: string | null) => void
  activeFilter?: string | null
}

const COLORS = [
  "#3b82f6", // blue
  "#a855f7", // purple
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
]

// Flat, soft-tinted icon badge styles (no gradients / glow)
const CARD_STYLES = [
  { badge: "bg-blue-500/15 text-blue-500 dark:text-blue-400" },
  { badge: "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400" },
  { badge: "bg-purple-500/15 text-purple-500 dark:text-purple-400" },
  { badge: "bg-orange-500/15 text-orange-500 dark:text-orange-400" },
]

export const StatsCards = ({ quotes, loading, onTypeFilter, activeFilter }: StatsCardsProps) => {
  const stats = useMemo(() => {
    const totalQuotes = quotes.length

    const uniqueClients = new Set(
      quotes.map(q => (q.clientName || q.fullName || "").toLowerCase()).filter(Boolean)
    )
    const totalClients = uniqueClients.size

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const quotesThisMonth = quotes.filter(q => new Date(q.createdAt) >= startOfMonth).length

    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - 7)
    const quotesThisWeek = quotes.filter(q => new Date(q.createdAt) >= startOfWeek).length

    const startOfLastWeek = new Date()
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 14)

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const quotesAddedThisWeek = quotesThisWeek
    const quotesAddedLastWeek = quotes.filter(q => {
      const date = new Date(q.createdAt)
      return date >= startOfLastWeek && date < startOfWeek
    }).length

    const clientsThisWeek = new Set(
      quotes.filter(q => new Date(q.createdAt) >= startOfWeek)
        .map(q => (q.clientName || q.fullName || "").toLowerCase())
        .filter(Boolean)
    ).size
    const clientsLastWeek = new Set(
      quotes.filter(q => {
        const date = new Date(q.createdAt)
        return date >= startOfLastWeek && date < startOfWeek
      }).map(q => (q.clientName || q.fullName || "").toLowerCase()).filter(Boolean)
    ).size

    const typeGroups: Record<string, number> = {}
    quotes.forEach(q => {
      const type = q.type || "Unknown"
      typeGroups[type] = (typeGroups[type] || 0) + 1
    })

    const pieData = Object.entries(typeGroups).map(([name, value]) => ({ name, value }))

    return {
      totalQuotes,
      totalClients,
      quotesThisMonth,
      quotesThisWeek,
      pieData,
      changes: {
        quotes: calcChange(quotesAddedThisWeek, quotesAddedLastWeek),
        clients: calcChange(clientsThisWeek, clientsLastWeek),
        month: calcChange(quotesThisMonth, quotesAddedLastWeek),
        week: calcChange(quotesThisWeek, quotesAddedLastWeek),
      },
    }
  }, [quotes])

  const handlePieClick = (data: { name: string }) => {
    if (onTypeFilter) onTypeFilter(activeFilter === data.name ? null : data.name)
  }

  const cardBase =
    "rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`${cardBase} p-6 animate-pulse h-36`} />
          ))}
        </div>
        <div className={`lg:col-span-3 ${cardBase} animate-pulse min-h-[280px]`} />
      </div>
    )
  }

  const statCards = [
    { title: "Total Quotes", subtitle: "All time", value: stats.totalQuotes, icon: FileText, change: stats.changes.quotes, style: CARD_STYLES[0] },
    { title: "Total Clients", subtitle: "Unique clients", value: stats.totalClients, icon: Users, change: stats.changes.clients, style: CARD_STYLES[1] },
    { title: "This Month", subtitle: "Quotes created", value: stats.quotesThisMonth, icon: Calendar, change: stats.changes.month, style: CARD_STYLES[2] },
    { title: "This Week", subtitle: "Recent activity", value: stats.quotesThisWeek, icon: TrendingUp, change: stats.changes.week, style: CARD_STYLES[3] },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
      {/* Stat cards */}
      <div className="lg:col-span-2 grid grid-cols-2 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`group ${cardBase} p-6 transition-all hover:border-slate-300 dark:hover:border-slate-600`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${card.style.badge}`}>
                <card.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors group-hover:border-slate-400 dark:group-hover:border-slate-500">
                <ArrowUpRight className="h-4 w-4 text-slate-500 dark:text-slate-400" strokeWidth={2} />
              </div>
            </div>

            <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-normal leading-snug">
              {card.title}
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {card.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Pie chart */}
      <div className={`lg:col-span-3 ${cardBase} p-6 flex flex-col`}>
        <div className="mb-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Quotes by Type</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track quotes by type easily</p>
        </div>
        {stats.pieData.length > 0 ? (
          <div className="flex-1 grid grid-cols-[1fr_auto] gap-6 items-center min-h-[220px]">
            <div className="relative h-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    onClick={(_, index) => handlePieClick(stats.pieData[index])}
                    style={{ cursor: "pointer" }}
                  >
                    {stats.pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        opacity={activeFilter && activeFilter !== stats.pieData[index].name ? 0.3 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number, name: string) => [`${value} quotes`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{stats.totalQuotes}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeFilter ? activeFilter : "Total"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-[120px]">
              {stats.pieData.map((entry, index) => {
                const pct = Math.round((entry.value / stats.totalQuotes) * 100)
                const isActive = activeFilter === entry.name
                const isDimmed = activeFilter && !isActive
                return (
                  <button
                    key={entry.name}
                    onClick={() => handlePieClick(entry)}
                    className={`flex items-center gap-2.5 text-left transition-opacity ${isDimmed ? "opacity-40" : "opacity-100"}`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{entry.name}</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">{pct}%</span>
                    </div>
                  </button>
                )
              })}
              {activeFilter && (
                <button
                  onClick={() => onTypeFilter?.(null)}
                  className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline text-left mt-1"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center min-h-[220px]">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
