'use client'

/**
 * NumberInput — a controlled numeric input with +/- steppers.
 *
 * Composes sindarian-ui's Input (the text field) and IconButton (the two
 * steppers). The external contract is a plain `number | null` (null = empty).
 * Steppers step by `step` and clamp the result to [min, max]. While focused the
 * field shows the raw, editable string the user is typing; on blur it reformats
 * the committed number via Intl.NumberFormat(locale, { maximumFractionDigits:
 * precision }) (e.g. 1,234.50). Parsing always emits the raw number, so digits
 * the user types are never silently rewritten mid-edit.
 */
import * as React from 'react'
import { Minus, Plus } from 'lucide-react'

import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type NumberInputProps = {
  /** Committed value. `null` means the field is empty. */
  value: number | null
  /** Fires on every edit and stepper press; `null` when the field is cleared. */
  onValueChange: (next: number | null) => void
  min?: number
  max?: number
  /** Stepper increment. Defaults to 1. */
  step?: number
  /** Fraction digits used for the blurred Intl.NumberFormat display. */
  precision?: number
  /** BCP 47 locale tag for the blurred display. Defaults to the host's. */
  locale?: string
  disabled?: boolean
  /** Accessible label for the field; also names the +/- buttons. */
  'aria-label'?: string
  /** Wired as aria-describedby on the input. */
  'aria-describedby'?: string
  /** id (and de-facto testid) for the input element. */
  id?: string
  className?: string
  placeholder?: string
}

function clamp(value: number, min?: number, max?: number): number {
  let next = value
  if (typeof min === 'number' && next < min) next = min
  if (typeof max === 'number' && next > max) next = max
  return next
}

/**
 * `Number.prototype.toFixed` rejects more than 100 fraction digits. Denormals
 * genuinely need more (`decimalPlaces(5e-324)` is 324), so this is a RangeError
 * guard, not a precision policy — no step a person types comes close.
 */
const MAX_FIXED_DIGITS = 100

/**
 * Fraction digits a number carries, reading exponent notation correctly.
 * `String(1e-7)` is `'1e-7'`, which has no '.' at all, so counting characters
 * after a decimal point reports 0 and silently kills any step below 1e-6.
 * `toExponential()` gives a canonical mantissa/exponent pair instead:
 * 1e-7 -> mantissa '1', exponent -7 -> 7 fraction digits.
 */
function decimalPlaces(value: number): number {
  if (!Number.isFinite(value) || Number.isInteger(value)) return 0
  const [mantissa, exponent] = value.toExponential().split('e')
  const mantissaDigits = (mantissa.split('.')[1] ?? '').length
  return Math.max(0, mantissaDigits - Number(exponent))
}

/**
 * Snap a stepped result to the fraction digits its own operands carry, so
 * binary float drift never escapes to the parent: stepping 0.1 by 0.2 must
 * commit 0.3, not 0.30000000000000004.
 *
 * Anchoring on the OPERANDS is what makes this safe at both ends of the range.
 * Rounding to a fixed number of significant digits cannot work: at 1e15 the
 * 15th significant digit is the units place, so 1e15 + 0.5 would snap straight
 * back to 1e15 and the stepper would die. Nor can a "is this change small
 * enough to be noise?" tolerance decide it — 1e15 + 0.125 is exactly
 * representable and must be kept, yet its relative distance from the rounded
 * form (1.25e-16) is SMALLER than genuine drift in 0.1 + 0.2 (1.85e-16), so no
 * threshold separates the two cases. The operands do: `1e15` and `0.5` need one
 * fraction digit between them, `0.1` and `0.2` also one, and rounding each
 * result to its own digit count keeps the first and repairs the second.
 *
 * `toFixed` (not `value * 10 ** digits`) does the rounding: the multiply
 * overflows Number.MAX_SAFE_INTEGER for large values and hands back the very
 * drift it was meant to remove.
 */
function snapToStep(value: number, base: number, step: number): number {
  if (!Number.isFinite(value)) return value
  const digits = Math.min(
    MAX_FIXED_DIGITS,
    Math.max(decimalPlaces(base), decimalPlaces(step))
  )
  return Number(value.toFixed(digits))
}

/** The locale's decimal and group separators, derived from a known sample. */
function localeSeparators(locale?: string): { decimal: string; group: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(11111.1)
  const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.'
  const group = parts.find((p) => p.type === 'group')?.value ?? ''
  return { decimal, group }
}

