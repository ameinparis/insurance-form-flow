import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export type JobStatus = "running" | "done" | "error" | "hidden"

interface BackgroundJobCardProps {
  id: string
  status: JobStatus
  progress: number
  errorMessage?: string
  label: string
  index: number
  onViewResults?: () => void
  onDismiss: () => void
}

const BackgroundJobCard = ({
  id,
  status,
  progress,
  errorMessage,
  label,
  index,
  onViewResults,
  onDismiss,
}: BackgroundJobCardProps) => {
  const [isMinimized, setIsMinimized] = useState(false)

  if (status === "hidden" || isMinimized) return null

  // Calculate top position based on index (stacking)
  const topPosition = 80 + (index * 140)

  return (
    <div 
      className="fixed right-4 z-50 animate-fade-in transition-all duration-300 ease-out"
      style={{ top: `${topPosition}px` }}
    >
      <Card className="w-72 shadow-lg border border-border/50 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-4">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {status === "running" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{label}…</span>
                </>
              )}
              {status === "done" && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-green-600 truncate">{label} Complete</span>
                </>
              )}
              {status === "error" && (
                <>
                  <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <span className="text-sm font-medium text-destructive truncate">{label} Failed</span>
                </>
              )}
            </div>
            <button
              onClick={() => {
                if (status === "running") {
                  setIsMinimized(true)
                } else {
                  onDismiss()
                }
              }}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress bar for running state */}
          {status === "running" && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {progress}% complete
              </p>
            </div>
          )}

          {/* Action buttons for done/error states */}
          {status === "done" && (
            <Button
              onClick={() => {
                onViewResults?.()
                onDismiss()
              }}
              size="sm"
              className="w-full mt-2"
            >
              View Results
            </Button>
          )}

          {status === "error" && (
            <div className="space-y-2 mt-2">
              {errorMessage && (
                <p className="text-xs text-muted-foreground">{errorMessage}</p>
              )}
              <Button
                onClick={onDismiss}
                size="sm"
                variant="outline"
                className="w-full"
              >
                Dismiss
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Multi-job widget that renders multiple cards
interface MultiJobWidgetProps {
  jobs: Array<{
    id: string
    status: JobStatus
    progress: number
    errorMessage: string
    label: string
    onViewResults?: () => void
  }>
  onDismissJob: (id: string) => void
}

const MultiJobWidget = ({ jobs, onDismissJob }: MultiJobWidgetProps) => {
  // Filter out hidden jobs and limit to 5 visible cards
  const visibleJobs = jobs.filter(job => job.status !== "hidden").slice(0, 5)

  return (
    <>
      {visibleJobs.map((job, index) => (
        <BackgroundJobCard
          key={job.id}
          id={job.id}
          status={job.status}
          progress={job.progress}
          errorMessage={job.errorMessage}
          label={job.label}
          index={index}
          onViewResults={job.onViewResults}
          onDismiss={() => onDismissJob(job.id)}
        />
      ))}
    </>
  )
}

export default MultiJobWidget
