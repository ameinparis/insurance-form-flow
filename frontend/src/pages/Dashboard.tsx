import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ConvertQuoteDialog } from "@/components/ConvertQuoteDialog"
import { getCRMStats, subscribeCRM, type CRMStats } from "@/lib/clientStore"

import { useQuotesList } from "@/hooks/useQuotesList"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  CheckCircle2,
  Users,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  FilePlus,
  UserPlus,
  FileSignature,
  Upload,
  RefreshCw,
  AlertCircle,
  Repeat2,
} from "lucide-react"

import { toTitleCase } from "@/lib/quoteUtils"

const CARD_STYLES = [
  {
    iconGradient: "bg-[radial-gradient(circle_at_30%_25%,#a5d8ff_0%,#4dabf7_45%,#1c7ed6_100%)]",
    shadow: "shadow-[0_8px_20px_-6px_rgba(28,126,214,0.55)]",
  },
  {
    iconGradient: "bg-[radial-gradient(circle_at_30%_25%,#b2f2bb_0%,#51cf66_45%,#2f9e44_100%)]",
    shadow: "shadow-[0_8px_20px_-6px_rgba(47,158,68,0.5)]",
  },
  {
    iconGradient: "bg-[radial-gradient(circle_at_30%_25%,#e599f7_0%,#cc5de8_45%,#9c36b5_100%)]",
    shadow: "shadow-[0_8px_20px_-6px_rgba(156,54,181,0.55)]",
  },
  {
    iconGradient: "bg-[radial-gradient(circle_at_30%_25%,#ffd8a8_0%,#ffa94d_45%,#e8590c_100%)]",
    shadow: "shadow-[0_8px_20px_-6px_rgba(232,89,12,0.55)]",
  },
  {
    iconGradient: "bg-[radial-gradient(circle_at_30%_25%,#ffc9c9_0%,#ff8787_45%,#e03131_100%)]",
    shadow: "shadow-[0_8px_20px_-6px_rgba(224,49,49,0.55)]",
  },
]

