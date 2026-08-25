/**
 * DelinquencyAging — a loan/receivable delinquency surface: the ordered overdue
 * aging distribution PLUS the headline delinquency rate (the share of portfolio
 * value that is past due).
 *
 *   <DelinquencyAging
 *     currency="BRL"
 *     locale="pt-BR"
 *     warn={0.05}
 *     breach={0.1}
 *     buckets={[
 *       { label: 'A vencer', count: 312, total: '1840500.00', overdue: false },
 *       { label: '1–30',     count: 84,  total: '402300.00',  overdue: true },
 *       { label: '31–60',    count: 21,  total: '118900.00',  overdue: true },
 *       { label: '61–90',    count: 9,   total: '54200.00',   overdue: true },
 *       { label: '90+',      count: 4,   total: '38100.00',   overdue: true }
 *     ]}
 *   />
 *
 * The distribution is delegated whole to `AgingBuckets`: it owns the ordered
 * current → 90+ schedule, the per-bucket count/total, the ordinal band cue, and
 * the money-math-exact grand total. This composite adds only the one fact aging
 * alone does not state — the delinquency RATE.
 *
 * THIRD RAIL (money): the rate is overdueTotal / portfolioTotal, and BOTH totals
 * are summed in integer minor units (BigInt, at the currency's CLDR scale) via
 * `money-math` — never an IEEE-754 sum of decimals (0.1 + 0.2 ≠ 0.3 in float, a
 * silent basis-point error on a portfolio). The single floating-point operation
 * is the FINAL division of two already-exact integers, which is the correct,
 * lossless-enough place for it (a ratio is not money). A zero portfolio yields a
 * null rate — an explicit empty readout, never a NaN. A single unparseable
 * bucket total poisons the rate to indeterminate rather than reporting a wrong
 * share.
 *
 * NON-COLOR CUE (WCAG 1.4.1): the rate band (healthy / elevated / distressed) is
 * resolved through the gauge's strict-edge `gaugeBand` (higher-is-worse: more
 * overdue is worse) and named with a glyph + an sr-only word + a tint — the tint
 * is reinforcement only, so the band survives grayscale and color-vision
 * deficiency. A distressed rate reads loud (credit-red, role='alert').
 *
 * Pure display: no directive, no interactivity, server-safe for RSC.
 */
