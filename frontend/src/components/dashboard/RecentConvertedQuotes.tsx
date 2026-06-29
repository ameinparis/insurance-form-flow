import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InfoTooltip } from "@/components/ui/info-tooltip"

export interface ConvertedQuote {
  id: string
  quoteNumber: string
  applicantName: string
  investmentAmount: string
  convertedDate: string
}

interface RecentConvertedQuotesProps {
  items: ConvertedQuote[]
  onAction?: (id: string) => void
}

export const RecentConvertedQuotes = ({ items, onAction }: RecentConvertedQuotesProps) => (
  <div className="relative overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-black/20 p-6">
    <div className="flex items-center gap-2 mb-1">
      <h3 className="font-heading text-lg font-bold text-[#163144] dark:text-[#DFF3EB] tracking-tight">Recent Converted Quotes</h3>
      <InfoTooltip text="Recently accepted quotes that are ready to create/link a client or continue policy setup." />
    </div>
    <p className="text-xs text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide mb-4">Ready to onboard as clients/policies</p>

    {items.length === 0 ? (
      <div className="text-center py-10 text-sm text-[#1B405B]/55 dark:text-[#DFF3EB]/45">
        No converted quotes yet.
      </div>
    ) : (
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-white/30 dark:border-white/10 hover:bg-transparent">
              {["Quote Number", "Applicant Name", "Investment Amount", "Converted Date", "Action"].map(h => (
                <TableHead key={h} className="text-xs font-semibold text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide pb-3 normal-case">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-white/30 dark:divide-white/5">
            {items.map(item => (
              <TableRow key={item.id} className="border-0 hover:bg-white/40 dark:hover:bg-white/5">
                <TableCell className="py-4 text-sm font-semibold text-[#163144] dark:text-[#DFF3EB]">{item.quoteNumber}</TableCell>
                <TableCell className="py-4 text-sm text-[#1B405B]/80 dark:text-[#DFF3EB]/70">{item.applicantName}</TableCell>
                <TableCell className="py-4 text-sm text-[#1B405B]/80 dark:text-[#DFF3EB]/70">{item.investmentAmount}</TableCell>
                <TableCell className="py-4 text-sm text-[#1B405B]/70 dark:text-[#DFF3EB]/60">{new Date(item.convertedDate).toLocaleDateString()}</TableCell>
                <TableCell className="py-4">
                  <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => onAction?.(item.id)}>
                    Create / Link Client
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )}
  </div>
)
