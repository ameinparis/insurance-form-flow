import { useNavigate } from "react-router-dom"
import { FileText, CheckCircle2, Users, ShieldCheck, ArrowUpRight } from "lucide-react"

interface OverviewStatsProps {
  stats: {
    totalQuotations: number
    convertedQuotations: number
    activeClients: number
    activePolicies: number
  }
  loading: boolean
}

const cardBase =
  "rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"

export const OverviewStats = ({ stats, loading }: OverviewStatsProps) => {
  const navigate = useNavigate()

  const cards = [
    {
      title: "Total Quotations",
      value: stats.totalQuotations,
      subtitle: "All records (draft, pending, converted, rejected)",
      icon: FileText,
      badge: "bg-blue-500/15 text-blue-500 dark:text-blue-400",
      to: "/quotes",
    },
    {
      title: "Converted Quotations",
      value: stats.convertedQuotations,
      subtitle: "Accepted, ready for onboarding",
      icon: CheckCircle2,
      badge: "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400",
      to: "/quotes",
    },
    {
      title: "Active Clients",
      value: stats.activeClients,
      subtitle: "Linked after quotation conversion",
      icon: Users,
      badge: "bg-purple-500/15 text-purple-500 dark:text-purple-400",
      to: "/clients",
    },
    {
      title: "Active Policies",
      value: stats.activePolicies,
      subtitle: "Setup, verified and activated",
      icon: ShieldCheck,
      badge: "bg-orange-500/15 text-orange-500 dark:text-orange-400",
      to: "/clients",
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`${cardBase} p-6 animate-pulse h-48`} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <button
          key={card.title}
          onClick={() => navigate(card.to)}
          className={`group text-left ${cardBase} p-6 transition-all hover:border-slate-300 dark:hover:border-slate-600`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${card.badge}`}>
              <card.icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors group-hover:border-slate-400 dark:group-hover:border-slate-500">
              <ArrowUpRight className="h-4 w-4 text-slate-500 dark:text-slate-400" strokeWidth={2} />
            </div>
          </div>

          <p className="mt-5 text-base font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
            {card.title}
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {card.value}
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {card.subtitle}
          </p>
        </button>
      ))}
    </div>
  )
}
