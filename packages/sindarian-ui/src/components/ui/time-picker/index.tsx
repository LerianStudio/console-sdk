'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, '0')
)

export const MINUTES = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, '0')
)

export type TimePickerProps = {
  hour?: number
  minute?: number
  onChange?: (time: { hour: number; minute: number }) => void
  disabled?: boolean
  className?: string
  hourLabel?: string
  minuteLabel?: string
}

function TimeScrollColumn({
  items,
  selected,
  onSelect,
  label,
  disabled
}: {
  items: string[]
  selected: string
  onSelect: (value: string) => void
  label: string
  disabled?: boolean
}) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const hasScrolled = React.useRef(false)
  const prevSelected = React.useRef(selected)

  React.useEffect(() => {
    if (prevSelected.current !== selected) {
      hasScrolled.current = false
      prevSelected.current = selected
    }
  }, [selected])

  React.useEffect(() => {
    if (hasScrolled.current) return
    if (!listRef.current || !selected) return

    const selectedIndex = items.indexOf(selected)
    if (selectedIndex < 0) return

    const selectedElement = listRef.current.children[0]?.children[
      selectedIndex
    ] as HTMLElement | undefined

    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' })
      hasScrolled.current = true
    }
  }, [selected, items])

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center">
      <span className="text-muted-foreground text-xs font-medium select-none">
        {label}
      </span>

      <div className="h-1.5" />

      <div
        ref={listRef}
        className="max-h-60 overflow-y-auto"
        role="group"
        aria-label={label}
      >
        <div className="flex flex-col gap-1 p-1">
          {items.map((item) => {
            const isSelected = item === selected

            return (
              <button
                key={item}
                type="button"
                aria-pressed={isSelected}
                disabled={disabled}
                className={cn(
                  'flex h-8 w-11 items-center justify-center rounded-md text-sm tabular-nums transition-colors',
                  isSelected
                    ? 'bg-accent text-accent-foreground font-bold'
                    : 'text-muted-foreground hover:bg-muted font-normal',
                  disabled && 'pointer-events-none opacity-50'
                )}
                onClick={() => onSelect(item)}
              >
                {item}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TimePicker({
  hour,
  minute,
  onChange,
  disabled,
  className,
  hourLabel = 'Hour',
  minuteLabel = 'Minute'
}: TimePickerProps) {
  const selectedHour = String(hour ?? 0).padStart(2, '0')
  const selectedMinute = String(minute ?? 0).padStart(2, '0')

  const handleHourSelect = React.useCallback(
    (value: string) => {
      onChange?.({ hour: parseInt(value, 10), minute: minute ?? 0 })
    },
    [onChange, minute]
  )

  const handleMinuteSelect = React.useCallback(
    (value: string) => {
      onChange?.({ hour: hour ?? 0, minute: parseInt(value, 10) })
    },
    [onChange, hour]
  )

  return (
    <div data-slot="time-picker" className={cn('flex gap-2 p-3', className)}>
      <TimeScrollColumn
        items={HOURS}
        selected={selectedHour}
        onSelect={handleHourSelect}
        label={hourLabel}
        disabled={disabled}
      />

      <TimeScrollColumn
        items={MINUTES}
        selected={selectedMinute}
        onSelect={handleMinuteSelect}
        label={minuteLabel}
        disabled={disabled}
      />
    </div>
  )
}

export { TimePicker }
