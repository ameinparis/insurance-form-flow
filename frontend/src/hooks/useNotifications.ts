import { useCallback, useEffect, useState } from "react"
import { API_BASE_URL } from "@/lib/api"

export type NotificationKind = "assignment" | "approved" | "rejected" | "reassigned" | "returned"
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

const authHeaders = (): HeadersInit => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/** Server records win; the local copy is only an offline cache. */
const mergeRemote = (remote: AppNotification[]) => {
  const byId = new Map<string, AppNotification>()
  read().forEach((n) => byId.set(n.id, n))
  remote.forEach((n) => byId.set(n.id, n))
  write(
    [...byId.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 200),
  )
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>(read)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, { headers: authHeaders() })
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) mergeRemote(data as AppNotification[])
    } catch {
      /* offline — keep the cached list */
    }
  }, [])

  useEffect(() => {
    const sync = () => setNotifications(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener("storage", sync)
    void refresh()
    const poll = setInterval(refresh, 20000)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener("storage", sync)
      clearInterval(poll)
    }
  }, [refresh])

  const addNotification = useCallback(
    (n: Omit<AppNotification, "id" | "createdAt" | "read"> & { id?: string; read?: boolean }) => {
      const item: AppNotification = {
        read: false,
        ...n,
        id: n.id || `nt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: new Date().toISOString(),
      }
      write([item, ...read().filter((x) => x.id !== item.id)])
      // Shared copy so the recipient sees it even if they were offline.
      void fetch(`${API_BASE_URL}/notifications`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(item),
      }).catch(() => undefined)
      return item
    },
    [],
  )

  const patchDraft = (draftId: string, status: string, reason?: string | null) =>
    fetch(`${API_BASE_URL}/notifications/draft/${encodeURIComponent(draftId)}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status, reason: reason ?? null }),
    }).catch(() => undefined)

  /** Marks every pending notification for a draft as no longer actionable. */
  const supersedeForDraft = useCallback((draftId: string) => {
    write(
      read().map((n) =>
        n.draftId === draftId && n.status === "pending" ? { ...n, status: "superseded" } : n,
      ),
    )
    void patchDraft(draftId, "superseded")
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
      void patchDraft(draftId, status, reason ?? null)
    },
    [],
  )

  const markRead = useCallback((id: string) => {
    write(read().map((n) => (n.id === id ? { ...n, read: true } : n)))
    void fetch(`${API_BASE_URL}/notifications/read`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => undefined)
  }, [])

  const markAllRead = useCallback((recipientId?: string | null) => {
    write(
      read().map((n) =>
        !recipientId || n.recipientId === recipientId ? { ...n, read: true } : n,
      ),
    )
    void fetch(`${API_BASE_URL}/notifications/read`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({}),
    }).catch(() => undefined)
  }, [])

  return {
    notifications,
    refresh,
    addNotification,
    supersedeForDraft,
    resolveForDraft,
    markRead,
    markAllRead,
  }
}

