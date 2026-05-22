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
  "#009fe3",  // Cyan
  "#a855f7",  // Purple
  "#10b981",  // Emerald
  "#f59e0b",  // Amber
  "#ef4444",  // Red
  "#ec4899",  // Pink
]

// Gradient blob icon styles — soft-3D glossy spheres like the reference
const CARD_STYLES = [
  {
    iconGradient: "bg-[radial-gradient(circle_at_30%_25%,#a5d8ff_0%,#4dabf7_45%,#1c7ed6_100%)]",
    shadow: "shadow-[0_8px_20px_-6px_rgba(28,126,214,0.55)]",
  },
  {
    iconGradient: "bg-[radial-gradient(circle_at_30%_25%,#b2f2bb_0%,#51cf66_45%,#2f9e44_100%)]",
    shadow: "shadow-[0_8px_20px_-6px_rgba(47,158,68,0.5)]",
  },
  {
    iconGradient: "bg-[radial-gradient(circle_at_30%_25%,#e599f7_0%,#cc5de8_45%,#9c36b5_100%)]",
    shadow: "shadow-[0_8px_20px_-6px_rgba(156,54,181,0.55)]",
  },
  {
    iconGradient: "bg-[radial-gradient(circle_at_30%_25%,#ffc9a8_0%,#ff8a65_45%,#e8542b_100%)]",
    shadow: "shadow-[0_8px_20px_-6px_rgba(232,84,43,0.55)]",
  },
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
            className="group relative overflow-hidden bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 p-5 rounded-[2rem] shadow-xl shadow-slate-200/40 dark:shadow-black/20 transition-all hover:-translate-y-0.5"
          >
            <div className="relative flex flex-col h-full">
              {/* Top row: icon blob + label + arrow */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`relative w-11 h-11 rounded-full ${card.style.iconGradient} ${card.style.shadow} flex items-center justify-center shrink-0`}>
                    <div className="absolute top-1.5 left-2 w-2.5 h-2 rounded-full bg-white/50 blur-[1px]" />
                    <card.icon className="h-5 w-5 text-white relative z-10" strokeWidth={2.25} />
                  </div>
                  <p className="font-heading text-base font-semibold text-[#163144] dark:text-[#DFF3EB] tracking-tight truncate">
                    {card.title}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full border border-[#163144]/15 dark:border-white/15 flex items-center justify-center shrink-0 transition-colors group-hover:border-[#163144]/40">
                  <ArrowUpRight className="h-4 w-4 text-[#163144]/60 dark:text-[#DFF3EB]/60" strokeWidth={2} />
                </div>
              </div>

              {/* Big value */}
              <p className="font-heading text-4xl font-extrabold text-[#163144] dark:text-[#DFF3EB] tracking-tight mt-4">
                {card.value}
              </p>
              <p className="text-xs text-[#1B405B]/55 dark:text-[#DFF3EB]/45 mt-1 tracking-wide">
                {card.subtitle}
              </p>
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
    </div>
  )
}

