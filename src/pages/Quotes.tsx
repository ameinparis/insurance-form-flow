import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, Download, Eye, FileText } from "lucide-react"
import { Link } from "react-router-dom"

const Quotes = () => {
  // Mock quotes data
  const quotes = [
    {
      id: 1,
      type: "auto",
      name: "John Doe",
      premium: 1200,
      status: "active",
      date: "2024-01-15"
    },
    {
      id: 2,
      type: "home",
      name: "Jane Smith",
      premium: 800,
      status: "pending",
      date: "2024-01-14"
    },
    {
      id: 3,
      type: "life",
      name: "Bob Johnson",
      premium: 2400,
      status: "active",
      date: "2024-01-13"
    }
  ]

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Quotes</h2>
          <p className="text-muted-foreground">Manage and view all your insurance quotes.</p>
        </div>
        <Button asChild>
          <Link to="/calculate">
            <Calculator className="h-4 w-4 mr-2" />
            New Quote
          </Link>
        </Button>
      </div>

      {quotes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No quotes yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first insurance quote calculation.
            </p>
            <Button asChild>
              <Link to="/calculate">
                <Calculator className="h-4 w-4 mr-2" />
                Create First Quote
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {quotes.map((quote) => (
            <Card key={quote.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {quote.name}
                    </CardTitle>
                    <CardDescription>
                      Quote #{quote.id} • {new Date(quote.date).toLocaleDateString()}
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
                      ${quote.premium.toLocaleString()}/year
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ${Math.round(quote.premium / 12)}/month
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