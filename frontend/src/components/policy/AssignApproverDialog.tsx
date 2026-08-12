import { useEffect, useState } from "react"
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
  onConfirm: (approver: { id: string; name: string }) => void
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

  useEffect(() => {
    if (open) setSelected("")
  }, [open])

  const options = approvers.filter((a) => a.id !== excludeId && a.id !== currentAssigneeId)
  const chosen = options.find((a) => a.id === selected)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label>Assign to</Label>
          <Select value={selected} onValueChange={setSelected} disabled={loading}>
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
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-full"
            disabled={!chosen}
            onClick={() => {
              if (!chosen) return
              onConfirm({ id: chosen.id, name: chosen.name })
              onOpenChange(false)
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AssignApproverDialog
