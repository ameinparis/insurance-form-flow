import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Users, TrendingUp, Calendar } from "lucide-react"
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
}

const COLORS = [
  "hsl(207, 90%, 70%)",  // Light Blue
  "hsl(270, 60%, 70%)",  // Light Purple
  "hsl(142, 60%, 60%)",  // Light Green
  "hsl(35, 85%, 65%)",   // Light Orange/Yellow
  "hsl(190, 70%, 60%)",  // Light Cyan
  "hsl(0, 60%, 70%)",    // Light Red
]

export const StatsCards = ({ quotes, loading }: StatsCardsProps) => {
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
    
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - 7)
    const quotesThisWeek = quotes.filter(
      q => new Date(q.createdAt) >= startOfWeek
    ).length
    
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
    }
  }, [quotes])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-card rounded-2xl border-0 animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-card rounded-2xl border-0 animate-pulse">
          <CardContent className="p-6">
            <div className="h-full bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* Left side - 2x2 Stats Grid */}
      <div className="lg:col-span-2 grid grid-cols-2 gap-4">
        {/* Total Quotes */}
        <Card className="bg-card rounded-2xl border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Quotes</p>
            <p className="text-3xl font-bold text-foreground">{stats.totalQuotes}</p>
            <p className="text-xs text-muted-foreground mt-2">All time</p>
          </CardContent>
        </Card>

        {/* Total Clients */}
        <Card className="bg-card rounded-2xl border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20">
                <Users className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Clients</p>
            <p className="text-3xl font-bold text-foreground">{stats.totalClients}</p>
            <p className="text-xs text-muted-foreground mt-2">Unique clients</p>
          </CardContent>
        </Card>

        {/* Quotes This Month */}
        <Card className="bg-card rounded-2xl border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <Calendar className="h-5 w-5 text-purple-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">This Month</p>
            <p className="text-3xl font-bold text-foreground">{stats.quotesThisMonth}</p>
            <p className="text-xs text-muted-foreground mt-2">Quotes created</p>
          </CardContent>
        </Card>

        {/* Quotes This Week */}
        <Card className="bg-card rounded-2xl border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/20">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">This Week</p>
            <p className="text-3xl font-bold text-foreground">{stats.quotesThisWeek}</p>
            <p className="text-xs text-muted-foreground mt-2">Recent activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Right side - Pie Chart */}
      <Card className="bg-card rounded-2xl border-0 shadow-sm">
        <CardContent className="p-5 h-full flex flex-col">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quotes by Type</h3>
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
                  >
                    {stats.pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                <p className="text-xs text-muted-foreground">Total Quotes</p>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {stats.pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-sm" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs text-muted-foreground">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
