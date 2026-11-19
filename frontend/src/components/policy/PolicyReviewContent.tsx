import { Button } from "@/components/ui/button"
import type { PolicyReviewSection } from "./policyReview"

/** Both advisor and approver render the same saved display values. */
export function PolicyReviewContent({ section, onDocument }: {
  section: PolicyReviewSection
  onDocument?: (key: string, label: string) => void
}) {
  return <>
    {section.fields?.map((field) => <div key={field.label} className={field.full ? "md:col-span-2" : undefined}>
      <p className="text-xs text-muted-foreground">{field.label}</p>
      <p className="break-words text-sm font-medium">{field.value || "—"}</p>
    </div>)}
    {section.rows && <div className="space-y-2 md:col-span-2">
      {section.rows.map((row, index) => <div key={index} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{row.name}</p>{row.detail && <p className="break-words text-xs text-muted-foreground">{row.detail}</p>}</div>
        {row.value && <span className="break-words text-sm font-semibold">{row.value}</span>}
      </div>)}
      {section.rows.length === 0 && <p className="text-sm text-muted-foreground">{section.emptyText}</p>}
    </div>}
    {section.documents && <div className="grid grid-cols-1 gap-2 md:col-span-2 md:grid-cols-2">
      {section.documents.map((doc) => <div key={doc.key} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
        <span className="text-sm">{doc.label}</span>
        {onDocument && doc.uploaded ? <Button variant="ghost" size="sm" className="h-auto min-w-0 whitespace-normal break-words px-1 text-xs font-medium" onClick={() => onDocument(doc.key, doc.label)} title={`Preview ${doc.name}`}>{doc.name}</Button>
          : <span className="min-w-0 break-words text-xs font-medium text-muted-foreground">{doc.name}</span>}
      </div>)}
    </div>}
    {!section.rows && section.emptyText && <p className="text-sm text-muted-foreground md:col-span-2">{section.emptyText}</p>}
  </>
}