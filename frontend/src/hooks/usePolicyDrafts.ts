import { useCallback, useEffect, useState } from "react"

export interface PolicyDraft {
  id: string
  step: number
  form: Record<string, string>
  productType?: string
  optionLabel?: string
  quoteId?: string
  premium?: number
  status?: "draft" | "pending_approval" | "approved"
  initiatedBy?: string | null
  initiatedByName?: string | null
  initiatedAt?: string | null
  approvedBy?: string | null
  approvedByName?: string | null
  approvedAt?: string | null
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

  const submitForApproval = useCallback((id: string) => {
    write(
      read().map((d) =>
        d.id === id ? { ...d, status: "pending_approval", updatedAt: new Date().toISOString() } : d,
      ),
    )
  }, [])

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

  return { drafts, saveDraft, removeDraft, submitForApproval, approveDraft }
}
