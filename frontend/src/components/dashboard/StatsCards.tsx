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
  "hsl(207, 90%, 70%)",  // Light Blue
  "hsl(270, 60%, 70%)",  // Light Purple
  "hsl(142, 60%, 60%)",  // Light Green
  "hsl(35, 85%, 65%)",   // Light Orange/Yellow
  "hsl(190, 70%, 60%)",  // Light Cyan
  "hsl(0, 60%, 70%)",    // Light Red
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
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.change >= 0 ? 'text-emerald-600 bg-emerald-50/60 dark:bg-emerald-500/10' : 'text-rose-600 bg-rose-50/60 dark:bg-rose-500/10'}`}>
                    {card.change >= 0 ? '+' : ''}{card.change}%
                  </span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{card.title}</p>
              <p className="font-heading text-3xl font-extrabold text-slate-800 dark:text-slate-100">{card.value}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{card.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Right side - Pie Chart */}
      <div className="lg:col-span-3 relative overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-black/20 p-6 flex flex-col">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-200/30 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 relative">Quotes by Type</h3>
          {stats.pieData.length > 0 ? (
            <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                    cornerRadius={8}
                    onClick={(_, index) => handlePieClick(stats.pieData[index])}
                    style={{ cursor: 'pointer' }}
                  >
                    {stats.pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        opacity={activeFilter && activeFilter !== entry.name ? 0.4 : 1}
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
              <div className="text-center mb-2">
                <p className="text-2xl font-bold text-foreground">{stats.totalQuotes}</p>
                <p className="text-xs text-muted-foreground">
                  {activeFilter ? `Filtered: ${activeFilter}` : 'Total Quotes'}
                </p>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {stats.pieData.map((entry, index) => (
                  <button
                    key={entry.name}
                    onClick={() => handlePieClick(entry)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all hover:bg-muted ${
                      activeFilter === entry.name ? 'bg-muted ring-1 ring-border' : ''
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ 
                        backgroundColor: COLORS[index % COLORS.length],
                        opacity: activeFilter && activeFilter !== entry.name ? 0.4 : 1
                      }}
                    />
                    <span className="text-xs text-muted-foreground">{entry.name}</span>
                  </button>
                ))}
              </div>
              {activeFilter && (
                <button
                  onClick={() => onTypeFilter?.(null)}
                  className="mt-3 text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Clear filter
                </button>
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
