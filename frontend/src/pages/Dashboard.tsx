import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/authlibrary"
import pdfIcon from "@/assets/pdf-icon.png"
import { StatsCards } from "@/components/dashboard/StatsCards"

const Dashboard = () => {
  const navigate = useNavigate()
  const [recentQuotes, setRecentQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { userRole } = useAuth()
  const maxDisplayQuotes = 50

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

  // Limit to 50 quotes for dashboard display
  const displayQuotes = recentQuotes.slice(0, maxDisplayQuotes)

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards quotes={recentQuotes} loading={loading} />

      <div>
        <h2 className="text-3xl font-bold font-heading">Dashboard</h2>
      </div>

      {/* Recent Quotes Table */}
      <Card className="bg-gray-50 dark:bg-slate-800 rounded-3xl border-0">
        <CardHeader>
          <CardTitle className="font-heading">Recently Created</CardTitle>
          <CardDescription>Latest quotes created by your team</CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading quotes...</div>
          ) : recentQuotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No quotes found.</div>
          ) : (
            <>
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
                    {displayQuotes.map((quote) => (
                      <TableRow
                        key={quote.id}
                        onClick={() => navigate(`/quotes/${quote.id}?legacy=${quote.isLegacy || false}`)}
                        className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:bg-sky-100 dark:hover:bg-sky-900/30 hover:border-sky-200 dark:hover:border-sky-700 transition-all duration-200 my-2 overflow-hidden cursor-pointer"
                      >
                        <TableCell className="py-5 px-6 rounded-l-xl">
                          <div className="flex items-center gap-3">
                            <img src={pdfIcon} alt="PDF" className="h-8 w-8 flex-shrink-0" />
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
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteQuote(quote.id)
                                }}
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

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-sm text-muted-foreground">
                  Showing {displayQuotes.length} of {recentQuotes.length} quotes
                </p>
                {recentQuotes.length > maxDisplayQuotes && (
                  <Button
                    variant="outline"
                    onClick={() => navigate("/quotes")}
                    className="text-[#009fe3] border-[#009fe3] hover:bg-[#009fe3]/10"
                  >
                    Show All
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
