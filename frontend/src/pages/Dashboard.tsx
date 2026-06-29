import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useQuotesList } from "@/hooks/useQuotesList"
import { CrmSummaryCards } from "@/components/dashboard/CrmSummaryCards"
import { PolicyStatusOverview } from "@/components/dashboard/PolicyStatusOverview"
import { RecentActivity, ActivityItem } from "@/components/dashboard/RecentActivity"
import { PendingVerification } from "@/components/dashboard/PendingVerification"
import { RecentConvertedQuotes, ConvertedQuote } from "@/components/dashboard/RecentConvertedQuotes"
import { toTitleCase } from "@/lib/quoteUtils"
import { toast } from "sonner"

const Dashboard = () => {
  const navigate = useNavigate()
  const { data: quotes = [], isLoading } = useQuotesList()
  const loading = isLoading && quotes.length === 0

  // Derive CRM metrics from available data. Policies/clients module not yet wired,
  // so unknown counts show as 0 with empty states.
  const summary = useMemo(() => {
    const convertedQuotes = quotes.filter((q: any) => (q.status || "").toLowerCase() === "converted").length
    return {
      totalClients: 0,
      activePolicies: 0,
      draftPolicies: 0,
      pendingVerification: 0,
      convertedQuotes,
      policiesActivatedThisMonth: 0,
    }
  }, [quotes])

  const policyCounts: Record<string, number> = {
    draft: 0, pendingVerification: 0, approved: 0, active: 0,
    suspended: 0, cancelled: 0, claimed: 0, closed: 0,
  }

  // Build a lightweight activity feed from recent quote events as a starter.
  const recentActivity: ActivityItem[] = useMemo(() => {
    const sorted = [...quotes].sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return sorted.slice(0, 8).map((q: any) => ({
      id: q.id,
      kind: ((q.status || "").toLowerCase() === "converted" ? "quote_converted" : "draft_policy") as ActivityItem["kind"],
      message:
        (q.status || "").toLowerCase() === "converted"
          ? `Quote ${q.quoteId} for ${toTitleCase(q.fullName || q.clientName || "applicant")} converted`
          : `Quote ${q.quoteId} created for ${toTitleCase(q.fullName || q.clientName || "applicant")}`,
      at: q.createdAt,
    }))
  }, [quotes])

  const recentConverted: ConvertedQuote[] = useMemo(() => {
    return quotes
      .filter((q: any) => (q.status || "").toLowerCase() === "converted")
      .slice(0, 5)
      .map((q: any) => ({
        id: q.id,
        quoteNumber: q.quoteId,
        applicantName: toTitleCase(q.fullName || q.clientName || "—"),
        investmentAmount: q.investmentAmount
          ? `BWP ${Number(q.investmentAmount).toLocaleString()}`
          : q.premium
          ? `BWP ${Number(q.premium).toLocaleString()}`
          : "—",
        convertedDate: q.convertedAt || q.createdAt,
      }))
  }, [quotes])

  return (
    <div className="relative min-h-full -m-6 p-6 bg-gradient-to-br from-[#f2f5f7] via-[#e8f3f1] to-[#e0ebf5] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="pointer-events-none absolute -top-20 -right-10 w-96 h-96 bg-cyan-200/30 dark:bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-20 w-80 h-80 bg-emerald-100/40 dark:bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="relative space-y-6">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-[#163144] dark:text-[#DFF3EB]">Dashboard</h2>
            <p className="text-sm text-[#1B405B]/65 dark:text-[#DFF3EB]/55 tracking-wide mt-1">
              CRM lifecycle overview: quotation → converted quote → client → draft policy → verification → active policy
            </p>
          </div>
          <Button
            onClick={() => navigate("/calculator")}
            className="px-6 py-2.5 bg-[#009fe3] hover:bg-[#0089c4] text-white rounded-full font-bold text-sm tracking-wide shadow-lg shadow-[#009fe3]/30 transition-all active:scale-95"
          >
            New Quote
          </Button>
        </div>

        <CrmSummaryCards summary={summary} loading={loading} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><PolicyStatusOverview counts={policyCounts} /></div>
          <RecentActivity items={recentActivity} />
        </div>

        <PendingVerification items={[]} />
        <RecentConvertedQuotes items={recentConverted} onAction={() => toast.info("Client onboarding coming soon")} />
      </div>
    </div>
  )
}

export default Dashboard
