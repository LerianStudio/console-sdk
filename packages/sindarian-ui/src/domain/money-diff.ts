/**
 * moneyDiff — the signed difference between two reconciliation sides, computed
 * on integer minor units and never on floats.
 *
 * THIRD RAIL (money): `left − right` runs through `toMinor` on both operands →
 * BigInt subtraction → `minorToDecimal`, and the tolerance breach test compares
 * MAGNITUDES in minor units. A float subtraction of two decimals would drift by
 * a cent at reconciliation scale, which is the difference between a matched and
 * an unmatched pair.
 *
 * A null `decimal` means an unparseable operand — surfaced, never coerced to
 * zero, so a caller renders the no-value placeholder rather than a fabricated
 * tie.
 */
import { minorDigitsOf, minorToDecimal, toMinor } from './money-math'
import type { Amount } from './money-math'

/** The money-comparison contract: two sides, a currency, an optional tolerance. */
type MoneyDiffInput = {
  /** Left amount (canonical decimal string preferred for lossless math). */
  left: Amount
  /** Right amount. The difference is left − right. */
  right: Amount
  /** ISO 4217 currency code, e.g. "BRL". Drives the minor-unit scale. */
  currency: string
  /** Override the currency-derived minor-unit scale. When omitted, the scale
   *  derives from the currency (2 for an unknown one), never a hardcoded 2. */
  minorDigits?: number
  /** Absolute tolerance in MAJOR units. `|left − right| > tolerance` is a breach. */
  tolerance?: Amount
  /** BCP 47 locale for the money figure. */
  locale?: string
}

export function moneyDiff(money: MoneyDiffInput): {
  decimal: string | null
  breach: boolean
} {
  const scale = money.minorDigits ?? minorDigitsOf(money.currency)
  const l = toMinor(money.left, scale)
  const r = toMinor(money.right, scale)
  if (l === null || r === null) return { decimal: null, breach: false }
  const diff = l - r

  // A tolerance that was SUPPLIED but does not parse ('', 'oops', '-.') is not
  // the same thing as no tolerance at all. Degrading to the no-tolerance rule
  // made every nonzero difference a breach, so one typo in a tolerance field
  // turned a reconciled book into a screen of false breaches — the loudest
  // possible wrong answer. A supplied-invalid tolerance is INDETERMINATE,
  // exactly like an unparseable operand: no number, no verdict.
  const supplied = money.tolerance != null
  const rawTol = supplied ? toMinor(money.tolerance, scale) : null
  if (supplied && rawTol === null) return { decimal: null, breach: false }

  // A tolerance is a BAND WIDTH, so only its magnitude is meaningful. Taken
  // signed, a negative tolerance made `|diff| > tol` true for every value
  // including an exact tie (0n > -5n), flagging perfectly reconciled pairs as
  // breaches. Normalizing to the magnitude means `-0.05` and `0.05` describe the
  // same band, which is the only reading of a negative tolerance that is not a
  // silent false alarm.
  const tol = rawTol === null ? null : rawTol < 0n ? -rawTol : rawTol
  const abs = diff < 0n ? -diff : diff
  // A breach is a magnitude STRICTLY beyond the band; no tolerance → no band, so
  // any nonzero difference is itself the breach.
  const breach = tol === null ? diff !== 0n : abs > tol
  return { decimal: minorToDecimal(diff, scale), breach }
}
