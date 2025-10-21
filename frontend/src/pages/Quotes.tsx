import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Calculator, Download, Eye, FileText, Search, Filter } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

const Quotes = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5002"}/api/quotes`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("Failed to fetch quotes")
        const data = await res.json()
        const mapped = data.map((q: any) => ({ ...q, id: q._id }))
        setQuotes(mapped)
      } catch (err) {
        console.error("Error loading quotes:", err)
        toast.error("Failed to load quotes")
      } finally {
        setLoading(false)
      }
    }

    fetchQuotes()
  }, [])

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

  const getTypeIcon = (type: string) => <FileText className="h-5 w-5" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Quotation Management</h2>
          <p className="text-muted-foreground">Manage and view all your funeral insurance quotes.</p>
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
                : "Start by creating your first funeral quote."}
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
        <div className="grid gap-4">
          {filteredAndSortedQuotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getTypeIcon(quote.type)}
                  {quote.fullName || "Unnamed client"}
                </CardTitle>
                <CardDescription>
                  Quote #{quote.quoteId || quote.id}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-lg font-medium text-primary capitalize">
                    {quote.type || "Life Funeral"}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Created by {quote.createdByName || "Unknown"} • {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : "N/A"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Quotes
