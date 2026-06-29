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
    <div className="relative min-h-full -m-6 p-6 bg-gradient-to-br from-[#f2f5f7] via-[#e8f3f1] to-[#e0ebf5] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Ambient blur orbs */}
      <div className="pointer-events-none absolute -top-20 -right-10 w-96 h-96 bg-cyan-200/30 dark:bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-20 w-80 h-80 bg-emerald-100/40 dark:bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="relative space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-[#163144] dark:text-[#DFF3EB]">Dashboard</h2>
          <Button
            onClick={() => navigate("/calculator")}
            className="px-6 py-2.5 bg-[#009fe3] hover:bg-[#0089c4] text-white rounded-full font-bold text-sm tracking-wide shadow-lg shadow-[#009fe3]/30 transition-all active:scale-95"
          >
            New Quote
          </Button>
        </div>




        {/* Recent Quotes Table */}
        <Card className="bg-white/20 dark:bg-slate-800/30 backdrop-blur-3xl border border-white/40 dark:border-white/10 rounded-[2.5rem] shadow-2xl shadow-slate-200/20 dark:shadow-black/20">
          <CardHeader className="flex flex-row items-center justify-between px-8 pt-8 pb-4">
            <div>
              <CardTitle className="font-heading text-xl font-bold text-[#163144] dark:text-[#DFF3EB] tracking-tight">Recently Created</CardTitle>
              <CardDescription className="text-sm text-[#1B405B]/70 dark:text-[#DFF3EB]/60 mt-1 tracking-wide">Latest quotes created by your team</CardDescription>
            </div>
            {recentQuotes.length > maxDisplayQuotes && (
              <Button
                variant="outline"
                onClick={() => navigate("/quotes")}
                className="px-5 py-2 text-sm font-semibold text-[#163144] dark:text-[#DFF3EB] bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-full hover:bg-white transition-all tracking-wide"
              >
                Show All
              </Button>
            )}
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {loading ? (
              <PageLoader />
            ) : recentQuotes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No quotes found.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-b border-white/30 dark:border-white/10 hover:bg-transparent">
                        <TableHead className="text-xs font-semibold text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide pb-4 pl-4 normal-case">
                          Quote ID
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide pb-4 normal-case">
                          Client Name
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide pb-4 normal-case">
                          Type
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide pb-4 normal-case">
                          Created By
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide pb-4 normal-case">
                          Date
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide pb-4 text-right pr-4 normal-case">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-white/30 dark:divide-white/5">
                      {displayQuotes.map((quote) => (
                        <TableRow
                          key={quote.id}
                          onClick={() => navigate(`/quotes/${quote.id}?legacy=${quote.isLegacy || false}`)}
                          className="group border-0 hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer"
                        >
                          <TableCell className="py-5 pl-4">
                            <div className="flex items-center gap-3">
                              <PdfIcon size="sm" />
                              <span className="font-semibold text-sm text-[#163144] dark:text-[#DFF3EB] tracking-wide">{quote.quoteId}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-5 text-sm font-semibold text-[#163144] dark:text-[#DFF3EB] tracking-wide">
                            {toTitleCase(quote.clientName || quote.fullName || quote.schemeName || "Unnamed")}
                          </TableCell>
                          <TableCell className="py-5">
                            <Badge
                              variant="outline"
                              className={`rounded-full px-3 py-1 text-xs font-semibold border whitespace-nowrap tracking-wide ${getQuoteTypeBadgeClass(quote.type || "Unknown")}`}
                            >
                              {quote.type || "Unknown"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-5 text-sm text-[#1B405B]/80 dark:text-[#DFF3EB]/70 tracking-wide">
                            {quote.createdByName || "—"}
                          </TableCell>
                          <TableCell className="py-5 text-sm text-[#1B405B]/70 dark:text-[#DFF3EB]/60 tracking-wide">
                            {new Date(quote.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="py-5 text-right pr-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-white/60 dark:bg-white/5 hover:bg-white border border-white/50 dark:border-white/10"
                                onClick={(e) => handleDownloadPdf(e, quote.quoteId, quote.id, quote.isLegacy || false)}
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4 text-[#1B405B] dark:text-[#DFF3EB]" />
                              </Button>
                              {userRole === "superuser" && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full bg-white/60 dark:bg-white/5 hover:bg-rose-50 border border-white/50 dark:border-white/10"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setDeleteQuoteId(quote.id)
                                      }}
                                      title="Delete Quote"
                                    >
                                      <Trash2 className="h-4 w-4 text-[#1B405B] dark:text-[#DFF3EB]" />
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

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/30 dark:border-white/10">
                  <p className="text-sm font-medium text-[#1B405B]/70 dark:text-[#DFF3EB]/60 tracking-wide">
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
