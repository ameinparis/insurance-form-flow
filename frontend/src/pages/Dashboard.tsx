import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useQuotesList } from "@/hooks/useQuotesList"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

const ACTIVITY_TYPES = [
  { label: "Quote Created", icon: FilePlus, badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700" },
  { label: "Quote Converted", icon: CheckCircle2, badgeClass: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700" },
  { label: "Client Added", icon: UserPlus, badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300 dark:border-purple-700" },
  { label: "Policy Activated", icon: FileSignature, badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700" },
  { label: "Document Uploaded", icon: Upload, badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-700" },
  { label: "Policy Updated", icon: RefreshCw, badgeClass: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700" },
]

const Dashboard = () => {
  const navigate = useNavigate()
  const { data: recentQuotes = [] } = useQuotesList()

  const statCards = [
    { title: "Total Quotations", subtitle: "All records (draft, pending, converted, rejected)", value: recentQuotes.length, icon: FileText, style: CARD_STYLES[0] },
    { title: "Converted Quotations", subtitle: "Accepted, ready for onboarding", value: 0, icon: CheckCircle2, style: CARD_STYLES[1] },
    { title: "Active Clients", subtitle: "Linked after quotation conversion", value: 0, icon: Users, style: CARD_STYLES[2] },
    { title: "Active Policies", subtitle: "Setup, verified and activated", value: 0, icon: ShieldCheck, style: CARD_STYLES[3] },
    { title: "Pending Verification", subtitle: "Awaiting admin / compliance review", value: 0, icon: Clock, style: CARD_STYLES[4] },
  ]

  // Build mock recent activity feed using real names from quotes
  const activity = useMemo(() => {
    const sample = recentQuotes.slice(0, 8)
    return sample.map((q, i) => {
      const t = ACTIVITY_TYPES[i % ACTIVITY_TYPES.length]
      const name = toTitleCase(q.clientName || q.fullName || q.schemeName || "Unnamed")
      const desc: Record<string, string> = {
        "Quote Created": `New ${q.type} quote created for ${name}`,
        "Quote Converted": `${name}'s quote accepted — ready for onboarding`,
        "Client Added": `${name} added to active clients`,
        "Policy Activated": `Policy for ${name} activated`,
        "Document Uploaded": `KYC document uploaded for ${name}`,
        "Policy Updated": `Servicing update on ${name}'s policy`,
      }
      return {
        id: q.id + "-" + i,
        type: t.label,
        icon: t.icon,
        badgeClass: t.badgeClass,
        description: desc[t.label],
        actor: q.createdByName || "System",
        date: q.createdAt,
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
          <Button
            onClick={() => navigate("/calculator")}
            className="px-6 py-2.5 bg-[#009fe3] hover:bg-[#0089c4] text-white rounded-full font-bold text-sm tracking-wide shadow-lg shadow-[#009fe3]/30 transition-all active:scale-95"
          >
            New Quote
          </Button>
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
        <Card className="bg-white/20 dark:bg-slate-800/30 backdrop-blur-3xl border border-white/40 dark:border-white/10 rounded-[2.5rem] shadow-2xl shadow-slate-200/20 dark:shadow-black/20">
          <CardHeader className="px-8 pt-8 pb-4">
            <CardTitle className="font-heading text-xl font-bold text-[#163144] dark:text-[#DFF3EB] tracking-tight">Recent Activity</CardTitle>
            <CardDescription className="text-sm text-[#1B405B]/70 dark:text-[#DFF3EB]/60 mt-1 tracking-wide">
              Latest important actions across quotes, clients, policies, documents, and servicing
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-b border-white/30 dark:border-white/10 hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide pb-4 pl-4 normal-case">Activity</TableHead>
                    <TableHead className="text-xs font-semibold text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide pb-4 normal-case">Description</TableHead>
                    <TableHead className="text-xs font-semibold text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide pb-4 normal-case">Performed By</TableHead>
                    <TableHead className="text-xs font-semibold text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide pb-4 pr-4 normal-case">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-white/30 dark:divide-white/5">
                  {activity.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No activity yet.</TableCell></TableRow>
                  ) : activity.map((a) => (
                    <TableRow key={a.id} className="border-0 hover:bg-white/40 dark:hover:bg-white/5 transition-all duration-300">
                      <TableCell className="py-5 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 flex items-center justify-center shrink-0">
                            <a.icon className="h-4 w-4 text-[#163144] dark:text-[#DFF3EB]" strokeWidth={2.25} />
                          </div>
                          <Badge variant="outline" className={`rounded-full px-3 py-1 text-xs font-semibold border whitespace-nowrap tracking-wide ${a.badgeClass}`}>
                            {a.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-sm font-medium text-[#163144] dark:text-[#DFF3EB] tracking-wide">
                        {a.description}
                      </TableCell>
                      <TableCell className="py-5 text-sm text-[#1B405B]/80 dark:text-[#DFF3EB]/70 tracking-wide">
                        {a.actor}
                      </TableCell>
                      <TableCell className="py-5 text-sm text-[#1B405B]/70 dark:text-[#DFF3EB]/60 tracking-wide pr-4">
                        {new Date(a.date).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