/**
 * Parse the editable string into a number, round-tripping the component's
 * `locale`: strip the locale group separators, swap the locale decimal mark to
 * '.', then `Number()`. Null when empty/unparseable.
 *
 * Internal (not part of the public barrel) but exported for its unit tests —
 * numeric-entry correctness is the load-bearing behavior here.
 */
export function parseRaw(raw: string, locale?: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const { decimal, group } = localeSeparators(locale)
  let normalized = trimmed
  if (group) normalized = normalized.split(group).join('')
  if (decimal !== '.') normalized = normalized.split(decimal).join('.')
  if (normalized === '') return null
  const parsed = Number(normalized)
  return Number.isNaN(parsed) ? null : parsed
}

/**
 * A transient partial entry that should not commit yet — a lone sign, a lone
 * decimal mark, sign+decimal, or a value ending in the decimal mark (the user
 * is still typing). Suppressing these keeps the external value from
 * round-tripping through `null` mid-edit.
 *
 * Internal (not part of the public barrel) but exported for its unit tests.
 */
export function isTransientPartial(raw: string, locale?: string): boolean {
  const trimmed = raw.trim()
  if (trimmed === '') return false
  const { decimal } = localeSeparators(locale)
  const d = decimal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^-?(${d})?$|${d}$`).test(trimmed)
}

export function NumberInput({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  precision,
  locale,
  disabled = false,
  id,
  className,
  placeholder,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}: NumberInputProps) {
  const [focused, setFocused] = React.useState(false)
  // The string the user is editing. Only authoritative while focused.
  const [draft, setDraft] = React.useState('')

  const formatter = React.useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        maximumFractionDigits: precision ?? 20,
        minimumFractionDigits: precision ?? 0,
        useGrouping: true
      }),
    [locale, precision]
  )

  // Blurred display: locale-formatted committed value, or empty.
  const displayValue = focused
    ? draft
    : value === null
      ? ''
      : formatter.format(value)

  const commit = (next: number | null) => {
    onValueChange(next)
  }

  const stepBy = (direction: 1 | -1) => {
    const base = value ?? 0
    const next = snapToStep(
      clamp(base + direction * step, min, max),
      base,
      step
    )
    commit(next)
    // Seed the draft via the locale formatter so a stepper press doesn't flip
    // the user's separators (e.g. ',' → '.').
    if (focused) setDraft(formatter.format(next))
  }

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    setDraft(raw)
    // Commit only a genuine clear or a parsed number; suppress transient
    // partials ("-", ".", "-.", trailing separator) so typing a negative or
    // decimal doesn't round-trip the external value through null mid-entry.
    if (raw.trim() === '') {
      commit(null)
      return
    }
    if (isTransientPartial(raw, locale)) return
    const parsed = parseRaw(raw, locale)
    if (parsed !== null) commit(parsed)
  }

  // Keyboard stepping (WCAG 2.1.1): the steppers are tabIndex={-1}, so the
  // input owns keyboard interaction per the ARIA spinbutton pattern.
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      stepBy(1)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      stepBy(-1)
    }
  }

  const onFocus = () => {
    setFocused(true)
    // Seed via the locale formatter (not String(value), which forces '.') so
    // focusing doesn't flip the separator the user expects.
    setDraft(value === null ? '' : formatter.format(value))
  }

  const onBlur = () => {
    setFocused(false)
    // Re-clamp the committed value so a typed out-of-range entry settles.
    if (value !== null) {
      const clamped = clamp(value, min, max)
      if (clamped !== value) commit(clamped)
    }
  }

  const atMin = typeof min === 'number' && value !== null && value <= min
  const atMax = typeof max === 'number' && value !== null && value >= max

  return (
    <div className={cn('inline-flex items-stretch gap-1', className)}>
      <IconButton
        type="button"
        variant="outline"
        disabled={disabled || atMin}
        aria-label={`Decrease${ariaLabel ? ` ${ariaLabel}` : ''}`}
        onClick={() => stepBy(-1)}
        tabIndex={-1}
      >
        <Minus className="size-4" aria-hidden />
      </IconButton>
      <div className="w-28">
        <Input
          id={id}
          inputMode="decimal"
          role="spinbutton"
          aria-valuenow={value ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          className="text-right tabular-nums"
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
      <IconButton
        type="button"
        variant="outline"
        disabled={disabled || atMax}
        aria-label={`Increase${ariaLabel ? ` ${ariaLabel}` : ''}`}
        onClick={() => stepBy(1)}
        tabIndex={-1}
      >
        <Plus className="size-4" aria-hidden />
      </IconButton>
    </div>
  )
}
