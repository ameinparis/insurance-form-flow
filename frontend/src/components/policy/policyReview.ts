export interface ReviewField { label: string; value: string; full?: boolean }
export interface ReviewRow { name: string; detail?: string; value?: string }
export interface ReviewDocument { key: string; label: string; name: string; uploaded: boolean }
export interface PolicyReviewSection {
  title: string
  editStep?: string
  badge?: string
  badgeTone?: "muted" | "success" | "warning"
  fields?: ReviewField[]
  rows?: ReviewRow[]
  documents?: ReviewDocument[]
  emptyText?: string
}
export interface PolicyReviewSnapshot { version: 1; sections: PolicyReviewSection[] }

/** Submitted display values are authoritative; never derive amounts using current fees or fund data. */
export function readPolicyReview(value?: string): PolicyReviewSnapshot | null {
  if (!value) return null
  try {
    const snapshot = JSON.parse(value)
    if (snapshot?.version !== 1 || !Array.isArray(snapshot.sections)) return null
    if (!snapshot.sections.every((section: PolicyReviewSection) => typeof section.title === "string"
      && (!section.fields || (Array.isArray(section.fields) && section.fields.every((field) => typeof field.label === "string" && typeof field.value === "string")))
      && (!section.rows || (Array.isArray(section.rows) && section.rows.every((row) => typeof row.name === "string")))
      && (!section.documents || (Array.isArray(section.documents) && section.documents.every((doc) => typeof doc.key === "string" && typeof doc.label === "string" && typeof doc.name === "string"))))) return null
    return snapshot
  } catch { return null }
}