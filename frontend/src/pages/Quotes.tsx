import { useState, useMemo, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useQuotesList, QUOTES_LIST_KEY } from "@/hooks/useQuotesList"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, Download, Trash2, Search, FileText, UserPlus, ArrowRightCircle } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/lib/authlibrary"
import { useGlobalSearch } from "@/lib/searchContext"
import { PdfIcon } from "@/components/PdfIcon"
import { toTitleCase } from "@/lib/quoteUtils"
import { exportQuotePdf } from "@/lib/pdfExport"
import { PageLoader } from "@/components/PageLoader"
import { QuoteStatsCards } from "@/components/quotes/QuoteStatsCards"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type QuoteStatus = "all" | "draft" | "pending" | "converted" | "rejected"

const normalizeStatus = (s?: string) => (s || "draft").toLowerCase()

const statusBadgeClass = (status: string) => {
  switch (status) {
    case "converted": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30"
    case "pending":   return "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200 dark:border-amber-500/30"
    case "rejected":  return "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300 border-rose-200 dark:border-rose-500/30"
    default:          return "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 border-slate-200 dark:border-slate-500/30"
  }
}

const Quotes = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { globalSearchTerm, setGlobalSearchTerm } = useGlobalSearch()
  const [localSearchTerm, setLocalSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [statusFilter, setStatusFilter] = useState<QuoteStatus>("all")
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const { data: quotes = [], isLoading } = useQuotesList()
  const loading = isLoading && quotes.length === 0
  const [currentPage, setCurrentPage] = useState(1)
  const { userRole } = useAuth()
  const itemsPerPage = 50

  const searchTerm = globalSearchTerm || localSearchTerm

  useEffect(() => {
    if (globalSearchTerm) setLocalSearchTerm(globalSearchTerm)
  }, [globalSearchTerm])

  const handleLocalSearchChange = (value: string) => {
    setLocalSearchTerm(value)
    setGlobalSearchTerm(value)
  }

  const getQuoteTypeBadgeClass = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes("annuity")) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700"
    if (t.includes("funeral")) return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700"
    if (t.includes("life"))    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700"
    if (t.includes("credit"))  return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700"
    if (t.includes("disability")) return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700"
    if (t.includes("critical"))   return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700"
    return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-700"
  }

  const handleDeleteQuote = async (quoteId: string, isLegacy: boolean = false) => {
    try {
      const token = localStorage.getItem("token")
      const endpoint = isLegacy
        ? `${import.meta.env.VITE_API_BASE_URL || "https://njs.exclusivelife.co.bw"}/api/quotes/${quoteId}`
        : `${import.meta.env.VITE_API_BASE_URL || "https://njs.exclusivelife.co.bw"}/api/new-quotes/${quoteId}`
      const res = await fetch(endpoint, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || `Failed to delete quote (${res.status})`)
      queryClient.setQueryData<any[]>(QUOTES_LIST_KEY, (old) => (old || []).filter((q) => q.id !== quoteId))
      toast.success("Quote deleted successfully")
    } catch (err) {
      console.error("Error deleting quote:", err)
      toast.error(err instanceof Error ? err.message : "Failed to delete quote")
    }
  }

  const handleDownloadPdf = async (e: React.MouseEvent, quoteId: string, id: string, isLegacy: boolean) => {
    e.stopPropagation()
    try {
      toast.info("Generating PDF...")
      await exportQuotePdf(id, quoteId, isLegacy)
      toast.success("PDF downloaded successfully")
    } catch (err) {
      console.error("Error downloading PDF:", err)
      toast.error("Failed to download PDF")
    }
  }

  const filteredAndSortedQuotes = useMemo(() => {
    let filtered = quotes as any[]

    if (statusFilter !== "all") {
      filtered = filtered.filter(q => normalizeStatus(q.status) === statusFilter)
    }

    if (typeFilter) {
      filtered = filtered.filter(q => (q.type || "Unknown") === typeFilter)
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase()
      filtered = filtered.filter(q =>
        (q.fullName || "").toLowerCase().includes(s) ||
        (q.createdByName || "").toLowerCase().includes(s) ||
        (q.type || "").toLowerCase().includes(s) ||
        (q.quoteId || "").toLowerCase().includes(s) ||
        (q.idNumber || q.identificationNumber || "").toString().toLowerCase().includes(s)
      )
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "client":  return (a.fullName || "").localeCompare(b.fullName || "")
        case "agent":   return (a.createdByName || "").localeCompare(b.createdByName || "")
        case "type":    return (a.type || "").localeCompare(b.type || "")
        case "premium": return (b.premium || 0) - (a.premium || 0)
        default:        return 0
      }
    })

    return filtered
  }, [quotes, searchTerm, sortBy, statusFilter, typeFilter])

  const totalPages = Math.ceil(filteredAndSortedQuotes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentQuotes = filteredAndSortedQuotes.slice(startIndex, endIndex)

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)))

  useEffect(() => { setCurrentPage(1) }, [statusFilter, typeFilter, searchTerm])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Quote Management</h2>
          <p className="text-muted-foreground">Quotation pipeline metrics, status filters, and conversion actions.</p>
        </div>
        <Button asChild>
          <Link to="/calculate">
            <Calculator className="h-4 w-4 mr-2" />
            New Quote
          </Link>
        </Button>
      </div>

      {/* Quotation summary metrics + Quotations by Type */}
      <QuoteStatsCards
        quotes={quotes as any}
        loading={loading}
        onTypeFilter={setTypeFilter}
        activeFilter={typeFilter}
      />

      {/* Status tabs + search/sort */}
      <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0">
        <CardContent className="py-5 space-y-4">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as QuoteStatus)}>
            <TabsList className="flex flex-wrap gap-1 h-auto bg-white/60 dark:bg-slate-900/40 p-1 rounded-full">
              {(["all", "draft", "pending", "converted", "rejected"] as QuoteStatus[]).map(s => (
                <TabsTrigger key={s} value={s} className="rounded-full px-4 py-1.5 capitalize text-xs">
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, ID, quote number..."
                value={localSearchTerm}
                onChange={(e) => handleLocalSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date Created</SelectItem>
                <SelectItem value="client">Applicant Name</SelectItem>
                <SelectItem value="agent">Created By</SelectItem>
                <SelectItem value="type">Product Type</SelectItem>
                <SelectItem value="premium">Investment Amount</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground flex items-center">
              Showing {filteredAndSortedQuotes.length} of {quotes.length} quotes
              {typeFilter && ` · type: ${typeFilter}`}
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0"><CardContent className="py-6"><PageLoader /></CardContent></Card>
      ) : filteredAndSortedQuotes.length === 0 ? (
        <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0">
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{searchTerm || statusFilter !== "all" || typeFilter ? "No matching quotes found" : "No quotes yet"}</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all" || typeFilter ? "Try adjusting your filters." : "Start by creating your first insurance quote."}
            </p>
            {!searchTerm && statusFilter === "all" && !typeFilter && (
              <Button asChild>
                <Link to="/calculate"><Calculator className="h-4 w-4 mr-2" /> Create Quote</Link>
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
                  {["Quote Number", "Applicant Name", "ID Number", "Product Type", "Investment Amount", "Status", "Created By", "Date Created"].map(h => (
                    <TableHead key={h} className="font-medium text-gray-900 dark:text-gray-100 py-4 px-6 text-sm">{h}</TableHead>
                  ))}
                  <TableHead className="text-right font-medium text-gray-900 dark:text-gray-100 py-4 px-6 text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentQuotes.map((quote: any) => {
                  const status = normalizeStatus(quote.status)
                  const idNumber = quote.idNumber || quote.identificationNumber || quote.omangId || "—"
                  const investmentAmount = quote.investmentAmount
                    ? `BWP ${Number(quote.investmentAmount).toLocaleString()}`
                    : quote.premium
                    ? `BWP ${Number(quote.premium).toLocaleString()}`
                    : "—"

                  return (
                    <TableRow
                      key={quote.id}
                      onClick={() => navigate(`/quotes/${quote.id}?legacy=${quote.isLegacy || false}`)}
                      className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:border-sky-200 dark:hover:border-sky-700 transition-all duration-200 my-2 overflow-hidden cursor-pointer"
                    >
                      <TableCell className="py-5 px-6 rounded-l-xl">
                        <div className="flex items-center gap-3">
                          <PdfIcon size="md" />
                          <span className="text-gray-700 dark:text-gray-300">{quote.quoteId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 px-6 text-gray-700 dark:text-gray-300">
                        {toTitleCase(quote.clientName || quote.fullName || quote.schemeName || "Unnamed")}
                      </TableCell>
                      <TableCell className="py-5 px-6 text-gray-700 dark:text-gray-300">{idNumber}</TableCell>
                      <TableCell className="py-5 px-6">
                        <Badge variant="outline" className={`rounded-full px-2 py-1.5 text-xs font-medium border whitespace-nowrap ${getQuoteTypeBadgeClass(quote.type || "Unknown")}`}>
                          {quote.type || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 px-6 text-gray-700 dark:text-gray-300">{investmentAmount}</TableCell>
                      <TableCell className="py-5 px-6">
                        <Badge variant="outline" className={`rounded-full px-2 py-1.5 text-xs font-medium border capitalize whitespace-nowrap ${statusBadgeClass(status)}`}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 px-6 text-gray-700 dark:text-gray-300">{quote.createdByName || "—"}</TableCell>
                      <TableCell className="py-5 px-6 text-gray-700 dark:text-gray-300">{new Date(quote.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="py-5 px-6 text-right rounded-r-xl">
                        <div className="flex justify-end gap-2 items-center">
                          {status === "converted" && (
                            <>
                              <Button
                                variant="outline" size="sm"
                                className="rounded-full text-xs h-8"
                                onClick={(e) => { e.stopPropagation(); toast.info("Client onboarding coming soon") }}
                                title="Create / Link Client"
                              >
                                <UserPlus className="h-3.5 w-3.5 mr-1" /> Create / Link Client
                              </Button>
                              <Button
                                variant="outline" size="sm"
                                className="rounded-full text-xs h-8"
                                onClick={(e) => { e.stopPropagation(); toast.info("Policy setup coming soon") }}
                                title="Continue Policy Setup"
                              >
                                <ArrowRightCircle className="h-3.5 w-3.5 mr-1" /> Policy Setup
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={(e) => handleDownloadPdf(e, quote.quoteId, quote.id, quote.isLegacy || false)}
                            title="Download PDF"
                          >
                            <Download className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          </Button>
                          {userRole === "superuser" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost" size="icon" className="h-8 w-8"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Delete Quote"
                                >
                                  <Trash2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone. This will permanently delete the quote.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={(e) => { e.stopPropagation(); handleDeleteQuote(quote.id, quote.isLegacy || false) }}
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                  >
                                    Yes, Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination>
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => goToPage(currentPage - 1)}
                      className={`rounded-lg ${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"}`}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1
                    if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => goToPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className={`rounded-full cursor-pointer min-w-10 ${currentPage === pageNum ? "bg-transparent text-[#009fe3] border-2 border-[#009fe3] hover:bg-[#009fe3]/10" : "hover:bg-gray-100 dark:hover:bg-slate-800"}`}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                      return <PaginationItem key={pageNum}><PaginationEllipsis /></PaginationItem>
                    }
                    return null
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => goToPage(currentPage + 1)}
                      className={`rounded-lg ${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"}`}
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