const STATUS_BADGES: Record<string, { text: string; className: string }> = {
  draft: { text: "DRAFT", className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600" },
  converted: { text: "CONVERTED", className: "bg-[#163144] text-white border-[#163144] dark:bg-white dark:text-[#163144] dark:border-white" },
  new: { text: "NEW", className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600" },
  action: { text: "ACTION REQ.", className: "bg-white text-red-700 border-red-400 dark:bg-transparent dark:text-red-400 dark:border-red-500" },
  system: { text: "SYSTEM", className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600" },
}

interface ActivityItem {
  id: string
  icon: typeof FileText
  iconColor: string
  title: string
  highlight: string
  highlightIsRed?: boolean
  time: string
  statusKey: keyof typeof STATUS_BADGES
}

const Dashboard = () => {
  const navigate = useNavigate()
  const { data: recentQuotes = [] } = useQuotesList()
  const [convertOpen, setConvertOpen] = useState(false)
  const [crmStats, setCrmStats] = useState<CRMStats>(() => getCRMStats())

  useEffect(() => {
    const refresh = () => setCrmStats(getCRMStats())
    refresh()
    const unsub = subscribeCRM(refresh)
    return unsub
  }, [])

  const statCards = [
    { title: "Total Quotations", subtitle: "All records (draft, pending, converted, rejected)", value: recentQuotes.length, icon: FileText, style: CARD_STYLES[0] },
    { title: "Converted Quotations", subtitle: "Accepted, ready for onboarding", value: crmStats.convertedQuotes, icon: CheckCircle2, style: CARD_STYLES[1] },
    { title: "Active Clients", subtitle: "Linked after quotation conversion", value: crmStats.totalClients, icon: Users, style: CARD_STYLES[2] },
    { title: "Active Policies", subtitle: "Setup, verified and activated", value: crmStats.activePolicies, icon: ShieldCheck, style: CARD_STYLES[3] },
    { title: "Pending Verification", subtitle: "Awaiting admin / compliance review", value: crmStats.pendingVerification, icon: Clock, style: CARD_STYLES[4] },
  ]


  // Build mock recent activity feed using real names from quotes
  const activity: ActivityItem[] = useMemo(() => {
    const sample = recentQuotes.slice(0, 8)
    const templates: ActivityItem[] = [
      { id: "a1", icon: FilePlus, iconColor: "text-[#163144] dark:text-[#DFF3EB]", title: "Draft Quote Created for ", highlight: "", time: "Today at 10:45 AM", statusKey: "draft" },
      { id: "a2", icon: CheckCircle2, iconColor: "text-[#163144] dark:text-[#DFF3EB]", title: "Quote ", highlight: "#AQ-12345", time: "Today at 08:32 AM", statusKey: "converted" },
      { id: "a3", icon: UserPlus, iconColor: "text-[#163144] dark:text-[#DFF3EB]", title: "New Client Profile: ", highlight: "", time: "Yesterday at 4:15 PM", statusKey: "new" },
      { id: "a4", icon: AlertCircle, iconColor: "text-red-500", title: "Verification Failed for Policy ", highlight: "", highlightIsRed: true, time: "Yesterday at 11:10 AM", statusKey: "action" },
      { id: "a5", icon: RefreshCw, iconColor: "text-[#163144] dark:text-[#DFF3EB]", title: "Market Rate Update Applied to ", highlight: "", time: "Yesterday at 09:00 AM", statusKey: "system" },
      { id: "a6", icon: FileSignature, iconColor: "text-[#163144] dark:text-[#DFF3EB]", title: "Policy Activated for ", highlight: "", time: "Jun 27 at 2:30 PM", statusKey: "converted" },
      { id: "a7", icon: Upload, iconColor: "text-[#163144] dark:text-[#DFF3EB]", title: "Document Uploaded for ", highlight: "", time: "Jun 27 at 11:00 AM", statusKey: "new" },
      { id: "a8", icon: FilePlus, iconColor: "text-[#163144] dark:text-[#DFF3EB]", title: "Draft Quote Created for ", highlight: "", time: "Jun 26 at 4:20 PM", statusKey: "draft" },
    ]

    return sample.map((q, i) => {
      const base = templates[i % templates.length]
      const name = toTitleCase(q.clientName || q.fullName || q.schemeName || "Unnamed")
      let title = base.title
      let highlight = base.highlight || name

      if (base.id === "a2") {
        title = `Quote ${highlight} Converted to Active Policy`
        highlight = ""
      } else if (base.id === "a5") {
        title = `Market Rate Update Applied to Fixed Annuity Tier ${String.fromCharCode(65 + (i % 3))}`
        highlight = ""
      } else if (base.id === "a4") {
        title = `Verification Failed for Policy ${q.quoteId || "#VP-8821"}`
        highlight = ""
      }

      return {
        ...base,
        id: q.id + "-" + i,
        title,
        highlight,
      }
    })
  }, [recentQuotes])

  return (
    <div className="relative min-h-full -m-6 p-6 bg-gradient-to-br from-[#f2f5f7] via-[#e8f3f1] to-[#e0ebf5] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="pointer-events-none absolute -top-20 -right-10 w-96 h-96 bg-cyan-200/30 dark:bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -left-20 w-80 h-80 bg-emerald-100/40 dark:bg-emerald-500/10 rounded-full blur-3xl" />

      <div className="relative space-y-6">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-[#163144] dark:text-[#DFF3EB]">Dashboard</h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setConvertOpen(true)}
              variant="outline"
              className="px-5 py-2.5 rounded-full font-semibold text-sm tracking-wide bg-white/70 dark:bg-white/5 backdrop-blur-xl border-[#163144]/20 dark:border-white/15 text-[#163144] dark:text-[#DFF3EB] hover:bg-white"
            >
              <Repeat2 className="h-4 w-4 mr-1.5" />
              Convert Quote to Policy
            </Button>
            <Button
              onClick={() => navigate("/calculate")}
              className="px-6 py-2.5 bg-[#009fe3] hover:bg-[#0089c4] text-white rounded-full font-bold text-sm tracking-wide shadow-lg shadow-[#009fe3]/30 transition-all active:scale-95"
            >
              New Quote
            </Button>
          </div>

        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((card, i) => (
            <div
              key={i}
              className="group relative overflow-hidden bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/60 dark:border-white/10 p-5 rounded-[2rem] shadow-xl shadow-slate-200/40 dark:shadow-black/20 transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`relative w-11 h-11 rounded-full ${card.style.iconGradient} ${card.style.shadow} flex items-center justify-center shrink-0`}>
                  <div className="absolute top-1.5 left-2 w-2.5 h-2 rounded-full bg-white/50 blur-[1px]" />
                  <card.icon className="h-5 w-5 text-white relative z-10" strokeWidth={2.25} />
                </div>
                <div className="w-8 h-8 rounded-full border border-[#163144]/15 dark:border-white/15 flex items-center justify-center shrink-0 transition-colors group-hover:border-[#163144]/40">
                  <ArrowUpRight className="h-4 w-4 text-[#163144]/60 dark:text-[#DFF3EB]/60" strokeWidth={2} />
                </div>
              </div>
              <p className="font-heading text-base font-semibold text-[#163144] dark:text-[#DFF3EB] tracking-tight mt-4">
                {card.title}
              </p>
              <p className="font-heading text-4xl font-extrabold text-[#163144] dark:text-[#DFF3EB] tracking-tight mt-2">
                {card.value}
              </p>
              <p className="text-xs text-[#1B405B]/55 dark:text-[#DFF3EB]/45 mt-1 tracking-wide leading-relaxed">
                {card.subtitle}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="bg-white/20 dark:bg-slate-800/30 backdrop-blur-3xl border border-white/40 dark:border-white/10 rounded-[2.5rem] shadow-2xl shadow-slate-200/20 dark:shadow-black/20 overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-heading text-xl font-bold text-[#163144] dark:text-[#DFF3EB] tracking-tight">Recent Activity</CardTitle>
              <CardDescription className="text-sm text-[#1B405B]/70 dark:text-[#DFF3EB]/60 mt-1 tracking-wide">
                Latest important actions across quotes, clients, policies, documents, and servicing
              </CardDescription>
            </div>
            <button className="text-sm font-medium text-[#1B405B]/70 dark:text-[#DFF3EB]/60 hover:text-[#163144] dark:hover:text-[#DFF3EB] tracking-wide transition-colors">
              View All
            </button>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {activity.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No activity yet.</div>
            ) : (
              <div className="divide-y divide-slate-200/60 dark:divide-white/10">
                {activity.map((a) => {
                  const badge = STATUS_BADGES[a.statusKey]
                  const Icon = a.icon
                  return (
                    <div
                      key={a.id}
                      className="flex items-center gap-4 px-8 py-5 hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
                    >
                      {/* Icon circle */}
                      <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                        <Icon className={`h-5 w-5 ${a.iconColor}`} strokeWidth={2} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#163144] dark:text-[#DFF3EB] tracking-wide leading-snug">
                          {a.highlight ? (
                            <>
                              {a.title}
                              <span className={`font-bold ${a.highlightIsRed ? "text-red-600 dark:text-red-400" : ""}`}>{a.highlight}</span>
                            </>
                          ) : (
                            a.title
                          )}
                        </p>
                        <p className="text-xs text-[#1B405B]/50 dark:text-[#DFF3EB]/40 tracking-wide mt-0.5">
                          {a.time}
                        </p>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`inline-flex items-center rounded-sm border px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase whitespace-nowrap ${badge.className}`}
                      >
                        {badge.text}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConvertQuoteDialog open={convertOpen} onOpenChange={setConvertOpen} />
    </div>
  )
}


export default Dashboard
