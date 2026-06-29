import { InfoTooltip } from "@/components/ui/info-tooltip"

interface PolicyStatusOverviewProps {
  counts: Record<string, number>
}

const STATUS_CONFIG: Array<{ key: string; label: string; color: string }> = [
  { key: "draft", label: "Draft", color: "#94a3b8" },
  { key: "pendingVerification", label: "Pending Verification", color: "#f59e0b" },
  { key: "approved", label: "Approved", color: "#0ea5e9" },
  { key: "active", label: "Active", color: "#10b981" },
  { key: "suspended", label: "Suspended", color: "#a855f7" },
  { key: "cancelled", label: "Cancelled", color: "#f97316" },
  { key: "claimed", label: "Claimed", color: "#ec4899" },
  { key: "closed", label: "Closed", color: "#64748b" },
]

export const PolicyStatusOverview = ({ counts }: PolicyStatusOverviewProps) => {
  const total = STATUS_CONFIG.reduce((sum, s) => sum + (counts[s.key] || 0), 0)

  return (
    <div className="relative overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] shadow-xl shadow-slate-200/30 dark:shadow-black/20 p-6">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-heading text-lg font-bold text-[#163144] dark:text-[#DFF3EB] tracking-tight">Policy Status Overview</h3>
        <InfoTooltip text="Breakdown of policies by current lifecycle status." />
      </div>
      <p className="text-xs text-[#1B405B]/60 dark:text-[#DFF3EB]/50 tracking-wide mb-5">Live distribution across the policy lifecycle</p>

      {/* Stacked bar */}
      <div className="h-3 w-full rounded-full overflow-hidden bg-white/50 dark:bg-white/5 flex">
        {total === 0 ? (
          <div className="w-full h-full bg-gradient-to-r from-slate-200/60 to-slate-100/60 dark:from-slate-700/40 dark:to-slate-800/40" />
        ) : (
          STATUS_CONFIG.map(s => {
            const v = counts[s.key] || 0
            const pct = (v / total) * 100
            if (!pct) return null
            return <div key={s.key} style={{ width: `${pct}%`, backgroundColor: s.color }} />
          })
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
        {STATUS_CONFIG.map(s => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <div className="flex flex-col leading-tight">
              <span className="text-xs text-[#1B405B]/70 dark:text-[#DFF3EB]/60 tracking-wide">{s.label}</span>
              <span className="text-sm font-bold text-[#163144] dark:text-[#DFF3EB]">{counts[s.key] || 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
