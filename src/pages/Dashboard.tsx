
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Calculator, FileText, TrendingUp, Download } from "lucide-react"
import { Link } from "react-router-dom"

const Dashboard = () => {
  // Mock recently created quotes data
  const recentQuotes = [
    {
      id: "EXQ-0012/25",
      createdBy: "Kesego Gosata-Mosweu",
      customerName: "Motlapele Raleru",
      productName: "Living Annuity",
      frequency: "Monthly",
      contact: "71633111",
      quoteCreated: "11/07/2025"
    },
    {
      id: "EXQ-0011/25",
      createdBy: "ame busang",
      customerName: "ame busang",
      productName: "Living Annuity",
      frequency: "Monthly",
      contact: "72791628",
      quoteCreated: "10/07/2025"
    },
    {
      id: "EXQ-0010/25",
      createdBy: "Oratile Busang",
      customerName: "Tsentle Mothusi",
      productName: "Living Annuity",
      frequency: "Monthly",
      contact: "72791628",
      quoteCreated: "23/06/2025"
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
        <p className="text-muted-foreground">Manage your quotations and calculations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calculations</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">+8 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recently Created</CardTitle>
          <CardDescription>Latest quotes created by your team</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote ID</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Quote Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentQuotes.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <div className="h-6 w-6 bg-red-500 rounded flex items-center justify-center text-white text-xs">
                      PDF
                    </div>
                    {quote.id}
                  </TableCell>
                  <TableCell>{quote.createdBy}</TableCell>
                  <TableCell>{quote.customerName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{quote.productName}</Badge>
                  </TableCell>
                  <TableCell>{quote.frequency}</TableCell>
                  <TableCell>{quote.contact}</TableCell>
                  <TableCell>{quote.quoteCreated}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4 text-blue-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with your quotation process</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button asChild>
            <Link to="/living-annuity-calculator">
              <Calculator className="h-4 w-4 mr-2" />
              Living Annuity Calculator
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/quotes">
              <FileText className="h-4 w-4 mr-2" />
              View Quotes
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
