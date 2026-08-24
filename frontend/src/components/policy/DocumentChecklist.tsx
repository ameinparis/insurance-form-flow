import { useRef } from "react"
import {
  BadgeCheck,
  Banknote,
  Briefcase,
  CheckCircle2,
  FileSignature,
  FileText,
  MapPin,
  Upload,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export type DocumentDef = {
  key: string
  label: string
  description: string
  conditional?: boolean
  icon: typeof FileText
}

export const POLICY_DOCUMENTS: DocumentDef[] = [
  { key: "identity", label: "Identity document", description: "Omang or passport", icon: BadgeCheck },
  { key: "address", label: "Proof of address", description: "Not older than 3 months", icon: MapPin },
  { key: "tax", label: "Application Form", description: "Clearance or TIN", icon: FileText },
  {
    key: "employment",
    label: "Certificate of Existence",
    description: "Salaried applicants only",
    conditional: true,
    icon: Briefcase,
  },
  { key: "signedQuote", label: "Signed quote", description: "Accepted quote copy", icon: FileSignature },
  { key: "bankLetter", label: "Bank confirmation letter", description: "For payout account", icon: Banknote },
]

export type StoredDoc = { name: string; type?: string; data?: string }

/** Documents are stored as a JSON string (name + type + data URL) with a
 *  fallback for legacy records that only kept the file name. */
export const parseDoc = (value?: string | null): StoredDoc | null => {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === "object" && parsed.name) return parsed as StoredDoc
  } catch {
    /* legacy plain file name */
  }
  return { name: String(value) }
}

export const REQUIRED_DOCUMENTS = POLICY_DOCUMENTS.filter((d) => !d.conditional)

interface Props {
  documents: Record<string, string>
  onChange: (key: string, fileName: string | null) => void
}

const ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"

export function DocumentChecklist({ documents, onChange }: Props) {
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})

  const readFile = (key: string, file: File) => {
    const MAX_INLINE = 3 * 1024 * 1024 // keep records small enough to sync
    if (file.size > MAX_INLINE) {
      onChange(key, JSON.stringify({ name: file.name, type: file.type }))
      return
    }
    const reader = new FileReader()
    reader.onload = () =>
      onChange(key, JSON.stringify({ name: file.name, type: file.type, data: String(reader.result) }))
    reader.onerror = () => onChange(key, JSON.stringify({ name: file.name, type: file.type }))
    reader.readAsDataURL(file)
  }

  const uploadedCount = POLICY_DOCUMENTS.filter((d) => documents[d.key]).length
  const total = POLICY_DOCUMENTS.length
  const progress = Math.round((uploadedCount / total) * 100)

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold">Document checklist</p>
          <p className="text-xs text-muted-foreground">
            {uploadedCount} of {total} uploaded
          </p>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full bg-[#009fe3] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {POLICY_DOCUMENTS.map((doc) => {
          const fileName = parseDoc(documents[doc.key])?.name
          const Icon = doc.icon
          return (
            <div
              key={doc.key}
              className={`relative rounded-2xl border p-4 space-y-3 transition-colors ${
                fileName
                  ? "border-emerald-500/60 bg-emerald-500/5"
                  : "border-gray-200 dark:border-slate-700 bg-card"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    fileName
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {fileName ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                </div>
                {doc.conditional && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Conditional
                  </span>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold">{doc.label}</p>
                <p className="text-xs text-muted-foreground">{doc.description}</p>
              </div>

              <input
                ref={(el) => (inputs.current[doc.key] = el)}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) readFile(doc.key, file)
                  e.target.value = ""
                }}
              />

              {fileName ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-card px-3 py-2">
                  <span className="truncate text-xs font-medium">{fileName}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${doc.label}`}
                    onClick={() => onChange(doc.key, null)}
                    className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => inputs.current[doc.key]?.click()}
                  className="w-full h-10 rounded-xl"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
