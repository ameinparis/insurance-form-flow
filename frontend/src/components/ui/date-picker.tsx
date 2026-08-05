import * as React from "react"
import { format, isValid, parse } from "date-fns"
import { CalendarIcon, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface DatePickerProps {
  /** ISO date string: YYYY-MM-DD */
  value?: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  fromYear?: number
  toYear?: number
  disabled?: boolean
  className?: string
  id?: string
}

const DISPLAY = "dd.MM.yyyy"

const toISO = (d: Date) => format(d, "yyyy-MM-dd")

const parseISO = (v?: string) => {
  if (!v) return undefined
  const d = parse(v, "yyyy-MM-dd", new Date())
  return isValid(d) ? d : undefined
}

/** Accepts 27.09.2021, 27/09/2021, 27-09-2021 or 2021-09-27 */
const parseTyped = (raw: string) => {
  const v = raw.trim()
  if (!v) return null
  const formats = ["dd.MM.yyyy", "dd/MM/yyyy", "dd-MM-yyyy", "yyyy-MM-dd"]
  for (const f of formats) {
    const d = parse(v, f, new Date())
    if (isValid(d)) return d
  }
  return undefined
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = DISPLAY.toUpperCase(),
  fromYear = 1900,
  toYear = new Date().getFullYear() + 10,
  disabled,
  className,
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = parseISO(value)
  const [text, setText] = React.useState(selected ? format(selected, DISPLAY) : "")

  React.useEffect(() => {
    setText(selected ? format(selected, DISPLAY) : "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const commitText = () => {
    const parsed = parseTyped(text)
    if (parsed === null) {
      onChange("")
      return
    }
    if (parsed) {
      onChange(toISO(parsed))
    } else {
      // invalid — restore previous
      setText(selected ? format(selected, DISPLAY) : "")
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "group relative flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm transition-colors",
          "focus-within:border-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground group-focus-within:text-primary" />
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          {label && (
            <span className="block text-[10px] font-medium leading-none text-muted-foreground">
              {label}
            </span>
          )}
          <input
            id={id}
            inputMode="numeric"
            disabled={disabled}
            value={text}
            placeholder={placeholder}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                commitText()
              }
            }}
            className={cn(
              "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed",
              label && "mt-0.5"
            )}
          />
        </div>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label="Open calendar"
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
            />
          </button>
        </PopoverTrigger>
      </div>

      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto rounded-xl border border-border bg-popover p-0 shadow-xl"
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(d) => {
            if (d) {
              onChange(toISO(d))
              setOpen(false)
            }
          }}
          fromYear={fromYear}
          toYear={toYear}
          captionLayout="dropdown-buttons"
          initialFocus
          className="p-3 pointer-events-auto"
          classNames={{
            day_selected:
              "bg-primary text-primary-foreground rounded-full hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "text-primary font-semibold",
            day: "h-9 w-9 p-0 font-normal rounded-full hover:bg-accent aria-selected:opacity-100",
          }}
        />
        <div className="flex items-center gap-2 border-t border-border p-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 rounded-md"
            onClick={() => {
              onChange("")
              setText("")
              setOpen(false)
            }}
          >
            Clear
          </Button>
          <Button
            type="button"
            className="flex-1 rounded-md"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default DatePicker
