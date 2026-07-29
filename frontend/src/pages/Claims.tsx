import { useState } from "react"
import { Search, ClipboardList } from "lucide-react"
import { Input } from "@/components/ui/input"

const Claims = () => {
  const [term, setTerm] = useState("")

  return (
    <div className="relative min-h-full -m-6 bg-slate-50 dark:bg-slate-900">
      <div className="sticky top-0 z-30 px-6 pt-6 pb-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Claims</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Claims lodged against active policies.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search claims..."
              className="pl-11 h-11 rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex flex-col items-center justify-center text-center py-24 px-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center mb-5">
              <ClipboardList className="h-7 w-7 text-slate-400 dark:text-slate-300" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">No claims yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
              Claims will appear here once they are lodged against an active policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Claims
