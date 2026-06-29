import { FileCheck2, UserPlus, FileEdit, FileUp, ShieldCheck, Users, Briefcase } from "lucide-react"
import { InfoTooltip } from "@/components/ui/info-tooltip"

export interface ActivityItem {
  id: string
  kind: "quote_converted" | "client_created" | "draft_policy" | "documents_uploaded" | "policy_activated" | "beneficiary_updated" | "portfolio_updated"
  message: string
  at: string
}

interface RecentActivityProps {
  items: ActivityItem[]
}

const ICONS = {
  quote_converted: { Icon: FileCheck2, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300" },
  client_created: { Icon: UserPlus, color: "text-sky-600 bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300" },
  draft_policy: { Icon: FileEdit, color: "text-slate-600 bg-slate-100 dark:bg-slate-500/15 dark:text-slate-300" },
  documents_uploaded: { Icon: FileUp, color: "text-amber-600 bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300" },
  policy_activated: { Icon: ShieldCheck, color: "text-violet-600 bg-violet-100 dark:bg-violet-500/15 dark:text-violet-300" },
  beneficiary_updated: { Icon: Users, color: "text-pink-600 bg-pink-100 dark:bg-pink-500/15 dark:text-pink-300" },
  portfolio_updated: { Icon: Briefcase, color: "text-orange-600 bg-orange-100 dark:bg-orange-500/15 dark:text-orange-300" },
}

export const RecentActivity = ({ items }: RecentActivityProps) => (
  <div className="relative overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-black/20 p-6 h-full">
    <div className="flex items-center gap-2 mb-1">
      <h3 className="font-heading text-lg font-bold text-[#163144] dark:text-[#DFF3EB] tracking-tight">Recent Activity</h3>
      <InfoTooltip text="Latest important actions across quotes, clients, policies, documents, and servicing." />
    </div>
    <p className="text-xs text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide mb-4">Across quotes, clients, and policies</p>

    {items.length === 0 ? (
      <div className="text-center py-10 text-sm text-[#1B405B]/55 dark:text-[#DFF3EB]/45">
        No activity yet.
      </div>
    ) : (
      <ul className="space-y-3 max-h-[360px] overflow-auto pr-1">
        {items.map(item => {
          const { Icon, color } = ICONS[item.kind]
          return (
            <li key={item.id} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
                <Icon className="w-4 h-4" strokeWidth={2.25} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#163144] dark:text-[#DFF3EB] tracking-wide">{item.message}</p>
                <p className="text-xs text-[#1B405B]/55 dark:text-[#DFF3EB]/45 tracking-wide mt-0.5">
                  {new Date(item.at).toLocaleString()}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    )}
  </div>
)
