import { Users, ShieldCheck, FileEdit, ClipboardCheck, CheckCircle2, Calendar, ArrowUpRight } from "lucide-react"
import { InfoTooltip } from "@/components/ui/info-tooltip"

interface CrmSummary {
  totalClients: number
  activePolicies: number
  draftPolicies: number
  pendingVerification: number
  convertedQuotes: number
  policiesActivatedThisMonth: number
}

interface CrmSummaryCardsProps {
  summary: CrmSummary
  loading?: boolean
}

const STYLES = [
  { grad: "bg-[radial-gradient(circle_at_30%_25%,#a5d8ff_0%,#4dabf7_45%,#1c7ed6_100%)]", shadow: "shadow-[0_8px_20px_-6px_rgba(28,126,214,0.55)]" },
  { grad: "bg-[radial-gradient(circle_at_30%_25%,#b2f2bb_0%,#51cf66_45%,#2f9e44_100%)]", shadow: "shadow-[0_8px_20px_-6px_rgba(47,158,68,0.5)]" },
  { grad: "bg-[radial-gradient(circle_at_30%_25%,#cbd5e1_0%,#94a3b8_45%,#475569_100%)]", shadow: "shadow-[0_8px_20px_-6px_rgba(71,85,105,0.5)]" },
  { grad: "bg-[radial-gradient(circle_at_30%_25%,#fde68a_0%,#fbbf24_45%,#d97706_100%)]", shadow: "shadow-[0_8px_20px_-6px_rgba(217,119,6,0.5)]" },
  { grad: "bg-[radial-gradient(circle_at_30%_25%,#e599f7_0%,#cc5de8_45%,#9c36b5_100%)]", shadow: "shadow-[0_8px_20px_-6px_rgba(156,54,181,0.55)]" },
  { grad: "bg-[radial-gradient(circle_at_30%_25%,#ffc9a8_0%,#ff8a65_45%,#e8542b_100%)]", shadow: "shadow-[0_8px_20px_-6px_rgba(232,84,43,0.55)]" },
]

export const CrmSummaryCards = ({ summary, loading }: CrmSummaryCardsProps) => {
  const cards = [
    { title: "Total Clients", value: summary.totalClients, icon: Users, info: "Total number of actual CRM clients. This does not include quotation applicants who have not been converted.", style: STYLES[0] },
    { title: "Active Policies", value: summary.activePolicies, icon: ShieldCheck, info: "Policies that have completed setup, verification, and activation.", style: STYLES[1] },
    { title: "Draft Policies", value: summary.draftPolicies, icon: FileEdit, info: "Policies that have been created but are not yet fully completed or activated.", style: STYLES[2] },
    { title: "Pending Verification", value: summary.pendingVerification, icon: ClipboardCheck, info: "Policies or documents waiting for admin/compliance review.", style: STYLES[3] },
    { title: "Converted Quotes", value: summary.convertedQuotes, icon: CheckCircle2, info: "Quotes that have been accepted/approved and moved into the client or policy onboarding process.", style: STYLES[4] },
    { title: "Policies Activated This Month", value: summary.policiesActivatedThisMonth, icon: Calendar, info: "Number of policies activated during the current month.", style: STYLES[5] },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 p-5 rounded-[1.75rem] animate-pulse h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map((card, i) => (
        <div key={i} className="group relative overflow-hidden bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 p-4 rounded-[1.75rem] shadow-xl shadow-slate-200/40 dark:shadow-black/20 transition-all hover:-translate-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className={`relative w-10 h-10 rounded-full ${card.style.grad} ${card.style.shadow} flex items-center justify-center shrink-0`}>
              <div className="absolute top-1 left-1.5 w-2 h-1.5 rounded-full bg-white/50 blur-[1px]" />
              <card.icon className="h-4.5 w-4.5 text-white relative z-10" strokeWidth={2.25} />
            </div>
            <div className="w-7 h-7 rounded-full border border-[#163144]/15 dark:border-white/15 flex items-center justify-center shrink-0">
              <ArrowUpRight className="h-3.5 w-3.5 text-[#163144]/60 dark:text-[#DFF3EB]/60" strokeWidth={2} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <p className="text-xs font-semibold text-[#1B405B]/70 dark:text-[#DFF3EB]/60 tracking-wide leading-tight">{card.title}</p>
            <InfoTooltip text={card.info} />
          </div>
          <p className="font-heading text-3xl font-extrabold text-[#163144] dark:text-[#DFF3EB] tracking-tight mt-1">{card.value}</p>
        </div>
      ))}
    </div>
  )
}
