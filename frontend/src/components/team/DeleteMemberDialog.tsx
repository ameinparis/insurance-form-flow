import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"

interface DeleteMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberName: string
  memberEmail: string
  onConfirm: () => void
  loading: boolean
}

export const DeleteMemberDialog = ({
  open,
  onOpenChange,
  memberName,
  memberEmail,
  onConfirm,
  loading,
}: DeleteMemberDialogProps) => {
  const [confirmValue, setConfirmValue] = useState("")

  const isMatch = confirmValue.trim().toLowerCase() === memberEmail.trim().toLowerCase()

  const handleClose = (val: boolean) => {
    if (!val) setConfirmValue("")
    onOpenChange(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white dark:bg-slate-900 rounded-3xl max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle>Delete Member</DialogTitle>
              <DialogDescription className="mt-1">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            You are about to delete <span className="font-semibold text-foreground">{memberName}</span>. 
            To confirm, type their email address below:
          </p>
          <div>
            <Label className="text-xs text-muted-foreground">{memberEmail}</Label>
            <Input
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
              placeholder="Type email to confirm"
              className="mt-1"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onConfirm()
                setConfirmValue("")
              }}
              disabled={!isMatch || loading}
              className={!isMatch ? "opacity-50" : ""}
            >
              {loading ? "Deleting..." : "Delete Member"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
