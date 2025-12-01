import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { User, Building2 } from "lucide-react"

export interface AutocompleteSuggestion {
  label: string
  subtitle?: string
  data: any
}

interface AutocompleteInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onSelect"> {
  suggestions: AutocompleteSuggestion[]
  onSelect: (suggestion: AutocompleteSuggestion) => void
  loading?: boolean
  icon?: "corporate" | "individual"
}

const AutocompleteInput = React.forwardRef<HTMLInputElement, AutocompleteInputProps>(
  ({ className, suggestions, onSelect, loading, icon = "corporate", ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const showSuggestions = isOpen && (suggestions.length > 0 || loading)

    // Close on outside click
    React.useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Reset highlight when suggestions change
    React.useEffect(() => {
      setHighlightedIndex(-1)
    }, [suggestions])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setHighlightedIndex((prev) => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
          break
        case "Enter":
          if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
            e.preventDefault()
            handleSelect(suggestions[highlightedIndex])
          }
          break
        case "Escape":
          setIsOpen(false)
          break
      }
    }

    const handleSelect = (suggestion: AutocompleteSuggestion) => {
      onSelect(suggestion)
      setIsOpen(false)
      setHighlightedIndex(-1)
    }

    const IconComponent = icon === "corporate" ? Building2 : User

    return (
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Input
            ref={ref}
            className={cn("pr-8", className)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            {...props}
          />
          <IconComponent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {showSuggestions && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
            {loading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Loading suggestions...
              </div>
            ) : suggestions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No matching clients found
              </div>
            ) : (
              <ul className="max-h-60 overflow-auto">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={`${suggestion.label}-${index}`}
                    className={cn(
                      "px-3 py-2 cursor-pointer transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      highlightedIndex === index && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => handleSelect(suggestion)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{suggestion.label}</div>
                        {suggestion.subtitle && (
                          <div className="text-xs text-muted-foreground truncate">
                            {suggestion.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    )
  }
)

AutocompleteInput.displayName = "AutocompleteInput"

export { AutocompleteInput }
