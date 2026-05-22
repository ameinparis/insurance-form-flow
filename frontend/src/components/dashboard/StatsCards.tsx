import { useMemo } from "react"
import { FileText, Users, TrendingUp, Calendar, ArrowUp, ArrowDown } from "lucide-react"
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
  "#009fe3",  // Cyan
  "#a855f7",  // Purple
  "#10b981",  // Emerald
  "#f59e0b",  // Amber
  "#ef4444",  // Red
  "#ec4899",  // Pink
]

// Glass card accent styles — soft tinted glows behind frosted panels
const CARD_STYLES = [
  { iconBg: "bg-[#009fe3]/15", iconColor: "text-[#009fe3]", glow: "bg-cyan-200/40 dark:bg-cyan-500/20" },
  { iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400", glow: "bg-emerald-200/40 dark:bg-emerald-500/20" },
  { iconBg: "bg-violet-500/15", iconColor: "text-violet-600 dark:text-violet-400", glow: "bg-violet-200/40 dark:bg-violet-500/20" },
  { iconBg: "bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400", glow: "bg-amber-200/40 dark:bg-amber-500/20" },
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
    const quotesThisMonth = quotes.filter(
      q => new Date(q.createdAt) >= startOfMonth
    ).length
    
    // This week (last 7 days)
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - 7)
    const quotesThisWeek = quotes.filter(
      q => new Date(q.createdAt) >= startOfWeek
    ).length
    
    // Last week (7-14 days ago) for comparison
    const startOfLastWeek = new Date()
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 14)
    const quotesLastWeek = quotes.filter(
      q => {
        const date = new Date(q.createdAt)
        return date >= startOfLastWeek && date < startOfWeek
      }
    ).length

    // Calculate week-over-week changes
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    // For total quotes/clients, compare this week's additions vs last week
    const quotesAddedThisWeek = quotes.filter(q => new Date(q.createdAt) >= startOfWeek).length
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
    
    const pieData = Object.entries(typeGroups).map(([name, value]) => ({
      name,
      value,
    }))
    
    return {
      totalQuotes,
      totalClients,
      quotesThisMonth,
      quotesThisWeek,
      pieData,
      changes: {
        quotes: calcChange(quotesAddedThisWeek, quotesAddedLastWeek),
        clients: calcChange(clientsThisWeek, clientsLastWeek),
        month: calcChange(quotesThisMonth, quotesLastWeek),
        week: calcChange(quotesThisWeek, quotesLastWeek),
      }
    }
  }, [quotes])

  const handlePieClick = (data: { name: string }) => {
    if (onTypeFilter) {
      onTypeFilter(activeFilter === data.name ? null : data.name)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 p-6 rounded-[2rem] shadow-xl shadow-slate-200/30 animate-pulse h-32" />
          ))}
        </div>
        <div className="lg:col-span-3 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] shadow-xl shadow-slate-200/30 animate-pulse h-full min-h-[280px]" />
      </div>
    )
  }

  const statCards = [
    { 
      title: "Total Quotes", 
      subtitle: "All time",
      value: stats.totalQuotes, 
      icon: FileText,
      change: stats.changes.quotes,
      style: CARD_STYLES[0]
    },
    { 
      title: "Total Clients", 
      subtitle: "Unique clients",
      value: stats.totalClients, 
      icon: Users,
      change: stats.changes.clients,
      style: CARD_STYLES[1]
    },
    { 
      title: "This Month", 
      subtitle: "Quotes created",
      value: stats.quotesThisMonth, 
      icon: Calendar,
      change: stats.changes.month,
      style: CARD_STYLES[2]
    },
    { 
      title: "This Week", 
      subtitle: "Recent activity",
      value: stats.quotesThisWeek, 
      icon: TrendingUp,
      change: stats.changes.week,
      style: CARD_STYLES[3]
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
      {/* Left side - 2x2 Stats Grid */}
      <div className="lg:col-span-2 grid grid-cols-2 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="relative overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 p-5 rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-black/20 transition-all hover:-translate-y-0.5"
          >
            <div className={`absolute -right-4 -top-4 w-24 h-24 ${card.style.glow} rounded-full blur-3xl`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-2xl ${card.style.iconBg}`}>
                  <card.icon className={`h-5 w-5 ${card.style.iconColor}`} />
                </div>
                <div className="flex items-center gap-1">
                  {card.change >= 0 ? (
                    <ArrowUp className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-rose-500" />
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full tracking-wide ${card.change >= 0 ? 'text-emerald-600 bg-emerald-50/60 dark:bg-emerald-500/10' : 'text-rose-600 bg-rose-50/60 dark:bg-rose-500/10'}`}>
                    {card.change >= 0 ? '+' : ''}{card.change}%
                  </span>
                </div>
              </div>
              <p className="text-sm font-semibold text-[#1B405B]/70 dark:text-[#DFF3EB]/60 tracking-wide mb-1">{card.title}</p>
              <p className="font-heading text-3xl font-extrabold text-[#163144] dark:text-[#DFF3EB] tracking-tight">{card.value}</p>
              <p className="text-xs text-[#1B405B]/60 dark:text-[#DFF3EB]/50 mt-1 tracking-wide">{card.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Right side - Pie Chart */}
      <div className="lg:col-span-3 relative overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-black/20 p-6 flex flex-col">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-200/30 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative mb-2">
          <h3 className="font-heading text-xl font-bold text-[#163144] dark:text-[#DFF3EB] tracking-tight">Quotes by Type</h3>
          <p className="text-sm text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide mt-0.5">Track quotes by type easily</p>
        </div>
        {stats.pieData.length > 0 ? (
          <div className="flex-1 grid grid-cols-[1fr_auto] gap-6 items-center min-h-[220px]">
            {/* Chart with diagonal stripe pattern */}
            <div className="relative h-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {COLORS.map((color, i) => (
                      <pattern
                        key={i}
                        id={`stripe-${i}`}
                        patternUnits="userSpaceOnUse"
                        width="8"
                        height="8"
                        patternTransform="rotate(45)"
                      >
                        <rect width="8" height="8" fill={color} fillOpacity="0.08" />
                        <line x1="0" y1="0" x2="0" y2="8" stroke={color} strokeWidth="3.5" />
                      </pattern>
                    ))}
                  </defs>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    onClick={(_, index) => handlePieClick(stats.pieData[index])}
                    style={{ cursor: 'pointer' }}
                  >
                    {stats.pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#stripe-${index % COLORS.length})`}
                        opacity={activeFilter && activeFilter !== stats.pieData[index].name ? 0.35 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number, name: string) => [`${value} quotes`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="font-heading text-3xl font-extrabold text-[#163144] dark:text-[#DFF3EB] tracking-tight">{stats.totalQuotes}</p>
                <p className="text-xs text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide">
                  {activeFilter ? activeFilter : 'Total'}
                </p>
              </div>
            </div>

            {/* Legend on the right with percentages */}
            <div className="flex flex-col gap-3 min-w-[120px]">
              {stats.pieData.map((entry, index) => {
                const pct = Math.round((entry.value / stats.totalQuotes) * 100)
                const isActive = activeFilter === entry.name
                const isDimmed = activeFilter && !isActive
                return (
                  <button
                    key={entry.name}
                    onClick={() => handlePieClick(entry)}
                    className={`flex items-center gap-2.5 text-left transition-opacity ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-medium text-[#1B405B]/80 dark:text-[#DFF3EB]/70 tracking-wide">{entry.name}</span>
                      <span className="text-base font-bold text-[#163144] dark:text-[#DFF3EB] tracking-tight">{pct}%</span>
                    </div>
                  </button>
                )
              })}
              {activeFilter && (
                <button
                  onClick={() => onTypeFilter?.(null)}
                  className="text-xs text-muted-foreground hover:text-foreground underline text-left mt-1"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            No data available
          </div>
        )}
      </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              No data available
            </div>
          )}
      </div>
    </div>
  )
}
