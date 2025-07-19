import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Calculator, Download, Eye, FileText, Search, Filter } from "lucide-react"
import { Link } from "react-router-dom"

const Quotes = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("date")
  const [filterBy, setFilterBy] = useState("all")

  // Enhanced mock quotes data with more fields
  const quotes = [
    {
      id: "Q001",
      type: "Life Funeral",
      clientName: "John Doe",
      createdBy: "Agent Smith",
      premium: 1200,
      status: "active",
      date: "2024-01-15",
      quoteNumber: "LF2024001"
    },
    {
      id: "Q002", 
      type: "Living Annuities",
      clientName: "Jane Smith",
      createdBy: "Agent Johnson",
      premium: 800,
      status: "pending",
      date: "2024-01-14",
      quoteNumber: "LA2024002"
    },
    {
      id: "Q003",
      type: "Group Life Assurance",
      clientName: "Bob Johnson",
      createdBy: "Agent Smith",
      premium: 2400,
      status: "active",
      date: "2024-01-13",
      quoteNumber: "GLA2024003"
    },
    {
      id: "Q004",
      type: "Credit Life Cover",
      clientName: "Alice Brown",
      createdBy: "Agent Davis",
      premium: 600,
      status: "expired",
      date: "2024-01-12",
      quoteNumber: "CLC2024004"
    },
    {
      id: "Q005",
      type: "Critical Illness Cover",
      clientName: "Charlie Wilson",
      createdBy: "Agent Johnson",
      premium: 1800,
      status: "pending",
      date: "2024-01-11",
      quoteNumber: "CIC2024005"
    }
  ]

  const filteredAndSortedQuotes = useMemo(() => {
    let filtered = quotes

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(quote =>
        quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by type/status
    if (filterBy !== "all") {
      if (["active", "pending", "expired"].includes(filterBy)) {
        filtered = filtered.filter(quote => quote.status === filterBy)
      } else {
        filtered = filtered.filter(quote => quote.type.toLowerCase().includes(filterBy.toLowerCase()))
      }
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "client":
          return a.clientName.localeCompare(b.clientName)
        case "agent":
          return a.createdBy.localeCompare(b.createdBy)
        case "type":
          return a.type.localeCompare(b.type)
        case "premium":
          return b.premium - a.premium
        default:
          return 0
      }
    })

    return filtered
  }, [quotes, searchTerm, sortBy, filterBy])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "expired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    // Return appropriate icon based on insurance type
    return <FileText className="h-5 w-5" />
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

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quotes</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="life">Life Insurance</SelectItem>
                <SelectItem value="living">Living Annuities</SelectItem>
                <SelectItem value="group">Group Life</SelectItem>
                <SelectItem value="credit">Credit Life</SelectItem>
                <SelectItem value="critical">Critical Illness</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              Showing {filteredAndSortedQuotes.length} of {quotes.length} quotes
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredAndSortedQuotes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || filterBy !== "all" ? "No matching quotes found" : "No quotes yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filterBy !== "all" 
                ? "Try adjusting your search or filter criteria."
                : "Start by creating your first insurance quote calculation."
              }
            </p>
            {!searchTerm && filterBy === "all" && (
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getTypeIcon(quote.type)}
                      {quote.clientName}
                    </CardTitle>
                    <CardDescription>
                      Quote #{quote.quoteNumber} • Created by {quote.createdBy} • {new Date(quote.date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(quote.status)}>
                      {quote.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {quote.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      R{quote.premium.toLocaleString()}/year
                    </p>
                    <p className="text-sm text-muted-foreground">
                      R{Math.round(quote.premium / 12)}/month
                    </p>
                  </div>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default Quotes