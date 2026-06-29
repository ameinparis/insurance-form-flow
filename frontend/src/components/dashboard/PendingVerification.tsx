import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { InfoTooltip } from "@/components/ui/info-tooltip"

export interface PendingItem {
  id: string
  clientName: string
  policyNumber: string
  missingDocuments: string[]
  status: string
  assignedUser: string
}

interface PendingVerificationProps {
  items: PendingItem[]
}

export const PendingVerification = ({ items }: PendingVerificationProps) => (
  <div className="relative overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-black/20 p-6">
    <div className="flex items-center gap-2 mb-1">
      <h3 className="font-heading text-lg font-bold text-[#163144] dark:text-[#DFF3EB] tracking-tight">Pending Verification</h3>
      <InfoTooltip text="Items that require review before the policy can continue or become active." />
    </div>
    <p className="text-xs text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide mb-4">Awaiting admin or compliance attention</p>

    {items.length === 0 ? (
      <div className="text-center py-10 text-sm text-[#1B405B]/55 dark:text-[#DFF3EB]/45">
        Nothing pending verification.
      </div>
    ) : (
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-white/30 dark:border-white/10 hover:bg-transparent">
              {["Client Name", "Policy Number", "Missing / Pending Documents", "Status", "Assigned User", "Action"].map(h => (
                <TableHead key={h} className="text-xs font-semibold text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide pb-3 normal-case">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-white/30 dark:divide-white/5">
            {items.map(item => (
              <TableRow key={item.id} className="border-0 hover:bg-white/40 dark:hover:bg-white/5">
                <TableCell className="py-4 text-sm font-semibold text-[#163144] dark:text-[#DFF3EB]">{item.clientName}</TableCell>
                <TableCell className="py-4 text-sm text-[#1B405B]/80 dark:text-[#DFF3EB]/70 tracking-wide">{item.policyNumber}</TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-wrap gap-1">
                    {item.missingDocuments.map(d => (
                      <Badge key={d} variant="outline" className="rounded-full px-2 py-0.5 text-[10px] font-medium border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <Badge className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 border-0">{item.status}</Badge>
                </TableCell>
                <TableCell className="py-4 text-sm text-[#1B405B]/80 dark:text-[#DFF3EB]/70 tracking-wide">{item.assignedUser}</TableCell>
                <TableCell className="py-4">
                  <Button size="sm" variant="outline" className="rounded-full text-xs">Review</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )}
  </div>
)
