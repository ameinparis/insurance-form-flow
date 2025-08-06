
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, FileText, TrendingUp, Download, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"
import { SimpleChart } from "@/components/SimpleChart"
import { dashboardApi, quotesApi, Quote, DashboardStats, ChartData } from "@/lib/api"
import { toast } from "sonner"

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalQuotes: 0,
    totalCalculations: 0,
    successRate: 0,
    revenue: 0
  })
  const [chartData, setChartData] = useState<ChartData>({
    monthlyData: [],
    categoryData: []
  })
  const [recentQuotes, setRecentQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)

  // Mock current user role (in real app this would come from auth context)
  const currentUser = { role: 'superuser' } // or 'user'

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const [statsData, chartsData, quotesData] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getChartData(),
          quotesApi.getRecentQuotes()
        ])
        
        setStats(statsData)
        setChartData(chartsData)
        setRecentQuotes(quotesData)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast.error('Failed to load dashboard data')
        
        // Fallback to mock data if API fails
        setStats({
          totalQuotes: 24,
          totalCalculations: 45,
          successRate: 78,
          revenue: 124000
        })
        setChartData({
          monthlyData: [
            { month: "Jan", quotes: 12, calculations: 18 },
            { month: "Feb", quotes: 19, calculations: 25 },
            { month: "Mar", quotes: 15, calculations: 22 },
            { month: "Apr", quotes: 25, calculations: 35 },
            { month: "May", quotes: 22, calculations: 38 },
            { month: "Jun", quotes: 30, calculations: 42 },
          ],
          categoryData: [
            { name: "Living Annuity", value: 45, color: "#3B82F6" },
            { name: "Life Insurance", value: 30, color: "#06B6D4" },
            { name: "Health Insurance", value: 25, color: "#8B5CF6" },
          ]
        })
        setRecentQuotes([
          {
            id: "EXQ-0012/25",
            createdBy: "Kesego Gosata-Mosweu",
            customerName: "Motlapele Raleru",
            productName: "Living Annuity",
            frequency: "Monthly",
            contact: "71633111",
            quoteCreated: "11/07/2025"
          },
          {
            id: "EXQ-0011/25",
            createdBy: "ame busang",
            customerName: "ame busang",
            productName: "Living Annuity",
            frequency: "Monthly",
            contact: "72791628",
            quoteCreated: "10/07/2025"
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleDeleteQuote = async (quoteId: string) => {
    try {
      await quotesApi.deleteQuote(quoteId)
      setRecentQuotes(quotes => quotes.filter(q => q.id !== quoteId))
      toast.success('Quote deleted successfully')
    } catch (error) {
      console.error('Error deleting quote:', error)
      toast.error('Failed to delete quote')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
        <p className="text-muted-foreground">Manage your quotations and calculations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Quotes</CardTitle>
            <FileText className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : stats.totalQuotes}</div>
            <p className="text-xs text-blue-200">+2 from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-cyan-100">Calculations</CardTitle>
            <Calculator className="h-4 w-4 text-cyan-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : stats.totalCalculations}</div>
            <p className="text-xs text-cyan-200">+8 from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : `${stats.successRate}%`}</div>
            <p className="text-xs text-purple-200">+5% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? "..." : `$${(stats.revenue / 1000).toFixed(0)}K`}</div>
            <p className="text-xs text-green-200">+12% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Monthly quotes and calculations trend</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleChart data={chartData.monthlyData} type="area" className="h-[300px]" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quote Categories</CardTitle>
            <CardDescription>Distribution by insurance type</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleChart data={chartData.categoryData} type="pie" className="h-[300px]" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently Created</CardTitle>
          <CardDescription>Latest quotes created by your team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentQuotes.map((quote) => (
              <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                    PDF
                  </div>
                  <div>
                    <div className="font-medium">{quote.id}</div>
                    <div className="text-sm text-muted-foreground">
                      Created by {quote.createdBy} • {quote.quoteCreated}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-medium">{quote.customerName}</div>
                    <div className="text-sm text-muted-foreground">
                      <Badge variant="outline" className="mr-2">{quote.productName}</Badge>
                      {quote.contact}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Download className="h-4 w-4 text-blue-500" />
                    </Button>
                    {currentUser.role === 'superuser' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteQuote(quote.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with your quotation process</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button asChild>
            <Link to="/living-annuity-calculator">
              <Calculator className="h-4 w-4 mr-2" />
              Living Annuity Calculator
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/quotes">
              <FileText className="h-4 w-4 mr-2" />
              View Quotes
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
