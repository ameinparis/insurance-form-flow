import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buildStatement, formatDate, formatMoney, formatPrice, formatUnits, type StoredPurchase, type StoredMarketAdjustment } from "@/lib/investmentStatement"

export function InvestmentStatementSection({ purchases, fundId, adjustments = [] }: { purchases: StoredPurchase[]; fundId?: string; adjustments?: StoredMarketAdjustment[] }) {
  const rows = buildStatement(purchases, fundId, adjustments)
  return (
    <div data-investment-statement className="mt-6 rounded-xl border border-border p-4">
      <p className="text-sm font-semibold mb-2">Investment Statement</p>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No investment transactions recorded yet.</p> : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Description</TableHead>
              <TableHead className="text-right">Number of Units</TableHead><TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Market Value</TableHead><TableHead className="text-right">Closing Balance</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={`${r.type}-${r.date}-${i}`}>
                  <TableCell className="whitespace-nowrap">{formatDate(r.date)}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.description}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{r.units ? formatUnits(r.units) : ""}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{r.unitPrice ? formatPrice(r.unitPrice) : "—"}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatMoney(r.marketValue)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap font-semibold">{formatMoney(r.closingBalance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
