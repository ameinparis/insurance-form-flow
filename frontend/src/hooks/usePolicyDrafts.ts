import { useCallback, useEffect, useState } from "react"

export interface ReassignmentEntry {
  at: string
  byId?: string | null
  byName?: string | null
  fromId?: string | null
  fromName?: string | null
  toId?: string | null
  toName?: string | null
}

export interface PolicyDraft {
  id: string
  step: number
  form: Record<string, string>
  productType?: string
  optionLabel?: string
  quoteId?: string
  premium?: number
  status?: "draft" | "pending_approval" | "approved" | "rejected"
  initiatedBy?: string | null
  initiatedByName?: string | null
  initiatedAt?: string | null
  assignedTo?: string | null
  assignedToName?: string | null
  assignedAt?: string | null
  approvedBy?: string | null
  approvedByName?: string | null
  approvedAt?: string | null
  rejectedBy?: string | null
  rejectedByName?: string | null
  rejectedAt?: string | null
  rejectionReason?: string | null
  reassignments?: ReassignmentEntry[]
  updatedAt: string
}

const STORAGE_KEY = "policy_drafts_v1"
const EVENT = "policy-drafts-updated"

const read = (): PolicyDraft[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const write = (drafts: PolicyDraft[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(EVENT))
}

export const usePolicyDrafts = () => {
  const [drafts, setDrafts] = useState<PolicyDraft[]>(read)

  useEffect(() => {
    const sync = () => setDrafts(read())
    window.addEventListener(EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const saveDraft = useCallback((draft: Omit<PolicyDraft, "updatedAt"> & { id?: string }) => {
    const current = read()
    const id = draft.id || `pd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const existing = current.findIndex((d) => d.id === id)
    const prev = existing >= 0 ? current[existing] : undefined
    const now = new Date().toISOString()
    const next: PolicyDraft = {
      status: "draft",
      ...prev,
      ...draft,
      id,
      initiatedBy: prev?.initiatedBy ?? draft.initiatedBy ?? localStorage.getItem("userId"),
      initiatedByName: prev?.initiatedByName ?? draft.initiatedByName ?? localStorage.getItem("userName"),
      initiatedAt: prev?.initiatedAt ?? now,
      updatedAt: now,
    }
    if (existing >= 0) {
      current[existing] = next
      write([...current])
    } else {
      write([next, ...current])
    }
    return next
  }, [])

  const removeDraft = useCallback((id: string) => {
    write(read().filter((d) => d.id !== id))
  }, [])

  /** Submit for approval, assigning a specific Admin / Super Admin as reviewer. */
  const submitForApproval = useCallback(
    (id: string, assignee?: { id?: string | null; name?: string | null }) => {
      const now = new Date().toISOString()
      let updated: PolicyDraft | undefined
      write(
        read().map((d) => {
          if (d.id !== id) return d
          updated = {
            ...d,
            status: "pending_approval",
            assignedTo: assignee?.id ?? d.assignedTo ?? null,
            assignedToName: assignee?.name ?? d.assignedToName ?? null,
            assignedAt: now,
            rejectedBy: null,
            rejectedByName: null,
            rejectedAt: null,
            rejectionReason: null,
            updatedAt: now,
          }
          return updated
        }),
      )
      return updated
    },
    [],
  )

  /** Move a pending conversion to a different reviewer. */
  const reassignDraft = useCallback(
    (
      id: string,
      assignee: { id?: string | null; name?: string | null },
      actor: { id?: string | null; name?: string | null },
    ) => {
      const now = new Date().toISOString()
      let updated: PolicyDraft | undefined
      write(
        read().map((d) => {
          if (d.id !== id) return d
          const entry: ReassignmentEntry = {
            at: now,
            byId: actor.id ?? null,
            byName: actor.name ?? null,
            fromId: d.assignedTo ?? null,
            fromName: d.assignedToName ?? null,
            toId: assignee.id ?? null,
            toName: assignee.name ?? null,
          }
          updated = {
            ...d,
            status: "pending_approval",
            assignedTo: assignee.id ?? null,
            assignedToName: assignee.name ?? null,
            assignedAt: now,
            reassignments: [...(d.reassignments || []), entry],
            updatedAt: now,
          }
          return updated
        }),
      )
      return updated
    },
    [],
  )

  const approveDraft = useCallback(
    (id: string, approver: { id?: string | null; name?: string | null }) => {
      const now = new Date().toISOString()
      write(
        read().map((d) =>
          d.id === id
            ? {
                ...d,
                status: "approved",
                approvedBy: approver.id ?? null,
                approvedByName: approver.name ?? null,
                approvedAt: now,
                updatedAt: now,
              }
            : d,
        ),
      )
    },
    [],
  )

  const rejectDraft = useCallback(
    (id: string, reviewer: { id?: string | null; name?: string | null }, reason: string) => {
      const now = new Date().toISOString()
      write(
        read().map((d) =>
          d.id === id
            ? {
                ...d,
                status: "rejected",
                rejectedBy: reviewer.id ?? null,
                rejectedByName: reviewer.name ?? null,
                rejectedAt: now,
                rejectionReason: reason,
                updatedAt: now,
              }
            : d,
        ),
      )
    },
    [],
  )

  return {
    drafts,
    saveDraft,
    removeDraft,
    submitForApproval,
    reassignDraft,
    approveDraft,
    rejectDraft,
  }
}
