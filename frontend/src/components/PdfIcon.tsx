import { FileText } from "lucide-react"

interface PdfIconProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function PdfIcon({ className = "", size = "md" }: PdfIconProps) {
  const sizeClasses = {
    sm: "w-9 h-9",
    md: "w-11 h-11",
    lg: "w-14 h-14"
  }

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  }

  const textSizes = {
    sm: "text-[6px]",
    md: "text-[7px]",
    lg: "text-[8px]"
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-sky-100 dark:bg-sky-900/30 flex flex-col items-center justify-center ${className}`}>
      <FileText className={`${iconSizes[size]} text-[#009fe3] dark:text-sky-400`} />
      <span className={`${textSizes[size]} font-bold text-[#009fe3] dark:text-sky-400 -mt-0.5`}>PDF</span>
    </div>
  )
}
