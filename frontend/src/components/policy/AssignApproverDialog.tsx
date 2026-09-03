import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useApprovers } from "@/hooks/useApprovers"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  confirmLabel?: string
  excludeId?: string | null
  currentAssigneeId?: string | null
  onConfirm: (approver: { id: string; name: string }) => Promise<void> | void
}

/** Shared dropdown for picking the Admin / Super Admin who should review a conversion. */
export const AssignApproverDialog = ({
  open,
  onOpenChange,
  title = "Submit for approval",
  description = "Choose the Admin or Super Admin who should review this policy conversion.",
  confirmLabel = "Submit for approval",
  excludeId,
  currentAssigneeId,
  onConfirm,
}: Props) => {
  const { approvers, loading } = useApprovers()
  const [selected, setSelected] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Reset everything (including any stuck loading state) each time the dialog opens.
    if (open) {
      setSelected("")
      setSubmitting(false)
    }
  }, [open])

  const options = approvers.filter((a) => a.id !== excludeId && a.id !== currentAssigneeId)
  const chosen = options.find((a) => a.id === selected)

  const handleConfirm = async () => {
    if (!chosen || submitting) return
    setSubmitting(true)
    try {
      // Await the parent's submit so the dialog stays open, the button stays
      // disabled, and the label reads "Submitting…" until the request settles.
      // On success we close; on failure we keep it open so the advisor can retry.
      await onConfirm({ id: chosen.id, name: chosen.name })
      onOpenChange(false)
    } catch {
      // The parent already surfaces the error via toast — don't double-toast.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label>Assign to</Label>
          <Select
            value={selected}
            onValueChange={setSelected}
            disabled={loading || submitting}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder={loading ? "Loading reviewers…" : "Select a reviewer"} />
            </SelectTrigger>
            <SelectContent>
              {options.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name} · {a.roleLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!loading && options.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No Admins or Super Admins are available to review right now.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            className="rounded-full"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="rounded-full"
            disabled={!chosen || submitting}
            onClick={handleConfirm}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AssignApproverDialog
