import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Users, TrendingUp, Calendar } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

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
  "hsl(207, 100%, 62%)", // Blue - Annuity
  "hsl(270, 70%, 60%)",  // Purple - Funeral
  "hsl(142, 70%, 45%)",  // Green - Life
  "hsl(30, 90%, 55%)",   // Orange - Credit
  "hsl(190, 80%, 50%)",  // Cyan - Disability
  "hsl(0, 70%, 55%)",    // Red - Critical
  "hsl(220, 15%, 50%)",  // Gray - Other
]

export const StatsCards = ({ quotes, loading }: StatsCardsProps) => {
  const stats = useMemo(() => {
    const totalQuotes = quotes.length
    
    // Get unique clients
    const uniqueClients = new Set(
      quotes.map(q => (q.clientName || q.fullName || "").toLowerCase()).filter(Boolean)
    )
    const totalClients = uniqueClients.size
    
    // Quotes this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const quotesThisMonth = quotes.filter(
      q => new Date(q.createdAt) >= startOfMonth
    ).length
    
    // Quotes this week
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - 7)
    const quotesThisWeek = quotes.filter(
      q => new Date(q.createdAt) >= startOfWeek
    ).length
    
    // Group by type
    const typeGroups: Record<string, number> = {}
    quotes.forEach(q => {
      const type = q.type || "Unknown"
      typeGroups[type] = (typeGroups[type] || 0) + 1
    })
    
    const pieData = Object.entries(typeGroups).map(([name, value]) => ({
      name,
      value,
    }))
    
    // Most active type
    const mostActiveType = pieData.length > 0 
      ? pieData.reduce((a, b) => a.value > b.value ? a : b).name 
      : "N/A"
    
    return {
      totalQuotes,
      totalClients,
      quotesThisMonth,
      quotesThisWeek,
      pieData,
      mostActiveType,
    }
  }, [quotes])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card rounded-2xl border-0 animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Quotes */}
        <Card className="bg-card rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Quotes</p>
            <p className="text-3xl font-bold text-foreground">{stats.totalQuotes}</p>
            <p className="text-xs text-muted-foreground mt-2">All time</p>
          </CardContent>
        </Card>

        {/* Total Clients */}
        <Card className="bg-card rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Clients</p>
            <p className="text-3xl font-bold text-foreground">{stats.totalClients}</p>
            <p className="text-xs text-muted-foreground mt-2">Unique clients</p>
          </CardContent>
        </Card>

        {/* Quotes This Month */}
        <Card className="bg-card rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">This Month</p>
            <p className="text-3xl font-bold text-foreground">{stats.quotesThisMonth}</p>
            <p className="text-xs text-muted-foreground mt-2">Quotes created</p>
          </CardContent>
        </Card>

        {/* Quotes This Week */}
        <Card className="bg-card rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
                <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">This Week</p>
            <p className="text-3xl font-bold text-foreground">{stats.quotesThisWeek}</p>
            <p className="text-xs text-muted-foreground mt-2">Recent activity</p>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart Section */}
      {stats.pieData.length > 0 && (
        <Card className="bg-card rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quotes by Type</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
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
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