import { AlertOctagon, ShieldCheck, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { LABEL_VOICE_CLASS } from '@/lib/typography'
import { cn } from '@/lib/utils'

import { Figure } from '../figure'
import { formatPercent, NO_VALUE } from '../format'
import { minorDigitsOf, toMinor } from '../money-math'
import { SectionLabel } from '../section-label'
import { gaugeBand } from '../threshold-gauge'
import type { GaugeBand } from '../threshold-gauge'
import { AgingBuckets } from './aging-buckets'
import type { AgingBucket } from './aging-buckets'

/** Fixed-point scale for the rate division: 1e12 keeps twelve decimal places of
 *  a 0..1 ratio, and both it and any in-range scaled quotient stay well inside
 *  the exact-integer range of a double (2^53), so the conversion is lossless. */
const RATE_PRECISION = 1_000_000_000_000n

/** A bucket in the aging schedule, plus the flag that marks it past due. The
 *  `overdue` flag is what the rate's NUMERATOR sums — the caller declares which
 *  bands count as delinquent (typically every band after "current"). */
export interface DelinquencyBucket extends AgingBucket {
  /** Whether this band counts toward the overdue (past-due) numerator. */
  overdue?: boolean
}

/** The delinquency rate resolved from EXACT integer minor-unit totals. `rate`
 *  is null for a zero/empty/indeterminate portfolio — never NaN. */
export interface DelinquencyRate {
  /** overdueMinor / totalMinor as a 0..1 ratio; null when undefined. */
  rate: number | null
  /** Σ(overdue bucket totals) in minor units; null if any total is unparseable. */
  overdueMinor: bigint | null
  /** Σ(all bucket totals) in minor units; null if any total is unparseable. */
  totalMinor: bigint | null
  /** True when the RATE cannot be determined: a bucket total that could not be
   *  parsed, or a negative bucket total (parseable, but not a share of a
   *  portfolio). The sums may still be present in the negative case. */
  indeterminate: boolean
}

/**
 * THIRD RAIL: the delinquency rate = overdue total / portfolio total, with both
 * totals summed through integer minor units (BigInt) at `scale`. The only float
 * operation is the final division of two EXACT integers — never a float sum of
 * decimals. A zero portfolio gives a null rate (explicit empty, no NaN); an
 * unparseable total poisons everything to indeterminate. Pure: unit-tested.
 *
 * Internal: exported for its unit tests, never from `src/domain/index.ts`.
 */
export function delinquencyRate(
  buckets: DelinquencyBucket[],
  scale: number
): DelinquencyRate {
  // Parse each bucket exactly once: the sums and the per-bucket SIGN check both
  // come off the same pass, so the two can never disagree about the same input.
  const parsed = buckets.map((b) => toMinor(b.total, scale))
  if (parsed.some((m) => m === null)) {
    return {
      rate: null,
      overdueMinor: null,
      totalMinor: null,
      indeterminate: true
    }
  }

  let totalMinor = 0n
  let overdueMinor = 0n
  let hasNegativeBucket = false
  parsed.forEach((m, i) => {
    const minor = m as bigint
    if (minor < 0n) hasNegativeBucket = true
    totalMinor += minor
    if (buckets[i].overdue) overdueMinor += minor
  })

  // A NEGATIVE bucket total is parseable but not interpretable as a share of a
  // portfolio: overdue/total stops being bounded by 0..1 the moment a component
  // is negative (a -50 current band against a 100 overdue band yields "200%
  // delinquent"), and it can also cancel the denominator toward zero. A credit
  // adjustment is real data, but it is not aging data, so the honest answer is
  // that the RATE cannot be determined — the sums stay, since they are still
  // correct, and the readout takes the no-value path. Legacy divided anyway and
  // printed the out-of-range percentage.
  if (hasNegativeBucket) {
    return { rate: null, overdueMinor, totalMinor, indeterminate: true }
  }

  // A zero portfolio has no rate to report — null, never overdueMinor/0 (NaN).
  if (totalMinor === 0n) {
    return { rate: null, overdueMinor, totalMinor, indeterminate: false }
  }

  // The division is done as a BOUNDED BigInt ratio first, then converted once.
  // Converting the two totals to Number separately overflowed on a large
  // portfolio: past ~1.8e308 each side becomes Infinity and Infinity/Infinity is
  // NaN — a portfolio big enough to matter reported no rate at all. Scaling the
  // numerator by RATE_PRECISION keeps the quotient the size of a ratio (not the
  // size of the money), so the single Number() sees a value it can hold exactly.
  const scaled = (overdueMinor * RATE_PRECISION) / totalMinor
  const rate = Number(scaled) / Number(RATE_PRECISION)

  // A ratio that still cannot be represented is no rate at all — the readout
  // shows the no-value placeholder rather than a NaN/Infinity artifact.
  if (!Number.isFinite(rate)) {
    return { rate: null, overdueMinor, totalMinor, indeterminate: false }
  }
  return { rate, overdueMinor, totalMinor, indeterminate: false }
}

/** Band → glyph + tint + accessible word. The glyph and sr-only word are the
 *  load-bearing cue; the tint only reinforces, so the band survives grayscale
 *  and color-vision deficiency. Mirrors the gauge's three-band canon, renamed
 *  to the delinquency vocabulary. */
const RATE_BAND: Record<
  GaugeBand,
  { Icon: LucideIcon; tint: string; word: string }
> = {
  low: { Icon: ShieldCheck, tint: 'text-system-success', word: 'Saudável' },
  warn: { Icon: TriangleAlert, tint: 'text-system-alert', word: 'Elevada' },
  breach: { Icon: AlertOctagon, tint: 'text-credit', word: 'Em estresse' }
}

export interface DelinquencyAgingProps {
  /** Ordered current → oldest. Order carries meaning; not reordered internally.
   *  Each band's `overdue` flag selects it into the rate numerator. */
  buckets: DelinquencyBucket[]
  /** ISO 4217 currency code, e.g. "BRL". Drives the minor-unit rate scale. */
  currency?: string
  /** BCP 47 locale for the percent decimal mark and the bucket figures. */
  locale?: string
  /** Quiet caption above the rate readout. Defaults to "Inadimplência". */
  rateLabel?: string
  /** Warn edge for the rate band (0..1 ratio). Crossing it strictly → elevated. */
  warn?: number
  /** Breach edge for the rate band (0..1 ratio). Crossing it strictly → distressed. */
  breach?: number
  /** Render the money-math-exact grand total row under the distribution. */
  showTotal?: boolean
  className?: string
}

export function DelinquencyAging({
  buckets,
  currency,
  locale,
  rateLabel = 'Inadimplência',
  warn = 0.05,
  breach = 0.1,
  showTotal = false,
  className
}: DelinquencyAgingProps) {
  // THIRD RAIL: the rate scale and the two totals come from money-math, never
  // float. The division below is of two exact BigInt-derived integers.
  const scale = currency ? minorDigitsOf(currency) : 2
  const { rate, indeterminate } = delinquencyRate(buckets, scale)

  // The band is only meaningful when there is a rate; an empty/indeterminate
  // portfolio has no band to name (rendered as the explicit no-value readout).
  const hasRate = rate !== null
  // higher-is-worse: more value past due is worse. gaugeBand is strict-edge, so
  // a rate exactly on a threshold stays in the calmer band.
  const band = hasRate
    ? gaugeBand(rate, { warn, breach }, 'higher-is-worse')
    : 'low'
  const { Icon, tint, word } = RATE_BAND[band]
  const distressed = band === 'breach'

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* The headline: the one fact the aging distribution does not state on its
          own — the share of portfolio value past due, banded with a non-color
          cue. A distressed rate is announced as an alert. */}
      <header className="flex items-baseline justify-between gap-3">
        <SectionLabel as="span">{rateLabel}</SectionLabel>

        {hasRate ? (
          <span
            // A distressed rate is a credit alarm: announced the moment it
            // crosses the band, so assistive tech does not lean on the tint.
            role={distressed ? 'alert' : undefined}
            className={cn('inline-flex items-center gap-1.5', tint)}
          >
            <Icon aria-hidden className="size-4 shrink-0" />
            <span className="sr-only">{word}: </span>
            <Figure size="row" className={tint}>
              {formatPercent(rate, { unit: 'ratio', locale })}
            </Figure>
          </span>
        ) : (
          // Zero/indeterminate portfolio: an explicit empty readout, never a
          // "NaN%" artifact. Indeterminate (an unparseable total) reads the same
          // no-value placeholder as a zero portfolio — neither is a real rate.
          <span className="text-muted-foreground inline-flex items-center gap-1.5">
            <span
              className={cn(LABEL_VOICE_CLASS, 'tracking-normal normal-case')}
            >
              {indeterminate ? 'indeterminada' : 'sem carteira'}
            </span>
            <Figure size="row" className="text-muted-foreground">
              {NO_VALUE}
            </Figure>
          </span>
        )}
      </header>

      {/* The distribution: delegated whole to AgingBuckets — ordered current →
          90+, per-bucket count/total, ordinal band cue, money-math grand total. */}
      <AgingBuckets
        buckets={buckets}
        currency={currency}
        locale={locale}
        showTotal={showTotal}
      />
    </div>
  )
}
