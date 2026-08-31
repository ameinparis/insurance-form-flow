import { useCallback, useEffect, useState } from "react"
import { useClientDirectory } from "./useClientDirectory"

export interface ReassignmentEntry {
  at: string
  byId?: string | null
  byName?: string | null
  fromId?: string | null
  fromName?: string | null
  toId?: string | null
  toName?: string | null
}

export interface ReviewEntry {
  at: string
  attempt: number
  decision: "approved" | "rejected"
  byId?: string | null
  byName?: string | null
  note?: string | null
}

export type DraftStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "ACTIVE" | "draft" | "pending_approval" | "approved" | "rejected"

export interface PolicyDraft {
  id: string
  step: number
  form: Record<string, string>
  productType?: string
  optionLabel?: string
  quoteId?: string
  premium?: number
  status?: DraftStatus
  attempt?: number
  initiatedBy?: string | null
  initiatedByName?: string | null
  initiatedAt?: string | null
  assignedTo?: string | null
  assignedToName?: string | null
  assignedAt?: string | null
  submittedAt?: string | null
  approvedBy?: string | null
  approvedByName?: string | null
  approvedAt?: string | null
  rejectedBy?: string | null
  rejectedByName?: string | null
  rejectedAt?: string | null
  rejectionReason?: string | null
  reviewNote?: string | null
  reviewedBy?: string | null
  reviewedByName?: string | null
  reviewedAt?: string | null
  reviewHistory?: ReviewEntry[]
  reassignments?: ReassignmentEntry[]
  updatedAt: string
  clientId?: string | null
  createdBy?: string | null
  returnReason?: string | null
}

const STORAGE_KEY = "policy_drafts_v1"
const EVENT = "policy-drafts-updated"

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:5002/api"

const authHeaders = (): HeadersInit => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

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

/**
 * Write-through to the shared backend so every role reads the same records.
 * Writes for the same conversion are queued: saving a draft and immediately
 * submitting it used to race, and the slower "draft" PUT could land last and
 * reset the server copy to draft — so reviewers never saw the submission.
 */
const queues = new Map<string, Promise<unknown>>()

const enqueue = (id: string, task: () => Promise<unknown>) => {
  const next = (queues.get(id) || Promise.resolve()).then(task, task)
  queues.set(
    id,
    next.catch(() => undefined),
  )
  return next
}

/** Last sync outcome, so the UI can say "not synced" instead of failing quietly. */
const SYNC_EVENT = "policy-drafts-sync"
let syncFailed = false
const setSyncFailed = (failed: boolean) => {
  if (syncFailed === failed) return
  syncFailed = failed
  window.dispatchEvent(new Event(SYNC_EVENT))
}

const persist = (draft: PolicyDraft) => {
  const isNewPolicy = String(draft.id || "").startsWith("POL-")
  const url = isNewPolicy
    ? `${API_BASE}/policies/${encodeURIComponent(draft.id)}`
    : `${API_BASE}/conversions/${encodeURIComponent(draft.id)}`
  const method = isNewPolicy ? "PATCH" : "PUT"
  return enqueue(draft.id, () =>
    fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(draft),
    })
      .then((res) => setSyncFailed(!res.ok))
      .catch(() => {
        // offline — localStorage keeps the record and the UI shows a warning
        setSyncFailed(true)
      }),
  )
}

const persistDelete = (id: string) => {
  const isNewPolicy = String(id || "").startsWith("POL-")
  const url = isNewPolicy
    ? `${API_BASE}/policies/${encodeURIComponent(id)}`
    : `${API_BASE}/conversions/${encodeURIComponent(id)}`
  return enqueue(id, () =>
    fetch(url, {
      method: "DELETE",
      headers: authHeaders(),
    })
      .then((res) => setSyncFailed(!res.ok))
      .catch(() => setSyncFailed(true)),
  )
}

const writeOne = (next: PolicyDraft, list?: PolicyDraft[]) => {
  const current = list ?? read()
  const idx = current.findIndex((d) => d.id === next.id)
  if (idx >= 0) current[idx] = next
  else current.unshift(next)
  write([...current])
  persist(next)
  return next
}

