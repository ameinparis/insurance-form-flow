import { FileText } from "lucide-react"

interface PdfIconProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function PdfIcon({ className = "", size = "md" }: PdfIconProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12"
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
