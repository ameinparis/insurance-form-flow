import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export type JobStatus = "running" | "done" | "error" | "hidden"

interface BackgroundJobWidgetProps {
  status: JobStatus
  progress: number
  errorMessage?: string
  onViewResults: () => void
  onDismiss: () => void
}

const BackgroundJobWidget = ({
  status,
  progress,
  errorMessage,
  onViewResults,
  onDismiss,
}: BackgroundJobWidgetProps) => {
  const [isMinimized, setIsMinimized] = useState(false)

  if (status === "hidden" || isMinimized) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <Card className="w-72 shadow-lg border border-border/50 bg-card/95 backdrop-blur-sm">
        <CardContent className="p-4">
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {status === "running" && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">Funeral Calculation Running…</span>
                </>
              )}
              {status === "done" && (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">Calculation Complete</span>
                </>
              )}
              {status === "error" && (
                <>
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Calculation Failed</span>
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
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
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
              onClick={onViewResults}
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

export default BackgroundJobWidget
