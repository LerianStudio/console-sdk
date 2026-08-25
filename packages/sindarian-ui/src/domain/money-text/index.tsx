/**
 * MoneyText renders a monetary amount with optional ISO currency code,
 * tabular figures so columns line up. The amount is formatted losslessly: when
 * passed as a string, `Intl.NumberFormat.format()` (ES2020+) parses it as an
 * arbitrary-precision value and rounds to `fractionDigits` without ever
 * round-tripping through an IEEE-754 double — so 16+ significant-digit tokens
 * keep every digit. Pass the raw decimal string (not a pre-coerced Number) to
 * preserve that guarantee.
 *
 * The currency code is shown as a suffix rather than a symbol so mixed-currency
 * ledgers stay unambiguous. Negative amounts get the destructive color;
 * null/undefined/empty render the muted no-value placeholder.
 *
 * SIGN COLOR IS NOT THE CREDIT ROLE. `--destructive` marks a negative/alarm
 * amount; `--credit` is the accounting reading of a credit amount. They are two
 * roles, and a consumer layers the credit role on top (matcher's fork passes
 * `signColor={false}` with `tone="credit"` precisely so the two never fight).
 * Collapsing the sign color into `text-credit` would erase that distinction —
 * this class stays `text-destructive`, as in sindarian-x@0.15.0.
 */
import { cn } from '@/lib/utils'

import { NO_VALUE, isValidDigitCount } from '../format'

export type MoneyTextProps = {
  amount: string | number | null | undefined
  /** ISO 4217 currency code, e.g. "BRL", "USD". */
  currency?: string | null
  /** Number of fraction digits. Defaults to 2. */
  fractionDigits?: number
  /** Hide the trailing currency code. */
  hideCurrency?: boolean
  /** Color negative values red. Defaults to true. */
  signColor?: boolean
  /** BCP 47 locale for grouping/decimal marks. Defaults to the runtime locale. */
  locale?: string
  className?: string
}

/**
 * Normalize a raw amount into a string the Intl formatter accepts while
 * preserving precision: trim, convert the unicode minus U+2212 to ASCII '-',
 * and rewrite accounting parens `(123.45)` → `-123.45`. Returns null when the
 * input is empty after trimming (→ NO_VALUE upstream).
 *
 * Internal: exported for its unit tests, never from `src/domain/index.ts`.
 */
export function normalizeAmount(amount: string | number): string | null {
  let s = String(amount).trim()
  if (s === '') return null
  s = s.replace(/−/g, '-')
  const parens = s.match(/^\((.*)\)$/)
  if (parens) s = `-${parens[1].trim()}`
  return s
}

/**
 * Pure money formatting: normalize the amount, format it via Intl (preserving
 * precision through the ES2020 string overload), and derive sign + finiteness
 * from the formatted parts — so color and glyph can never disagree. Returns
 * null for empty, non-finite, or unparseable input (→ NO_VALUE upstream).
 *
 * Internal: exported for its unit tests, never from `src/domain/index.ts`.
 */
export function formatMoneyParts(
  amount: string | number,
  fractionDigits: number,
  locale?: string
): { formatted: string; negative: boolean } | null {
  // Reject non-finite numeric inputs (NaN / ±Infinity) before they reach Intl,
  // which would otherwise render literal "NaN" / "∞".
  if (typeof amount === 'number' && !Number.isFinite(amount)) return null
  // A caller-supplied digit count reaches Intl directly; an out-of-range one
  // would throw a RangeError and blank the amount instead of degrading to
  // NO_VALUE.
  if (!isValidDigitCount(fractionDigits)) return null

  const normalized = normalizeAmount(amount)
  if (normalized === null) return null

  // DELIBERATE DIVERGENCE from sindarian-x@0.15.0: an exact zero written with a
  // sign ('-0', '-0.00', '(0)') formatted as "-0.00" and reported negative:true,
  // which painted a zero balance in the destructive sign color. Zero is neither
  // positive nor negative — a signed-zero ledger cell is a rendering artifact of
  // the input notation, never a fact about the money. The sign is dropped for an
  // EXACT zero only; '-0.004' still rounds to "-0.00" and stays negative,
  // because that one really is below zero.
  const exactZero = /\d/.test(normalized) && /^-?0*(\.0*)?$/.test(normalized)
  const forFormat = exactZero ? normalized.replace(/^-/, '') : normalized

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    signDisplay: 'auto'
  })

  // The bundled lib types only model a `number | bigint` overload; the ES2020
  // string overload (which preserves precision) is unmodelled, so the
  // normalized amount is cast at the boundary.
  //
  // RUNTIME FLOOR: this relies on a V8 with exact decimal-STRING Intl support
  // (Node >= 20, evergreen browsers) — the whole point is that a 20-digit amount
  // never round-trips through an IEEE-754 double. There is deliberately NO
  // Number-coercion fallback for older runtimes: that fallback would silently
  // reintroduce the precision loss this function exists to prevent.
  const parts = formatter.formatToParts(forFormat as unknown as number)

  // Intl emits a literal "nan"/"∞" part for non-finite values; treat those as
  // no-value rather than rendering them.
  if (parts.some((p) => p.type === 'nan' || p.type === 'infinity')) return null

  return {
    formatted: parts.map((p) => p.value).join(''),
    negative: parts.some((p) => p.type === 'minusSign')
  }
}

export function MoneyText({
  amount,
  currency,
  fractionDigits = 2,
  hideCurrency = false,
  signColor = true,
  locale,
  className
}: MoneyTextProps) {
  const noValue = (
    <span className={cn('text-muted-foreground tabular-nums', className)}>
      {NO_VALUE}
    </span>
  )

  if (amount === null || amount === undefined || amount === '') return noValue

  // Sign and finiteness are derived from the formatted parts, not a raw string
  // prefix — so color and glyph can never disagree, and "-0" / "(0)" are
  // treated as the non-negative zero Intl renders.
  const result = formatMoneyParts(amount, fractionDigits, locale)
  if (result === null) return noValue
  const { formatted, negative } = result

  return (
    <span
      className={cn(
        'tabular-nums',
        signColor && negative && 'text-destructive',
        className
      )}
    >
      {formatted}
      {!hideCurrency && currency ? (
        <span className="text-muted-foreground ml-1 text-xs">{currency}</span>
      ) : null}
    </span>
  )
}
