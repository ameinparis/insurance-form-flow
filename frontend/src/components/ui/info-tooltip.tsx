import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface InfoTooltipProps {
  text: string
  className?: string
}

export const InfoTooltip = ({ text, className = "" }: InfoTooltipProps) => (
  <TooltipProvider delayDuration={150}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More info"
          className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[#1B405B]/50 dark:text-[#DFF3EB]/50 hover:text-[#163144] dark:hover:text-[#DFF3EB] transition-colors ${className}`}
        >
          <Info className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        {text}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)
