import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Download, Trash2 } from "lucide-react"
import { SimpleChart } from "@/components/SimpleChart"
import { toast } from "sonner"
import { useAuth } from "@/lib/authlibrary"

const Dashboard = () => {
  const [recentQuotes, setRecentQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { userRole } = useAuth()

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

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Performance Overview</CardTitle>
            <CardDescription>Monthly quotes and calculations trend</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleChart data={dummyChartData.monthlyData} type="area" className="h-[300px]" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Quote Categories</CardTitle>
            <CardDescription>Distribution by insurance type</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleChart data={dummyChartData.categoryData} type="pie" className="h-[300px]" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Quotes Table */}
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
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Quote ID</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentQuotes.map((quote, idx) => (
                    <TableRow key={quote.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <TableCell className="font-medium">#{quote.quoteId}</TableCell>
                      <TableCell>{quote.fullName || "Unnamed"}</TableCell>
                      <TableCell className="text-primary underline">{quote.email || "—"}</TableCell>
                      <TableCell>{quote.contactNumber || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{quote.type || "Funeral"}</Badge>
                      </TableCell>
                      <TableCell>{quote.createdByName}</TableCell>
                      <TableCell>{new Date(quote.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                          {userRole === "superuser" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteQuote(quote.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {recentQuotes.length} out of {recentQuotes.length} quotes
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
