'use client'

/**
 * SearchInput — the console filter row's text field.
 *
 * A controlled text field with a leading search glyph and a trailing clear
 * button that appears only when there is text. It debounces the *emission*
 * (`onValueChange`) while keeping the visible field perfectly responsive: a
 * local draft mirrors the controlled `value`, every keystroke updates the draft
 * immediately, and a trailing timer flushes the draft to the parent after
 * `debounceMs`. Clearing flushes synchronously (no lingering timer fighting an
 * explicit empty).
 *
 * Composes sindarian-ui's Input via its start/end adornment slots.
 */
import * as React from 'react'
import { Search, X } from 'lucide-react'

import { IconButton } from '@/components/ui/icon-button'
import { Input, InputAdornment } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type SearchInputProps = {
  /** Controlled value. The visible field mirrors this between keystrokes. */
  value: string
  /** Debounced emission of the current text. */
  onValueChange: (value: string) => void
  /** Trailing debounce in ms before `onValueChange` fires. Default 250. */
  debounceMs?: number
  placeholder?: string
  /** Accessible label for the field (defaults to the placeholder or "Search"). */
  'aria-label'?: string
  /** Accessible label for the clear button. */
  clearLabel?: string
  disabled?: boolean
  className?: string
  id?: string
}

export function SearchInput({
  value,
  onValueChange,
  debounceMs = 250,
  placeholder = 'Search…',
  'aria-label': ariaLabel,
  clearLabel = 'Clear search',
  disabled = false,
  className,
  id
}: SearchInputProps) {
  // Local draft keeps typing instant; the controlled `value` is the source of
  // truth between edits. When the parent changes `value` out of band (reset,
  // programmatic set), the draft follows.
  const [draft, setDraft] = React.useState(value)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  // The last value this component emitted. The parent echoes it back one render
  // later, by which time the user may already have typed further — syncing the
  // draft to that echo would rewind the field and swallow those keystrokes.
  const lastEmitted = React.useRef(value)

  React.useEffect(() => {
    // Only follow a genuinely EXTERNAL change (reset, programmatic set); ignore
    // the echo of our own emission.
    if (value === lastEmitted.current) return
    setDraft(value)
  }, [value])

  const clearTimer = React.useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  // Cancel any pending debounced emission on unmount — don't fire a stale
  // search into a parent that's tearing down. (Clearing flushes synchronously
  // via handleClear, so a real clear is never lost.)
  React.useEffect(() => clearTimer, [clearTimer])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value
    setDraft(next)
    clearTimer()
    timer.current = setTimeout(() => {
      timer.current = null
      lastEmitted.current = next
      onValueChange(next)
    }, debounceMs)
  }

  const handleClear = () => {
    clearTimer()
    setDraft('')
    lastEmitted.current = ''
    onValueChange('')
  }

  const hasValue = draft.length > 0

  return (
    <div className={cn('relative w-full sm:w-64', className)}>
      <Input
        id={id}
        type="search"
        role="searchbox"
        value={draft}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder ?? 'Search'}
        disabled={disabled}
        // The native search clear glyph would duplicate our button.
        className="[&::-webkit-search-cancel-button]:appearance-none"
        startAdornment={
          <InputAdornment position="start">
            <Search aria-hidden />
          </InputAdornment>
        }
        endAdornment={
          hasValue ? (
            <InputAdornment position="end">
              <IconButton
                type="button"
                variant="plain"
                size="small"
                aria-label={clearLabel}
                disabled={disabled}
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </IconButton>
            </InputAdornment>
          ) : undefined
        }
      />
    </div>
  )
}
