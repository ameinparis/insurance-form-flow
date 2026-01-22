import { FileText } from "lucide-react"

interface PdfIconProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function PdfIcon({ className = "", size = "md" }: PdfIconProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-11 h-11"
  }

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4"
  }

  const textSizes = {
    sm: "text-[5px]",
    md: "text-[6px]",
    lg: "text-[7px]"
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-[hsl(var(--accent-bg))] flex flex-col items-center justify-center gap-px ${className}`}>
      <FileText className={`${iconSizes[size]} text-[hsl(var(--accent-primary))] shrink-0`} />
      <span className={`${textSizes[size]} font-bold text-[hsl(var(--accent-primary))] leading-none`}>PDF</span>
    </div>
  )
}
