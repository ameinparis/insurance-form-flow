import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Trash2 } from "lucide-react"
import { SimpleChart } from "@/components/SimpleChart"
import { toast } from "sonner"
import { useAuth } from "@/lib/authlibrary"

const Dashboard = () => {
  const [recentQuotes, setRecentQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { userRole } = useAuth()

  // 🟡 Placeholder chart data (you can replace these later)
  const dummyStats = {
    totalQuotes: 0,
    totalCalculations: 0,
    successRate: 0,
    revenue: 0
  }

  const dummyChartData = {
    monthlyData: [],
    categoryData: []
  }

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5002"}/api/quotes`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) throw new Error("Failed to fetch quotes")
        const data = await res.json()
        const mapped = data.map((q: any) => ({ ...q, id: q._id }))
        setRecentQuotes(mapped)
      } catch (err) {
        console.error("Error fetching quotes:", err)
        toast.error("Failed to load quotes")
        setRecentQuotes([])
      } finally {
        setLoading(false)
      }
    }

    fetchQuotes()
  }, [])

  const handleDeleteQuote = async (quoteId: string) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5002"}/api/quotes/${quoteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error("Failed to delete quote")
      setRecentQuotes((quotes) => quotes.filter((q) => q.id !== quoteId))
      toast.success("Quote deleted successfully")
    } catch (err) {
      console.error("Error deleting quote:", err)
      toast.error("Failed to delete quote")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 font-heading">Welcome back!</h2>
        <p className="text-muted-foreground">Your recent annuity quotes appear below.</p>
      </div>

      {/* Chart Section (structure only for now) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Performance Overview</CardTitle>
            <CardDescription>Monthly quotes and calculations trend</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder data — hook up later */}
            <SimpleChart data={dummyChartData.monthlyData} type="area" className="h-[300px]" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Quote Categories</CardTitle>
            <CardDescription>Distribution by insurance type</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder data — hook up later */}
            <SimpleChart data={dummyChartData.categoryData} type="pie" className="h-[300px]" />
          </CardContent>
        </Card>
      </div>

      {/* Quotes List */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Recently Created</CardTitle>
          <CardDescription>Latest quotes created by your team</CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-6 text-muted-foreground">Loading quotes...</div>
          ) : recentQuotes.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">No quotes found.</div>
          ) : (
            <div className="space-y-4">
              {recentQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
                      PDF
                    </div>
                    <div>
                      <div className="font-medium">{quote.quoteId}</div>
                      <div className="text-sm text-muted-foreground">
                        Created by {quote.createdByName || "Unknown"} •{" "}
                        {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-medium">{quote.fullName || "Unnamed client"}</div>
                      <div className="text-sm text-muted-foreground">
                        <Badge variant="outline" className="mr-2">Annuity</Badge>
                        {quote.contactNumber || "No contact"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="h-4 w-4 text-blue-500" />
                      </Button>
                      {userRole === "superuser" && (
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