const isLocalDraft = (d?: PolicyDraft | null) => {
  const s = String(draftStatus(d)).toLowerCase()
  return s === "draft"
}

/**
 * The server is the source of truth for anything past "draft" — a stale copy
 * in one browser must never shadow the shared record. Unsent local drafts stay
 * put, and local records the server has never seen are pushed up.
 */
const mergeRemote = (remote: PolicyDraft[]) => {
  const local = read()
  const byId = new Map<string, PolicyDraft>()
  const remoteIds = new Set(remote.map((d) => d.id))
  local.forEach((d) => byId.set(d.id, d))
  remote.forEach((d) => {
    const existing = byId.get(d.id)
    // Keep the local copy only when it is an in-progress draft with newer edits.
    const keepLocal =
      existing && isLocalDraft(existing) && (existing.updatedAt || "") > (d.updatedAt || "")
    if (!keepLocal) byId.set(d.id, d)
  })
  // Records that only exist in this browser (created while the API was down)
  // are pushed up so other roles can see them too.
  local.forEach((d) => {
    if (!remoteIds.has(d.id) && !isLocalDraft(d)) persist(d)
  })
  write([...byId.values()].sort((a, b) => ((a.updatedAt || "") < (b.updatedAt || "") ? 1 : -1)))
}



export const usePolicyDrafts = () => {
  const [drafts, setDrafts] = useState<PolicyDraft[]>(read)
  const [syncError, setSyncError] = useState(syncFailed)
  const { addClient } = useClientDirectory()

  const refresh = useCallback(async () => {
    try {
      const [convRes, policyRes] = await Promise.all([
        fetch(`${API_BASE}/conversions`, { headers: authHeaders() }),
        fetch(`${API_BASE}/policies/pipeline`, { headers: authHeaders() }),
      ])
      const convOk = convRes.ok
      const policyOk = policyRes.ok
      if (!convOk && !policyOk) {
        setSyncFailed(true)
        return
      }
      const [convData, policyData] = await Promise.all([
        convOk ? convRes.json() : [],
        policyOk ? policyRes.json() : [],
      ])
      const merged = [...(Array.isArray(convData) ? convData : []), ...(Array.isArray(policyData) ? policyData : [])]
      if (merged.length) mergeRemote(merged as PolicyDraft[])
      setSyncFailed(false)
    } catch {
      /* offline — keep local cache, but say so */
      setSyncFailed(true)
    }
  }, [])

  useEffect(() => {
    const sync = () => setDrafts(read())
    const syncStatus = () => setSyncError(syncFailed)
    window.addEventListener(EVENT, sync)
    window.addEventListener("storage", sync)
    window.addEventListener(SYNC_EVENT, syncStatus)
    refresh()
    const poll = setInterval(refresh, 20000)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener("storage", sync)
      window.removeEventListener(SYNC_EVENT, syncStatus)
      clearInterval(poll)
    }
  }, [refresh])


  const saveDraft = useCallback((draft: Omit<PolicyDraft, "updatedAt"> & { id?: string }) => {
    const current = read()
    const id = draft.id || `pd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const prev = current.find((d) => d.id === id)
    const now = new Date().toISOString()
    const next: PolicyDraft = {
      status: "draft",
      attempt: 1,
      ...prev,
      ...draft,
      id,
      initiatedBy: prev?.initiatedBy ?? draft.initiatedBy ?? localStorage.getItem("userId"),
      initiatedByName: prev?.initiatedByName ?? draft.initiatedByName ?? localStorage.getItem("userName"),
      initiatedAt: prev?.initiatedAt ?? now,
      updatedAt: now,
    }
    return writeOne(next, current)
  }, [])

  const removeDraft = useCallback((id: string) => {
    write(read().filter((d) => d.id !== id))
    persistDelete(id)
  }, [])

  /** Submit (or resubmit) for approval, assigning a specific reviewer. */
  const submitForApproval = useCallback(
    async (id: string, assignee?: { id?: string | null; name?: string | null }) => {
      const current = read()
      const d = current.find((x) => x.id === id)
      if (!d) return undefined
      const now = new Date().toISOString()
      const isResubmission = d.status === "rejected"
      const next: PolicyDraft = {
        ...d,
        status: "pending_approval",
        attempt: (d.attempt || 1) + (isResubmission ? 1 : 0),
        assignedTo: assignee?.id ?? d.assignedTo ?? null,
        assignedToName: assignee?.name ?? d.assignedToName ?? null,
        assignedAt: now,
        submittedAt: now,
        // Clear the current round's decision, history keeps the record.
        rejectedBy: null,
        rejectedByName: null,
        rejectedAt: null,
        rejectionReason: null,
        reviewNote: null,
        reviewedBy: null,
        reviewedByName: null,
        reviewedAt: null,
        updatedAt: now,
      }
      const saved = await enqueue(next.id, async () => {
        const response = await fetch(
          `${API_BASE}/conversions/${encodeURIComponent(next.id)}/submit`,
          {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify({
              assignedTo: next.assignedTo,
              assignedToName: next.assignedToName,
              submittedAt: next.submittedAt,
              assignedAt: next.assignedAt,
              attempt: next.attempt,
            }),
          },
        )
        if (!response.ok) throw new Error("Failed to submit conversion for approval")
        return response.json() as Promise<PolicyDraft>
      })

      const latest = read()
      const savedIndex = latest.findIndex((item) => item.id === saved.id)
      if (savedIndex >= 0) latest[savedIndex] = saved
      else latest.unshift(saved)
      write([...latest])
      return saved
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
      const current = read()
      const d = current.find((x) => x.id === id)
      if (!d) return undefined
      const now = new Date().toISOString()
      const entry: ReassignmentEntry = {
        at: now,
        byId: actor.id ?? null,
        byName: actor.name ?? null,
        fromId: d.assignedTo ?? null,
        fromName: d.assignedToName ?? null,
        toId: assignee.id ?? null,
        toName: assignee.name ?? null,
      }
      const next: PolicyDraft = {
        ...d,
        status: "pending_approval",
        assignedTo: assignee.id ?? null,
        assignedToName: assignee.name ?? null,
        assignedAt: now,
        reassignments: [...(d.reassignments || []), entry],
        updatedAt: now,
      }
      return writeOne(next, current)
    },
    [],
  )

  const approveDraft = useCallback(
    (id: string, approver: { id?: string | null; name?: string | null }, note?: string | null) => {
      const current = read()
      const d = current.find((x) => x.id === id)
      if (!d) return undefined
      const now = new Date().toISOString()
      const next: PolicyDraft = {
        ...d,
        status: "approved",
        approvedBy: approver.id ?? null,
        approvedByName: approver.name ?? null,
        approvedAt: now,
        reviewNote: note?.trim() || null,
        reviewedBy: approver.id ?? null,
        reviewedByName: approver.name ?? null,
        reviewedAt: now,
        reviewHistory: [
          ...(d.reviewHistory || []),
          {
            at: now,
            attempt: d.attempt || 1,
            decision: "approved",
            byId: approver.id ?? null,
            byName: approver.name ?? null,
            note: note?.trim() || null,
          },
        ],
        updatedAt: now,
      }
      const saved = writeOne(next, current)

      if (saved && saved.status === "approved") {
        const fullName = saved.form?.fullName || saved.form?.clientName || "Unnamed Client"
        addClient({
          fullName,
          email: saved.form?.email,
          contactNumber: saved.form?.contactNumber,
          idNumber: saved.form?.idNumber,
          dateOfBirth: saved.form?.dateOfBirth,
          productType: saved.productType || saved.form?.productName || "Policy",
          optionLabel: saved.optionLabel,
          quoteId: saved.quoteId,
          premium: saved.premium,
        })
      }

      return saved
    },
    [addClient],
  )

  const rejectDraft = useCallback(
    (id: string, reviewer: { id?: string | null; name?: string | null }, reason: string) => {
      const current = read()
      const d = current.find((x) => x.id === id)
      if (!d) return undefined
      const now = new Date().toISOString()
      const next: PolicyDraft = {
        ...d,
        status: "rejected",
        rejectedBy: reviewer.id ?? null,
        rejectedByName: reviewer.name ?? null,
        rejectedAt: now,
        rejectionReason: reason,
        reviewNote: reason,
        reviewedBy: reviewer.id ?? null,
        reviewedByName: reviewer.name ?? null,
        reviewedAt: now,
        reviewHistory: [
          ...(d.reviewHistory || []),
          {
            at: now,
            attempt: d.attempt || 1,
            decision: "rejected",
            byId: reviewer.id ?? null,
            byName: reviewer.name ?? null,
            note: reason,
          },
        ],
        updatedAt: now,
      }
      return writeOne(next, current)
    },
    [],
  )

  const createPolicy = useCallback(async (payload: {
    quoteId?: string | null
    productType?: string | null
    form?: Record<string, string>
    step?: number
    optionLabel?: string | null
    premium?: number | null
    clientId?: string | null
  }) => {
    const res = await fetch(`${API_BASE}/policies`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error("Failed to create policy")
    return res.json()
  }, [])

  const updatePolicy = useCallback(async (id: string, patch: Record<string, unknown>) => {
    const res = await fetch(`${API_BASE}/policies/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw new Error("Failed to update policy")
    return res.json()
  }, [])

  const submitPolicy = useCallback(async (id: string, assignee?: { id?: string | null; name?: string | null }) => {
    const res = await fetch(`${API_BASE}/policies/${encodeURIComponent(id)}/submit`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({
        assignedTo: assignee?.id ?? null,
        assignedToName: assignee?.name ?? null,
      }),
    })
    if (!res.ok) throw new Error("Failed to submit policy")
    return res.json()
  }, [])

  const approvePolicy = useCallback(async (id: string, note?: string | null) => {
    const res = await fetch(`${API_BASE}/policies/${encodeURIComponent(id)}/approve`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ note: note || null }),
    })
    if (!res.ok) throw new Error("Failed to approve policy")
    return res.json()
  }, [])

  const returnPolicy = useCallback(async (id: string, reason: string) => {
    const res = await fetch(`${API_BASE}/policies/${encodeURIComponent(id)}/return`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    })
    if (!res.ok) throw new Error("Failed to return policy")
    return res.json()
  }, [])

  const fetchPipeline = useCallback(async () => {
    const res = await fetch(`${API_BASE}/policies/pipeline`, { headers: authHeaders() })
    if (!res.ok) return []
    return res.json()
  }, [])

  const fetchClientPolicies = useCallback(async (clientId: string) => {
    const res = await fetch(`${API_BASE}/clients/${encodeURIComponent(clientId)}/policies`, { headers: authHeaders() })
    if (!res.ok) return []
    return res.json()
  }, [])

  return {
    drafts,
    syncError,
    refresh,

    saveDraft,
    removeDraft,
    submitForApproval,
    reassignDraft,
    approveDraft,
    rejectDraft,
    createPolicy,
    updatePolicy,
    submitPolicy,
    approvePolicy,
    returnPolicy,
    fetchPipeline,
    fetchClientPolicies,
  }
}

/** Single source of truth for how a conversion status is labelled app-wide. */
export const STATUS_LABEL: Record<DraftStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Review",
  APPROVED: "Approved",
  ACTIVE: "Active",
  draft: "Draft",
  pending_approval: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
}

export const STATUS_BADGE: Record<DraftStatus, string> = {
  DRAFT: "border-slate-300 text-slate-500 dark:text-slate-400",
  PENDING_APPROVAL: "border-amber-300 text-amber-600 dark:text-amber-400",
  APPROVED: "border-emerald-300 text-emerald-600 dark:text-emerald-400",
  ACTIVE: "border-emerald-300 text-emerald-600 dark:text-emerald-400",
  draft: "border-slate-300 text-slate-500 dark:text-slate-400",
  pending_approval: "border-amber-300 text-amber-600 dark:text-amber-400",
  approved: "border-emerald-300 text-emerald-600 dark:text-emerald-400",
  rejected: "border-red-300 text-red-600 dark:text-red-400",
}

export const draftStatus = (d?: PolicyDraft | null): DraftStatus =>
  (d?.status as DraftStatus) || "draft"
