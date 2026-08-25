'use client'

/**
 * DateRangePicker — a single popover range control.
 *
 * Two labelled mono trigger segments (from / to) share one two-month
 * react-day-picker range calendar. The external contract is plain YYYY-MM-DD
 * strings (empty string = unset) so state shapes that speak `date_from`/
 * `date_to` stay untouched. The picker guarantees from <= to (react-day-picker
 * reorders inverted picks); aria-invalid/aria-describedby pass-throughs keep
 * external validation wiring alive. i18n is via plain string/locale props.
 */
import { useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { CalendarDays } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { enUS } from 'react-day-picker/locale'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { SECTION_LABEL_CLASS } from '@/lib/typography'
import { cn } from '@/lib/utils'

/**
 * The calendar's locale type, taken straight off the Calendar props so the
 * public signature stays the react-day-picker/date-fns `Locale` without this
 * package taking a direct date-fns dependency.
 */
type CalendarLocale = ComponentProps<typeof Calendar>['locale']

export type DateRangeValue = {
  /** YYYY-MM-DD or '' when unset. */
  from: string
  /** YYYY-MM-DD or '' when unset. */
  to: string
}

export type DateRangePickerProps = {
  value: DateRangeValue
  onValueChange: (next: DateRangeValue) => void
  /** id (and de-facto testid) of the "from" trigger; the label points at it. */
  fromId: string
  toId: string
  fromLabel: ReactNode
  toLabel: ReactNode
  invalid?: boolean
  /** Wired as aria-describedby on both triggers while `invalid` is set. */
  errorId?: string
  /** Trigger placeholder when unset. */
  placeholder?: string
  /** Accessible label for the calendar popover. */
  ariaLabel?: string
  /** Label for the clear button. */
  clearLabel?: string
  /** date-fns locale for the calendar. Defaults to en-US. */
  locale?: CalendarLocale
}

/** Leading YYYY-MM-DD of an ISO date (or date-time) string. */
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})/

/**
 * Parse a YYYY-MM-DD day into a LOCAL-midnight Date — the calendar works in
 * local time, so building from parts avoids the UTC shift `new Date(string)`
 * applies to date-only input (which can land the picker a day early).
 * Rejects impossible calendar days (e.g. 2024-02-31, which would roll over).
 */
function parseDay(value: string): Date | undefined {
  const match = ISO_DAY.exec(value)
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)
  return parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
    ? parsed
    : undefined
}

/** Format a Date back to YYYY-MM-DD in LOCAL time (never via toISOString). */
function toDayString(value: Date | undefined): string {
  if (!value) return ''
  const year = String(value.getFullYear()).padStart(4, '0')
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function DateRangePicker({
  value,
  onValueChange,
  fromId,
  toId,
  fromLabel,
  toLabel,
  invalid = false,
  errorId,
  placeholder = 'Any date',
  ariaLabel = 'Select date range',
  clearLabel = 'Clear',
  locale = enUS
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  const fromDate = parseDay(value.from)
  const toDate = parseDay(value.to)
  const selected: DateRange | undefined =
    fromDate || toDate ? { from: fromDate, to: toDate } : undefined
  const hasValue = Boolean(fromDate ?? toDate)

  const onSelect = (range: DateRange | undefined) => {
    onValueChange({
      from: toDayString(range?.from),
      to: toDayString(range?.to)
    })
  }

  const triggerClass = cn(
    'border-input bg-card hover:bg-secondary focus-visible:ring-ring flex h-9 items-center gap-2 rounded-md border px-3 text-left font-mono text-sm tabular-nums transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none sm:w-40',
    invalid && 'border-destructive'
  )

  const renderTrigger = (id: string, label: ReactNode, dateValue: string) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className={SECTION_LABEL_CLASS}>
        {label}
      </Label>
      <button
        type="button"
        id={id}
        className={triggerClass}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        onClick={() => setOpen(true)}
      >
        <CalendarDays
          className="text-muted-foreground size-4 shrink-0"
          aria-hidden
        />
        {dateValue ? (
          <span>{dateValue}</span>
        ) : (
          <span className="text-muted-foreground font-sans">{placeholder}</span>
        )}
      </button>
    </div>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          {renderTrigger(fromId, fromLabel, value.from)}
          {renderTrigger(toId, toLabel, value.to)}
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="w-auto p-0"
        aria-label={ariaLabel}
      >
        <Calendar
          mode="range"
          numberOfMonths={2}
          defaultMonth={fromDate ?? toDate ?? new Date()}
          selected={selected}
          onSelect={onSelect}
          locale={locale}
        />
        <div className="border-border flex items-center justify-end border-t px-3 py-2">
          <Button
            type="button"
            variant="plain"
            size="small"
            disabled={!hasValue}
            onClick={() => onValueChange({ from: '', to: '' })}
          >
            {clearLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
