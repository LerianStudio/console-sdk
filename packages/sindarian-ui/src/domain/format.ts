/**
 * Ledger-kit formatting helpers. Pure functions, no React. `MoneyText` owns
 * monetary formatting; these cover percent, integer counts, and humanized
 * durations (e.g. an average resolution time arriving as milliseconds).
 */

/** No-value placeholder. A middle dot reads as "empty" without an em dash, and
 * stays narrow enough not to disturb tabular alignment. */
export const NO_VALUE = '·'

/**
 * Whether a digit count is one `Intl.NumberFormat` (and `Number#toFixed`, and
 * `String#repeat`) will actually accept: a finite integer in 0..100. Anything
 * else — a negative, a fraction, NaN, Infinity — makes those constructors throw
 * a RangeError, which on a money surface means a blank screen instead of a
 * number. Every caller turns an invalid count into the no-value path instead.
 *
 * Internal: shared by `format`, `money-text` and `money-math` so the three
 * cannot drift on what "valid" means. Never exported from `src/domain/index.ts`.
 */
export function isValidDigitCount(digits: number): boolean {
  return Number.isInteger(digits) && digits >= 0 && digits <= 100
}

/** Whether an input rate is a 0..1 ratio or an already-scaled 0..100 percent.
 * Defaults to 'ratio' — no guessing from magnitude. */
export type PercentUnit = 'ratio' | 'percent'

export type FormatPercentOptions = {
  /** Fraction digits. Defaults to 1. */
  digits?: number
  /** How to interpret `value`. 'ratio' (default) ×100; 'percent' is already 0..100. */
  unit?: PercentUnit
  /** BCP 47 locale for the decimal mark. Defaults to the runtime locale. */
  locale?: string
}

/**
 * Format a rate as a percent string. `unit` is explicit, never inferred from
 * magnitude: 'ratio' (default) treats `value` as 0..1 and scales ×100;
 * 'percent' treats `value` as already 0..100.
 *
 * Uses Intl style:'percent' for correct rounding and a locale-aware decimal
 * mark. Intl multiplies its input by 100, so we always feed it the RATIO —
 * a 'percent' input is divided by 100 first.
 */
export function formatPercent(
  value: number | null | undefined,
  options: FormatPercentOptions = {}
): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return NO_VALUE
  const { digits = 1, unit = 'ratio', locale } = options
  // A caller-supplied digit count reaches Intl directly; an out-of-range one
  // would throw a RangeError and take the whole surface down with it.
  if (!isValidDigitCount(digits)) return NO_VALUE
  const ratio = unit === 'percent' ? value / 100 : value
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(ratio)
}

/**
 * Normalize a rate to the 0..100 range for chart geometry. `unit` is explicit:
 * 'ratio' (default) scales a 0..1 input ×100; 'percent' is already 0..100.
 */
export function toPercentValue(
  value: number | null | undefined,
  unit: PercentUnit = 'ratio'
): number {
  if (value === null || value === undefined || !Number.isFinite(value)) return 0
  const pct = unit === 'percent' ? value : value * 100
  return Math.max(0, Math.min(100, pct))
}

/** Thousands-grouped integer count. `locale` defaults to the runtime locale. */
export function formatCount(
  value: number | null | undefined,
  locale?: string
): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return NO_VALUE
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    value
  )
}

/**
 * Humanize a millisecond duration into the largest two sensible units.
 * 0ms → "0s". Sub-minute → seconds. Otherwise the two most-significant
 * CONTIGUOUS d/h/m units from the largest non-zero unit down — so "2d 0h 5m"
 * renders as "2d 0h", not the misleading "2d 5m".
 *
 * Note: the d/h/m/s suffixes are English; localizing them is deferred.
 */
export function humanizeDurationMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return NO_VALUE
  if (ms === 0) return '0s'

  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  // Two contiguous units starting at the largest non-zero unit, in order.
  const units: Array<[number, string]> = [
    [days, 'd'],
    [hours, 'h'],
    [minutes, 'm']
  ]
  const start = units.findIndex(([n]) => n > 0)
  if (start === -1) return `${minutes}m`
  return units
    .slice(start, start + 2)
    .map(([n, suffix]) => `${n}${suffix}`)
    .join(' ')
}
