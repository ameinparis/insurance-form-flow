import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calculator, Download, Eye, Trash2, FileText, Search, Filter, ArrowUpDown } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/lib/authlibrary"

const Quotes = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { userRole } = useAuth()

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

  const handleDeleteQuote = async (quoteId: string) => {
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

      <Card>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
        <Card><CardContent className="py-12 text-center text-muted-foreground">Loading quotes...</CardContent></Card>
      ) : filteredAndSortedQuotes.length === 0 ? (
        <Card>
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
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-800">
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200 py-4">
                      SL
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">
                      Quote ID
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">
                      Client Name
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Email</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Phone</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Type</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">
                      Created By
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">
                      Date
                    </TableHead>
                    <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-200">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedQuotes.map((quote, idx) => (
                    <TableRow 
                      key={quote.id} 
                      className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-gray-50/50 dark:bg-slate-900/50"}
                    >
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        {String(idx + 1).padStart(2, '0')}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        {quote.quoteId}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {quote.fullName || "Unnamed"}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {quote.email || "—"}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {quote.contactNumber || "—"}
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
                        {quote.createdByName}
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

            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {filteredAndSortedQuotes.length} out of {quotes.length} quotes
              </p>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}

export default Quotes
