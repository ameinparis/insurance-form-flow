import { useMemo, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, CheckCircle2, Clock, XCircle, ArrowRightLeft } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useAuth } from "@/lib/authlibrary"
import { usePolicyDrafts } from "@/hooks/usePolicyDrafts"
import { useNotifications, relativeTime, type AppNotification } from "@/hooks/useNotifications"
import { useSocket } from "@/hooks/useSocket"

const statusIcon = (n: AppNotification) => {
  if (n.status === "approved") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  if (n.status === "rejected") return <XCircle className="h-4 w-4 text-red-500" />
  if (n.status === "superseded") return <ArrowRightLeft className="h-4 w-4 text-slate-400" />
  return <Clock className="h-4 w-4 text-amber-500" />
}

export function NotificationBell() {
  const navigate = useNavigate()
  const { userId, userName, permissions } = useAuth()
  const { notifications, addNotification, markRead, markAllRead, resolveForDraft } = useNotifications()
  const { drafts, approveDraft, rejectDraft } = usePolicyDrafts()
  const [open, setOpen] = useState(false)
  const [rejecting, setRejecting] = useState<AppNotification | null>(null)
  const [reason, setReason] = useState("")

  const { onNotification, emitApprovalResolve } = useSocket()

  useEffect(() => {
    const unsubscribe = onNotification((n) => {
      addNotification(n)
    })
    return unsubscribe
  }, [addNotification, onNotification])

  const isSuper = permissions.role === "super_admin"

  const visible = useMemo(
    () =>
      notifications
        .filter((n) => isSuper || String(n.recipientId || "") === String(userId || ""))
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
    [notifications, userId, isSuper],
  )

  const unread = visible.filter((n) => !n.read).length

  const canAct = (n: AppNotification) => {
    if (n.status !== "pending") return false
    const draft = drafts.find((d) => d.id === n.draftId)
    if (!draft || draft.status !== "pending_approval") return false
    if (String(draft.assignedTo || "") !== String(n.recipientId || "")) return false
    return isSuper || String(draft.assignedTo || "") === String(userId || "")
  }

  const handleApprove = (n: AppNotification) => {
    approveDraft(n.draftId, { id: userId, name: userName })
    resolveForDraft(n.draftId, "approved")
    markRead(n.id)
    const draft = drafts.find((d) => d.id === n.draftId)
    emitApprovalResolve({
      draftId: n.draftId,
      kind: "approved",
      status: "approved",
      recipientId: draft?.initiatedBy ?? null,
      recipientName: draft?.initiatedByName ?? null,
      advisorName: userName,
      clientName: n.clientName,
      policyType: n.policyType,
    })
    toast.success("Policy conversion approved")
  }

  const handleReject = () => {
    if (!rejecting) return
    if (!reason.trim()) {
      toast.error("A reason is required to reject")
      return
    }
    rejectDraft(rejecting.draftId, { id: userId, name: userName }, reason.trim())
    resolveForDraft(rejecting.draftId, "rejected", reason.trim())
    markRead(rejecting.id)
    const draft = drafts.find((d) => d.id === rejecting.draftId)
    emitApprovalResolve({
      draftId: rejecting.draftId,
      kind: "rejected",
      status: "rejected",
      recipientId: draft?.initiatedBy ?? null,
      recipientName: draft?.initiatedByName ?? null,
      advisorName: userName,
      clientName: rejecting.clientName,
      policyType: rejecting.policyType,
      reason: reason.trim(),
    })
    setRejecting(null)
    setReason("")
    toast.success("Policy conversion rejected")
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-[380px] p-0 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            <button
              type="button"
              onClick={() => markAllRead(isSuper ? null : userId)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Mark all read
            </button>
          </div>

          <ScrollArea className="max-h-[380px]">
            {visible.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                You're all caught up.
              </p>
            ) : (
              <ul className="divide-y divide-border/50">
                {visible.map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 ${!n.read ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5">{statusIcon(n)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground leading-snug">
                          <span className="font-semibold">{n.advisorName || "An advisor"}</span>{" "}
                          {n.kind === "reassigned" ? "reassigned" : "submitted"}{" "}
                          <span className="font-semibold">{n.clientName || "a client"}</span>
                          {n.policyType ? ` · ${n.policyType}` : ""}
                        </p>
                        {n.status === "approved" && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Approved
                          </p>
                        )}
                        {n.status === "rejected" && (
                          <p className="text-xs text-red-500 mt-0.5">
                            Rejected{n.reason ? ` — ${n.reason}` : ""}
                          </p>
                        )}
                        {n.status === "superseded" && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Reassigned to another reviewer
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-muted-foreground">
                            {relativeTime(n.createdAt)}
                          </span>
                          {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                        </div>

                        {canAct(n) && (
                          <div className="flex items-center gap-2 mt-2.5">
                            <Button
                              size="sm"
                              className="rounded-full h-7 px-4 text-xs"
                              onClick={() => handleApprove(n)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full h-7 px-4 text-xs"
                              onClick={() => {
                                markRead(n.id)
                                setOpen(false)
                                navigate(`/policies/drafts/${n.draftId}`)
                              }}
                            >
                              Review
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="rounded-full h-7 px-3 text-xs text-red-500 hover:text-red-600"
                              onClick={() => setRejecting(n)}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject conversion</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Give a reason for rejecting this conversion…"
            className="rounded-xl min-h-[110px]"
          />
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-full bg-red-500 hover:bg-red-600 text-white"
              onClick={handleReject}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default NotificationBell
