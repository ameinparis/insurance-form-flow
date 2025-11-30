import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Calculator, Download, Trash2, Search, Filter, FileText } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/lib/authlibrary"
import { useGlobalSearch } from "@/lib/searchContext"
import { PdfIcon } from "@/components/PdfIcon"

const Quotes = () => {
  const navigate = useNavigate()
  const { globalSearchTerm, setGlobalSearchTerm } = useGlobalSearch()
  const [localSearchTerm, setLocalSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const { userRole } = useAuth()
  const itemsPerPage = 100

  // Use global search term if available, otherwise use local
  const searchTerm = globalSearchTerm || localSearchTerm
  
  // Sync local search with global when component mounts
  useEffect(() => {
    if (globalSearchTerm) {
      setLocalSearchTerm(globalSearchTerm)
    }
  }, [globalSearchTerm])

  const handleLocalSearchChange = (value: string) => {
    setLocalSearchTerm(value)
    setGlobalSearchTerm(value)
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
        }),
      ]);

      if (!oldRes.ok || !newRes.ok) throw new Error("Failed to fetch quotes");

      const oldQuotes = await oldRes.json();
      const newQuotes = await newRes.json();

      const mappedOld = oldQuotes.map((q: any) => ({
        id: q._id,
        quoteId: q.quoteId,
        fullName: q.fullName || "Unnamed",
        email: q.email || "—",
        contactNumber: q.contactNumber || "—",
        type: "Exclusive Annuity",
        createdByName: q.createdByName || q.createdBy?.firstName || "—",
        createdAt: q.createdAt,
        isLegacy: true,
      }));

      const mappedNew = newQuotes.map((q: any) => ({
        id: q._id,
        quoteId: q.quoteId,
        fullName: q.client?.fullName || "Unnamed",
        email: q.client?.email || "—",
        contactNumber: q.client?.contactNumber || "—",
        type: q.productType || "Unknown",
        createdByName:
          q.createdByName ||
          (q.createdBy?.firstName ? `${q.createdBy.firstName} ${q.createdBy.lastName || ""}` : "—"),
        createdAt: q.createdAt,
        isLegacy: false,
      }));

      setQuotes(
        [...mappedOld, ...mappedNew].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (err) {
      console.error("Error fetching quotes:", err);
      toast.error("Failed to load quotes");
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  fetchQuotes();
}, []);

  const handleDeleteQuote = async (quoteId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "https://njs.exclusivelife.co.bw"}/api/quotes/${quoteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error("Failed to delete quote")
      setQuotes((quotes) => quotes.filter((q) => q.id !== quoteId))
      toast.success("Quote deleted successfully")
    } catch (err) {
      console.error("Error deleting quote:", err)
      toast.error("Failed to delete quote")
    }
  }

  const handleDownloadPdf = async (e: React.MouseEvent, quoteId: string, id: string, isLegacy: boolean) => {
    e.stopPropagation()
    try {
      const url = `https://njs.exclusivelife.co.bw/api/quotes/${id}/generate-pdf?legacy=${isLegacy}`
      const res = await fetch(url, { method: "GET" })
      if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`)
      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = objUrl
      a.download = `quote-${quoteId}.pdf`
      a.target = "_blank"
      a.style.display = "none"
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        URL.revokeObjectURL(objUrl)
        a.remove()
      }, 3000)
      toast.success("PDF downloaded successfully")
    } catch (err) {
      console.error("Error downloading PDF:", err)
      toast.error("Failed to download PDF")
    }
  }

  const filteredAndSortedQuotes = useMemo(() => {
    let filtered = quotes

    if (searchTerm) {
      filtered = filtered.filter(quote =>
        (quote.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quote.createdByName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quote.type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (quote.quoteId || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "client":
          return (a.fullName || "").localeCompare(b.fullName || "")
        case "agent":
          return (a.createdByName || "").localeCompare(b.createdByName || "")
        case "type":
          return (a.type || "").localeCompare(b.type || "")
        case "premium":
          return (b.premium || 0) - (a.premium || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [quotes, searchTerm, sortBy])

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedQuotes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentQuotes = filteredAndSortedQuotes.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Quotation Management</h2>
          <p className="text-muted-foreground">Manage and view all your insurance quotes.</p>
        </div>
        <Button asChild>
          <Link to="/calculate">
            <Calculator className="h-4 w-4 mr-2" />
            New Quote
          </Link>
        </Button>
      </div>

      <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search quotes..."
                value={localSearchTerm}
                onChange={(e) => handleLocalSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date Created</SelectItem>
                <SelectItem value="client">Client Name</SelectItem>
                <SelectItem value="agent">Created By</SelectItem>
                <SelectItem value="type">Quote Type</SelectItem>
                <SelectItem value="premium">Premium Amount</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              Showing {filteredAndSortedQuotes.length} of {quotes.length} quotes
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0"><CardContent className="py-12 text-center text-muted-foreground">Loading quotes...</CardContent></Card>
      ) : filteredAndSortedQuotes.length === 0 ? (
        <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0">
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "No matching quotes found" : "No quotes yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? "Try adjusting your search terms."
                : "Start by creating your first insurance quote."}
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link to="/calculate">
                  <Calculator className="h-4 w-4 mr-2" />
                  Create First Quote
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="bg-gray-50 dark:bg-slate-800 rounded-3xl p-6">
         <div className="overflow-x-auto">
                <Table className="border-separate border-spacing-y-3 w-full">

                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="bg-gray-200 dark:bg-slate-700 border-b border-gray-300 dark:border-gray-600 rounded-xl">
                      <TableHead className="font-medium text-gray-900 dark:text-gray-100 py-4 px-6 text-sm">
                        Quote ID
                      </TableHead>
                      <TableHead className="font-medium text-gray-900 dark:text-gray-100 py-4 px-6 text-sm">
                        Client Name
                      </TableHead>
                      <TableHead className="font-medium text-gray-900 dark:text-gray-100 py-4 px-6 text-sm">
                        Type
                      </TableHead>
                      <TableHead className="font-medium text-gray-900 dark:text-gray-100 py-4 px-6 text-sm">
                        Created By
                      </TableHead>
                      <TableHead className="font-medium text-gray-900 dark:text-gray-100 py-4 px-6 text-sm">
                        Date
                      </TableHead>
                      <TableHead className="text-right font-medium text-gray-900 dark:text-gray-100 py-4 px-6 text-sm">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {currentQuotes.map((quote) => (
                      <TableRow
                        key={quote.id}
                        onClick={() => navigate(`/quotes/${quote.id}?legacy=${quote.isLegacy || false}`)}
                        className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:border-sky-200 dark:hover:border-sky-700 transition-all duration-200 my-2 overflow-hidden cursor-pointer"
                      >
                        <TableCell className="py-5 px-6 rounded-l-xl">
                          <div className="flex items-center gap-3">
                            <PdfIcon size="sm" />
                            <span className="text-gray-700 dark:text-gray-300 font-small">{quote.quoteId}</span>
                          </div>
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
                          <div className="flex justify-end gap-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleDownloadPdf(e, quote.quoteId, quote.id, quote.isLegacy || false)}
                              title="Download PDF"
                            >
                              <Download className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </Button>
                            {userRole === "superuser" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => handleDeleteQuote(quote.id, e)}
                                title="Delete Quote"
                              >
                                <Trash2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
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
                              className={`rounded-lg cursor-pointer min-w-10 ${
                                currentPage === pageNum
                                  ? 'bg-[#009fe3] text-white hover:bg-[#0088c6] border-[#009fe3]'
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
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedQuotes.length)} of {filteredAndSortedQuotes.length} quotes
              </p>
            </div>
          </div>
        )}
    </div>
  )
}

export default Quotes
