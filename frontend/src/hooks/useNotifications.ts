import { useCallback, useEffect, useState } from "react"

export type NotificationKind = "assignment" | "approved" | "rejected" | "reassigned"
export type NotificationStatus = "pending" | "approved" | "rejected" | "superseded"

export interface AppNotification {
  id: string
  draftId: string
  kind: NotificationKind
  status: NotificationStatus
  recipientId: string | null
  recipientName?: string | null
  advisorName?: string | null
  clientName?: string | null
  policyType?: string | null
  reason?: string | null
  read: boolean
  createdAt: string
}

const STORAGE_KEY = "policy_notifications_v1"
const EVENT = "policy-notifications-updated"

const read = (): AppNotification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const write = (items: AppNotification[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT))
}

/** Human friendly "2 min ago" style timestamps. */
export const relativeTime = (iso?: string | null) => {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`
  return new Date(iso).toLocaleDateString()
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>(read)

  useEffect(() => {
    const sync = () => setNotifications(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const addNotification = useCallback(
    (n: Omit<AppNotification, "id" | "createdAt" | "read"> & { read?: boolean }) => {
      const item: AppNotification = {
        read: false,
        ...n,
        id: `nt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      }
      write([item, ...read()])
      return item
    },
    [],
  )

  /** Marks every pending notification for a draft as no longer actionable. */
  const supersedeForDraft = useCallback((draftId: string) => {
    write(
      read().map((n) =>
        n.draftId === draftId && n.status === "pending" ? { ...n, status: "superseded" } : n,
      ),
    )
  }, [])

  const resolveForDraft = useCallback(
    (draftId: string, status: "approved" | "rejected", reason?: string | null) => {
      write(
        read().map((n) =>
          n.draftId === draftId && n.status === "pending"
            ? { ...n, status, reason: reason ?? null, read: false }
            : n,
        ),
      )
    },
    [],
  )

  const markRead = useCallback((id: string) => {
    write(read().map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllRead = useCallback((recipientId?: string | null) => {
    write(
      read().map((n) =>
        !recipientId || n.recipientId === recipientId ? { ...n, read: true } : n,
      ),
    )
  }, [])

  return {
    notifications,
    addNotification,
    supersedeForDraft,
    resolveForDraft,
    markRead,
    markAllRead,
  }
}
