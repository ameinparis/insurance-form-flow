import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Eye, Download, Trash2, Edit } from "lucide-react"
import { SimpleChart } from "@/components/SimpleChart"
import { toast } from "sonner"
import { useAuth } from "@/lib/authlibrary"

const Dashboard = () => {
  const navigate = useNavigate()
  const [recentQuotes, setRecentQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const { userRole } = useAuth()
  const itemsPerPage = 100

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

  // Pagination logic
  const totalPages = Math.ceil(recentQuotes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentQuotes = recentQuotes.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
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

        <CardContent className="p-6 bg-gray-50/30 dark:bg-slate-900/30">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading quotes...</div>
          ) : recentQuotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No quotes found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="border-separate border-spacing-y-3 w-full">

                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="bg-gray-200 dark:bg-slate-800 border-gray-200 dark:border-gray-700">
                      <TableHead className="font-medium text-gray-500 dark:text-gray-200 py-5 px-6 text-sm rounded-l-xl">
                        Quote ID
                      </TableHead>
                      <TableHead className="font-medium text-gray-500 dark:text-gray-200 py-5 px-6 text-sm">
                        Client Name
                      </TableHead>
                      <TableHead className="font-medium text-gray-500 dark:text-gray-200 py-5 px-6 text-sm">
                        Type
                      </TableHead>
                      <TableHead className="font-medium text-gray-500 dark:text-gray-200 py-5 px-6 text-sm">
                        Created By
                      </TableHead>
                      <TableHead className="font-medium text-gray-500 dark:text-gray-200 py-5 px-6 text-sm">
                        Date
                      </TableHead>
                      <TableHead className="text-right font-medium text-gray-500 dark:text-gray-200 py-5 px-6 text-sm rounded-r-xl">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {currentQuotes.map((quote, idx) => (
                      <TableRow
                        key={quote.id}
                        className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:bg-gray-200 dark:hover:bg-slate-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 my-2 overflow-hidden"
                      >

                        {/* <TableCell className="py-5 px-6 text-gray-700 dark:text-gray-300 font-normal rounded-l-xl">
                          {String(startIndex + idx + 1).padStart(2, '0')}
                        </TableCell> */}
                        <TableCell className="py-5 px-6 text-gray-700 dark:text-gray-300 font-small rounded-l-xl">
                          {quote.quoteId}
                        </TableCell>
                        <TableCell className="py-5 px-6 text-gray-700 dark:text-gray-300 font-normal">
                          {quote.clientName || quote.fullName || "Unnamed"}
                        </TableCell>
                        <TableCell className="py-5 px-6">
                          <Badge
                            variant="outline"
                            className={`rounded-full px-2 py-1.5 text-xs font-medium border ${getQuoteTypeBadgeClass(quote.type || "Unknown")}`}
                          >
                            {quote.type || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-5 px-6 text-gray-700 dark:text-gray-300 font-normal">
                          {quote.createdByName || "—"}
                        </TableCell>
                        <TableCell className="py-5 px-6 text-gray-700 dark:text-gray-300 font-normal">
                          {new Date(quote.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-5 px-6 text-right rounded-r-xl">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 transition-all"
                              onClick={() => navigate(`/quotes/${quote.id}?legacy=${quote.isLegacy || false}`)}
                              title="View Quote"
                            >
                              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 transition-all"
                              onClick={() => toast.info("Edit feature coming soon")}
                              title="Edit Quote"
                            >
                              <Edit className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </Button>
                            {userRole === "superuser" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 transition-all"
                                onClick={() => handleDeleteQuote(quote.id)}
                                title="Delete Quote"
                              >
                                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <Pagination>
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => goToPage(currentPage - 1)}
                          className={`rounded-lg ${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                        />
                      </PaginationItem>

                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => goToPage(pageNum)}
                                isActive={currentPage === pageNum}
                                className={`rounded-lg cursor-pointer min-w-10 ${currentPage === pageNum
                                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-500'
                                  : 'hover:bg-gray-100 dark:hover:bg-slate-800'
                                  }`}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        } else if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        ) {
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )
                        }
                        return null
                      })}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() => goToPage(currentPage + 1)}
                          className={`rounded-lg ${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, recentQuotes.length)} of {recentQuotes.length} quotes
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
