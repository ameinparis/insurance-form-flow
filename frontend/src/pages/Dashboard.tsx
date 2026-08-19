import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { useQuotesList, QUOTES_LIST_KEY } from "@/hooks/useQuotesList"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/authlibrary"
import { PdfIcon } from "@/components/PdfIcon"
import { toTitleCase } from "@/lib/quoteUtils"
import { StatsCards } from "@/components/dashboard/StatsCards"
import { PageLoader } from "@/components/PageLoader"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const Dashboard = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: recentQuotes = [], isLoading, isFetching } = useQuotesList()
  const loading = isLoading && recentQuotes.length === 0
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null)
  const { userRole } = useAuth()
  const maxDisplayQuotes = 15

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

  const handleDeleteQuote = async (quoteId: string, isLegacy: boolean = false) => {
    try {
      const token = localStorage.getItem("token")
      const endpoint = isLegacy
        ? `${import.meta.env.VITE_API_BASE_URL || "https://njs.exclusivelife.co.bw"}/api/quotes/${quoteId}`
        : `${import.meta.env.VITE_API_BASE_URL || "https://njs.exclusivelife.co.bw"}/api/new-quotes/${quoteId}`
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error("Failed to delete quote")
      queryClient.setQueryData<any[]>(QUOTES_LIST_KEY, (old) =>
        (old || []).filter((q) => q.id !== quoteId)
      )
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

  // Filter and limit quotes for dashboard display
  const filteredQuotes = typeFilter 
    ? recentQuotes.filter(q => q.type === typeFilter)
    : recentQuotes
  const displayQuotes = filteredQuotes.slice(0, maxDisplayQuotes)

  return (
    <div className="relative min-h-full -mx-6 -mb-6 bg-slate-50 dark:bg-slate-900">
      <div className="sticky top-0 z-30 px-6 pt-6 pb-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Plan, prioritize, and accomplish your work with ease.</p>
          </div>
          <Button
            onClick={() => navigate("/calculator")}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-sm shadow-sm transition-all active:scale-95"
          >
            + New Quote
          </Button>
        </div>
      </div>

      <div className="relative space-y-6 px-6 pt-6 pb-6">
        {/* Stats Cards */}
        <StatsCards
          quotes={recentQuotes}
          loading={loading}
          onTypeFilter={setTypeFilter}
          activeFilter={typeFilter}
        />

        {/* Recent Quotes Table */}
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Recently Created</CardTitle>
              <CardDescription className="text-sm text-slate-500 dark:text-slate-400 mt-1">Latest quotes created by your team</CardDescription>
            </div>
            {recentQuotes.length > maxDisplayQuotes && (
              <Button
                variant="outline"
                onClick={() => navigate("/quotes")}
                className="px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-transparent border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
              >
                Show All
              </Button>
            )}
          </CardHeader>

          <CardContent className="px-6 pb-6">
            {loading ? (
              <PageLoader />
            ) : recentQuotes.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No quotes found.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-b border-slate-200 dark:border-slate-700 hover:bg-transparent">
                        <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 pb-4 pl-4 normal-case">Quote ID</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 pb-4 normal-case">Client Name</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 pb-4 normal-case">Type</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 pb-4 normal-case">Created By</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 pb-4 normal-case">Date</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 pb-4 text-right pr-4 normal-case">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {displayQuotes.map((quote) => (
                        <TableRow
                          key={quote.id}
                          onClick={() => navigate(`/quotes/${quote.id}?legacy=${quote.isLegacy || false}`)}
                          className="group border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                        >
                          <TableCell className="py-5 pl-4">
                            <div className="flex items-center gap-3">
                              <PdfIcon size="sm" />
                              <span className="font-semibold text-sm text-slate-900 dark:text-white">{quote.quoteId}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-5 text-sm font-semibold text-slate-900 dark:text-white">
                            {toTitleCase(quote.clientName || quote.fullName || quote.schemeName || "Unnamed")}
                          </TableCell>
                          <TableCell className="py-5">
                            <Badge
                              variant="outline"
                              className={`rounded-full px-3 py-1 text-xs font-semibold border whitespace-nowrap ${getQuoteTypeBadgeClass(quote.type || "Unknown")}`}
                            >
                              {quote.type || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-5 text-sm text-slate-600 dark:text-slate-300">
                            {quote.createdByName || "—"}
                          </TableCell>
                          <TableCell className="py-5 text-sm text-slate-500 dark:text-slate-400">
                            {new Date(quote.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="py-5 text-right pr-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 border-0"
                                onClick={(e) => handleDownloadPdf(e, quote.quoteId, quote.id, quote.isLegacy || false)}
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                              </Button>
                              {userRole === "superuser" && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700/50 hover:bg-rose-100 dark:hover:bg-rose-900/30 border-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setDeleteQuoteId(quote.id)
                                      }}
                                      title="Delete Quote"
                                    >
                                      <Trash2 className="h-4 w-4 text-slate-700 dark:text-slate-200" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the quote.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setDeleteQuoteId(null)}>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => {
                                          handleDeleteQuote(quote.id, quote.isLegacy || false)
                                          setDeleteQuoteId(null)
                                        }}
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
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Showing {displayQuotes.length} of {filteredQuotes.length} quotes{typeFilter && ` (filtered by ${typeFilter})`}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
