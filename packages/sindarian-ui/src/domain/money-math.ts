/**
 * money-math — exact integer-minor-unit arithmetic for the double-entry third rail.
 *
 * INTERNAL to the domain layer: nothing here is re-exported from
 * `src/domain/index.ts`, so `toMinor`/`Amount`/`sumMinor` are NOT part of
 * `@lerianstudio/sindarian-ui`'s public API. The consumers that need exact money
 * arithmetic reach it through the components that own it (`moneyDiff`,
 * `MoneyText`, `DelinquencyAging`).
 *
 * Amounts parse to integer minor units (BigInt) at a fixed scale; sums never
 * round-trip through IEEE-754. Pass amounts as canonical decimal STRINGS for
 * lossless math — numbers are converted via toFixed, which is float-bounded
 * (fine for display-scale magnitudes, exact for strings).
 */

export type Amount = string | number | null | undefined

// Round half-away-from-zero on the first dropped fraction digit.
function roundsUp(fraction: string, scale: number): boolean {
  return fraction.length > scale && fraction.charCodeAt(scale) - 48 >= 5
}

/** Normalize to a canonical signed decimal: trim, unicode-minus, accounting parens. */
function canonical(raw: string): string {
  let s = raw.trim().replace(/−/g, '-')
  if (/^\(.*\)$/.test(s)) s = '-' + s.slice(1, -1).trim() // (1.23) -> -1.23
  return s
}

/** Amount -> integer minor units at `scale`, or null if unparseable. */
export function toMinor(value: Amount, scale: number): bigint | null {
  if (value === null || value === undefined || value === '') return null
  let s =
    typeof value === 'number'
      ? Number.isFinite(value)
        ? value.toFixed(scale)
        : ''
      : canonical(value)
  if (s === '' || s === '-' || s === '.' || !/^-?\d*(\.\d*)?$/.test(s))
    return null
  const neg = s.startsWith('-')
  if (neg) s = s.slice(1)
  const [intPart = '', fracPart = ''] = s.split('.')
  const frac = (fracPart + '0'.repeat(scale)).slice(0, scale)
  let minor = BigInt((intPart || '0') + frac)
  if (roundsUp(fracPart, scale)) minor += 1n
  return neg ? -minor : minor
}

/** Sum amounts to minor units; null if ANY operand is unparseable (indeterminate). */
export function sumMinor(values: Amount[], scale: number): bigint | null {
  let total = 0n
  for (const v of values) {
    const m = toMinor(v, scale)
    if (m === null) return null
    total += m
  }
  return total
}

/** Currency's minor-unit digit count via CLDR (BRL/USD->2, JPY->0, BHD->3), or fallback. */
export function minorDigitsOf(currency: string, fallback = 2): number {
  try {
    const opts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      currencyDisplay: 'code'
    }).resolvedOptions()
    return opts.maximumFractionDigits ?? fallback
  } catch {
    return fallback
  }
}

/** Minor units -> canonical decimal string (lossless), for handing to MoneyText. */
export function minorToDecimal(minor: bigint, scale: number): string {
  const neg = minor < 0n
  const abs = (neg ? -minor : minor).toString().padStart(scale + 1, '0')
  const intPart = abs.slice(0, abs.length - scale) || '0'
  const fracPart = scale > 0 ? '.' + abs.slice(abs.length - scale) : ''
  return (neg ? '-' : '') + intPart + fracPart
}
