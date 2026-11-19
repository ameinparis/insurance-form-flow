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

/** Capture the same net-based portfolio display once, alongside the existing policy form. */
export function buildPortfolioReview({ funds, allocations, netInvestment, riskProfile, notes, skipped }: {
  funds: Array<{ id: string; name: string; assetManagerName?: string }>
  allocations: Record<string, string>
  netInvestment: number | null
  riskProfile?: string
  notes?: string
  skipped?: boolean
}): PolicyReviewSection {
  const total = Object.values(allocations).reduce((sum, value) => sum + (Number(value) || 0), 0)
  const currency = (value: number) => `BWP ${value.toLocaleString("en-BW", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return {
    title: "Investment Portfolio Setup",
    badge: skipped ? "Skipped" : `Total: ${total}%`,
    badgeTone: skipped ? "muted" : total === 100 ? "success" : "warning",
    fields: [
      { label: "Net Investment Amount", value: netInvestment === null ? "Not recorded" : currency(netInvestment) },
      { label: "Total Allocation", value: `${total}%` },
      { label: "Risk Profile", value: riskProfile || "" },
      { label: "Notes", value: notes || "" },
    ],
    ...(skipped ? { emptyText: "This step was skipped and can be completed later." } : {
      rows: funds.map((fund) => {
        const percent = Number(allocations[fund.id] ?? 0)
        return { name: fund.name, detail: fund.assetManagerName,
          value: `${percent}% — ${netInvestment === null ? "Amount not recorded" : currency(netInvestment * percent / 100)}` }
      }),
      emptyText: "No fund allocations captured",
    }),
  }
}

/** Old submissions have no review snapshot: use saved names, percentages and net amount only.
 * Never look up the current catalogue/fees or substitute the gross investment amount.
 */
export function readSavedPortfolio(form: Record<string, string>): PolicyReviewSection | null {
  try {
    const savedSection = readPolicyReview(form.portfolioReviewSnapshot)?.sections[0]
    if (savedSection?.title === "Investment Portfolio Setup") return savedSection
    const funds = JSON.parse(form.selectedFunds || "[]")
    const allocations = JSON.parse(form.portfolioAllocations || "{}")
    if (!Array.isArray(funds) || !funds.every((fund) => fund && typeof fund.id === "string" && typeof fund.name === "string")
      || !allocations || typeof allocations !== "object" || Array.isArray(allocations)) return null
    if (!funds.length && form.portfolioSkipped !== "yes") return null
    const net = form.netInvestment?.trim() ? Number(form.netInvestment.replace(/,/g, "")) : NaN
    return buildPortfolioReview({ funds, allocations, netInvestment: Number.isFinite(net) ? net : null,
      riskProfile: form.riskProfile, notes: form.portfolioNotes, skipped: form.portfolioSkipped === "yes" })
  } catch { return null }
}

/** An intact submitted section always wins; supplement only absent/empty legacy sections. */
export function readApprovalReview(form: Record<string, string>): PolicyReviewSnapshot | null {
  const review = readPolicyReview(form.reviewSnapshot)
  if (!review) return null
  const portfolio = review.sections.find((section) => section.title === "Investment Portfolio Setup")
  if (portfolio?.rows?.length || portfolio?.badge === "Skipped") return review
  const savedPortfolio = readSavedPortfolio(form)
  if (!savedPortfolio) return review
  return { ...review, sections: portfolio
    ? review.sections.map((section) => section === portfolio ? savedPortfolio : section)
    : [...review.sections, savedPortfolio] }
}

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