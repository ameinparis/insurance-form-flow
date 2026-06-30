import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Search, UserCheck, FileText, ArrowLeft } from "lucide-react"
import { useQuotesList } from "@/hooks/useQuotesList"
import { fetchQuoteDetails, QuoteData } from "@/lib/quoteUtils"
import { useToast } from "@/hooks/use-toast"
import { toTitleCase } from "@/lib/quoteUtils"
import { PolicyDetailsDialog } from "@/components/PolicyDetailsDialog"


interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
}

type Step = "search" | "scenario"

export const ConvertQuoteDialog = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data: quotes = [] } = useQuotesList()
  const [term, setTerm] = useState("")
  const [step, setStep] = useState<Step>("search")
  const [loadingQuoteId, setLoadingQuoteId] = useState<string | null>(null)
  const [pickedQuote, setPickedQuote] = useState<QuoteData | null>(null)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)

  const matches = useMemo(() => {
    const q = term.trim().toLowerCase()
    if (!q) return []
    return quotes
      .filter((quote) => (quote.clientName || quote.fullName || "").toLowerCase().includes(q))
      .slice(0, 25)
  }, [term, quotes])

  const reset = () => {
    setTerm("")
    setStep("search")
    setPickedQuote(null)
    setSelectedScenarioId(null)
    setLoadingQuoteId(null)
    setConverting(false)
  }

  const handlePickQuote = async (quoteId: string, isLegacy: boolean) => {
    setLoadingQuoteId(quoteId)
    try {
      const full = await fetchQuoteDetails(quoteId, isLegacy)
      const scenarios: any[] = Array.isArray(full.outputs?.scenarios) ? full.outputs.scenarios : []
      setPickedQuote(full)
      if (scenarios.length > 1) {
        setStep("scenario")
      } else {
        await doConvert(full)
      }
    } catch (err) {
      console.error(err)
      toast({ title: "Error", description: "Could not load quote.", variant: "destructive" })
    } finally {
      setLoadingQuoteId(null)
    }
  }

  const doConvert = async (quote: QuoteData, scenarioId?: string) => {
    setConverting(true)
    try {
      await new Promise((r) => setTimeout(r, 900))
      const { client, policy } = convertQuoteToPolicy(quote, scenarioId)
      toast({
        title: "Policy created",
        description: `Draft policy ${policy.policyNumber} created for ${client.fullName}.`,
      })
      onOpenChange(false)
      reset()
      navigate(`/clients/${client.id}`)
    } catch (err) {
      console.error(err)
      toast({ title: "Conversion failed", description: "Please try again.", variant: "destructive" })
    } finally {
      setConverting(false)
    }
  }

  const scenarios: any[] =
    pickedQuote && Array.isArray(pickedQuote.outputs?.scenarios) ? pickedQuote.outputs.scenarios : []

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) reset()
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {step === "search" ? "Convert Quote to Policy" : "Select Annuity Income Option"}
          </DialogTitle>
          <DialogDescription>
            {step === "search"
              ? "Search by client name or surname, then pick a quote to convert."
              : `${pickedQuote?.client?.fullName || pickedQuote?.fullName || "This quote"} has multiple options — pick the one to convert.`}
          </DialogDescription>
        </DialogHeader>

        {step === "search" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search by name or surname..."
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {term.trim() === "" ? (
                <div className="p-6 text-sm text-center text-muted-foreground">Start typing to search quotes.</div>
              ) : matches.length === 0 ? (
                <div className="p-6 text-sm text-center text-muted-foreground">No quotes match "{term}".</div>
              ) : (
                matches.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handlePickQuote(q.id, q.isLegacy)}
                    disabled={loadingQuoteId !== null}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors disabled:opacity-60"
                  >
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {toTitleCase(q.clientName || q.fullName || "Unnamed")}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {q.quoteId} · {q.type}
                      </p>
                    </div>
                    {loadingQuoteId === q.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {step === "scenario" && pickedQuote && (
          <div className="space-y-3">
            <div className="max-h-80 overflow-y-auto space-y-2">
              {scenarios.map((sc, idx) => {
                const sIn = sc?.inputs || {}
                const sLiving = sc?.outputs?.living || {}
                const selected = selectedScenarioId === sc.id
                return (
                  <button
                    key={sc.id || idx}
                    onClick={() => setSelectedScenarioId(sc.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selected
                        ? "border-[#009fe3] bg-[#009fe3]/5 ring-2 ring-[#009fe3]/30"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <p className="text-sm font-semibold">
                      {sc.label || `Option ${idx + 1}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Drawdown {sIn.drawdown ?? "—"}% · {sIn.frequency ?? "—"}
                      {sLiving.guarantee_period != null ? ` · ${sLiving.guarantee_period}yr guarantee` : ""}
                    </p>
                  </button>
                )
              })}
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setStep("search")
                  setPickedQuote(null)
                  setSelectedScenarioId(null)
                }}
                disabled={converting}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => pickedQuote && doConvert(pickedQuote, selectedScenarioId || undefined)}
                disabled={!selectedScenarioId || converting}
                className="bg-[#163144] hover:bg-[#163144]/90 text-white"
              >
                {converting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" />
                    Convert to Policy
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "search" && converting && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Converting...
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
