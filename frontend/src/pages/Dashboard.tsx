import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Download, Trash2 } from "lucide-react"
import { SimpleChart } from "@/components/SimpleChart"
import { toast } from "sonner"
import { useAuth } from "@/lib/authlibrary"

const Dashboard = () => {
  const navigate = useNavigate()
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

  // Helper function to get badge color based on quote type
  const getQuoteTypeBadgeClass = (type: string) => {
    const normalizedType = type.toLowerCase()
    if (normalizedType.includes("annuity")) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700"
    } else if (normalizedType.includes("funeral")) {
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700"
    } else if (normalizedType.includes("life")) {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700"
    } else if (normalizedType.includes("credit")) {
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700"
    } else if (normalizedType.includes("disability")) {
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700"
    } else if (normalizedType.includes("critical")) {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700"
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-700"
  }

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const [oldRes, newRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_BASE_URL || "https://njs.exclusivelife.co.bw"}/api/quotes`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_BASE_URL || "https://njs.exclusivelife.co.bw"}/api/new-quotes`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (!oldRes.ok || !newRes.ok) throw new Error("Failed to fetch quotes");

        const oldQuotes = await oldRes.json();
        const newQuotes = await newRes.json();

        const mappedOld = oldQuotes.map((q: any) => ({
          id: q._id,
          quoteId: q.quoteId,
          fullName: q.fullName,
          email: q.email,
          contactNumber: q.contactNumber,
          type: "Exclusive Annuity",
          createdByName: q.createdByName || q.createdBy?.firstName || "",
          createdAt: q.createdAt,
          isLegacy: true,
        }));

        const mappedNew = newQuotes.map((q: any) => ({
          id: q._id,
          quoteId: q.quoteId || "—",
          clientName: q.client?.fullName || q.client?.companyName || "Unnamed",
          email: q.client?.email || q.client?.companyEmail || "—",
          type: q.productType,
          createdByName: q.createdBy?.firstName || "",
          createdAt: q.createdAt,
        }));


        setRecentQuotes([...mappedOld, ...mappedNew].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      } catch (err) {
        console.error("Error fetching quotes:", err);
        toast.error("Failed to load quotes");
        setRecentQuotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);


  const handleDeleteQuote = async (quoteId: string) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "https://njs.exclusivelife.co.bw"}/api/quotes/${quoteId}`, {
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
      </div>

      {/* Chart Section */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div> */}

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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-200 py-4">Quote ID</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Client Name</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Quote Type</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Created By</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Date Created</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-200">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentQuotes.map((quote, idx) => (
                      <TableRow 
                        key={quote.id} 
                        className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-gray-50/50 dark:bg-slate-900/50"}
                      >
                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                          {quote.quoteId}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100">
                          {quote.clientName || quote.fullName || "Unnamed"}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getQuoteTypeBadgeClass(quote.type || "Unknown")}`}
                          >
                            {quote.type || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100">
                          {quote.createdByName || "—"}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-100">
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-slate-700"
                              onClick={() => navigate(`/quotes/${quote.id}?legacy=${quote.isLegacy || false}`)}
                              title="View Quote"
                            >
                              <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-gray-200 dark:hover:bg-slate-700"
                              onClick={() => toast.info("Download feature coming soon")}
                              title="Download Quote"
                            >
                              <Download className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </Button>
                            {userRole === "superuser" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteQuote(quote.id)}
                                title="Delete Quote"
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
              </div>

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
