import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toTitleCase } from "@/lib/quoteUtils"

interface ConvertQuote {
  id: string
  quoteId?: string
  type?: string
  clientName?: string
  fullName?: string
  schemeName?: string
  createdAt: string
}

interface ConvertQuoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotes: ConvertQuote[]
}

export const ConvertQuoteDialog = ({ open, onOpenChange, quotes }: ConvertQuoteDialogProps) => {
  const [term, setTerm] = useState("")

  const results = useMemo(() => {
    const q = term.trim().toLowerCase()
    if (!q) return []
    return quotes
      .filter((quote) =>
        `${quote.clientName || ""} ${quote.fullName || ""} ${quote.schemeName || ""} ${quote.quoteId || ""}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 8)
  }, [quotes, term])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">Convert Quote to Policy</DialogTitle>
          <DialogDescription>
            Search by client name or surname, then pick a quote to convert.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search by name or surname..."
            className="pl-11 h-12 rounded-2xl"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 min-h-[140px] max-h-[320px] overflow-y-auto">
          {!term.trim() ? (
            <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              Start typing to search quotes.
            </p>
          ) : results.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No matching quotes found.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {results.map((quote) => (
                <button
                  key={quote.id}
                  onClick={() =>
                    toast.info("Policy conversion isn't wired up yet — coming soon.")
                  }
                  className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {toTitleCase(quote.clientName || quote.fullName || quote.schemeName || "Unnamed")}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{quote.quoteId}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 whitespace-nowrap"
                  >
                    {quote.type || "Quote"}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
