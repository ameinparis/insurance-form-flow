import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calculator, Download, Eye, Trash2, FileText, Search, Filter } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "@/lib/authlibrary"

const Quotes = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [previewQuote, setPreviewQuote] = useState<any | null>(null)
  const { userRole } = useAuth()

useEffect(() => {
  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [oldRes, newRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5002"}/api/quotes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5002"}/api/new-quotes`, {
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
        type: "Legacy",
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
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5002"}/api/quotes/${quoteId}`, {
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
                {filteredAndSortedQuotes.map((quote, idx) => (
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setPreviewQuote(quote)}
                        >
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

            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {filteredAndSortedQuotes.length} out of {quotes.length} quotes
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewQuote} onOpenChange={() => setPreviewQuote(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quote Preview</DialogTitle>
            <DialogDescription>Quote #{previewQuote?.quoteId}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Preview functionality will be added with backend integration.
            </p>
            {previewQuote && (
              <div className="space-y-2 text-sm">
                <div><strong>Client:</strong> {previewQuote.fullName || "Unnamed"}</div>
                <div><strong>Email:</strong> {previewQuote.email || "—"}</div>
                <div><strong>Phone:</strong> {previewQuote.contactNumber || "—"}</div>
                <div><strong>Type:</strong> {previewQuote.type || "Funeral"}</div>
                <div><strong>Created By:</strong> {previewQuote.createdByName}</div>
                <div><strong>Date:</strong> {new Date(previewQuote.createdAt).toLocaleDateString()}</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Quotes
