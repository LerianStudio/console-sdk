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
import type { GaugeBand } from '../threshold-gauge'
import { AgingBuckets } from './aging-buckets'
import type { AgingBucket, AgingBucketsLabels } from './aging-buckets'

// `bucketLabels` is part of this component's public shape, so the type a caller
// needs to name it travels with it — even though AgingBuckets itself stays
// internal to the composite.
export type { AgingBand, AgingBucketsLabels } from './aging-buckets'

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

/** Fixed-point scale for comparing the ratio against a float threshold as exact
 *  integers. 1e18 is well past the ~1e-16 relative precision a double carries,
 *  so the comparison is exact to the limit of the threshold value itself. */
const THRESHOLD_SCALE = 10n ** 18n

/**
 * THIRD RAIL: `overdue / total > threshold`, decided on EXACT integers.
 *
 * The float `rate` is a TRUNCATED view of the ratio — RATE_PRECISION drops every
 * digit past 1e-12 — so a rate a hair ABOVE a threshold rounds down onto it, and
 * the strict-edge rule then reads it as the calmer band. 500000000001 /
 * 10000000000000 is 0.0500000000001, genuinely past a 0.05 warn edge, and
 * truncates to exactly 0.05, which reported "Saudável" on a portfolio that had
 * crossed into "Elevada". Cross-multiplying keeps the comparison in integers,
 * where no digit is dropped.
 */
function ratioExceeds(
  overdue: bigint,
  total: bigint,
  threshold: number
): boolean {
  // A non-finite threshold is no threshold: nothing can be past it.
  if (!Number.isFinite(threshold)) return false
  // Scaling overflows to ±Infinity for a threshold that is finite but huge —
  // 1e300 is enough, MAX_VALUE certainly — and `BigInt(Infinity)` throws a
  // RangeError, mid-render, taking the surface down. Both overflow directions
  // have an EXACT answer, so this degrades to the right result rather than a
  // merely safe one: an overflowed positive threshold is one no 0..1 ratio could
  // ever reach (not exceeded), an overflowed negative one sits below every ratio
  // (always exceeded).
  const scaled = Math.round(threshold * Number(THRESHOLD_SCALE))
  if (!Number.isFinite(scaled)) return scaled < 0

  let scaledInt = BigInt(scaled)
  // A threshold FINER than one unit of the scale rounds to zero, and a zero
  // threshold means "anything above zero is past it" — the exact opposite of what
  // a tiny positive threshold asks for. 4e-19 scaled to 0, so a ratio of 1e-19
  // was reported as exceeding it. Clamp to one unit instead, keeping the sign, so
  // a sub-scale threshold behaves as the finest one this comparison supports.
  //
  // ponytail: the floor is 1e-18 (THRESHOLD_SCALE), so a threshold between 0 and
  // 1e-18 is treated as 1e-18 and a ratio in that sliver reads calmer than the
  // literal number asks. Immaterial for a delinquency ratio — a portfolio would
  // need ~1e18 currency units for one minor unit to land there — and the honest
  // alternative is exact rational threshold conversion, which buys nothing real.
  // An EXACT zero is left alone: every positive ratio does exceed it.
  if (scaledInt === 0n && threshold !== 0) {
    scaledInt = threshold < 0 ? -1n : 1n
  }
  return overdue * THRESHOLD_SCALE > scaledInt * total
}

/**
 * The rate band, resolved from the exact minor-unit ratio. Mirrors `gaugeBand`'s
 * higher-is-worse STRICT-edge canon (a ratio exactly ON a threshold stays in the
 * calmer band) rather than calling it: `gaugeBand` takes a float, and handing it
 * the truncated rate is precisely the defect above.
 */
function exactBand(
  overdue: bigint,
  total: bigint,
  warn: number,
  breach: number
): GaugeBand {
  if (ratioExceeds(overdue, total, breach)) return 'breach'
  if (ratioExceeds(overdue, total, warn)) return 'warn'
  return 'low'
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
  /** sr-only rate band word per band ("Saudável" / "Elevada" / "Em estresse").
   *  Merged shallowly; an unlisted band keeps its pt-BR default. This is the
   *  ACCESSIBLE band cue, so it has to be translatable — `locale` only reaches
   *  the digits. */
  rateBandLabels?: Partial<Record<GaugeBand, string>>
  /** Readout when the portfolio is empty. Defaults to "sem carteira". */
  emptyLabel?: string
  /** Readout when the rate cannot be determined. Defaults to "indeterminada". */
  indeterminateLabel?: string
  /** Override the fixed pt-BR copy of the distribution below (band words, the
   *  count/money captions, the grand-total row). Omitted fields keep their
   *  defaults. */
  bucketLabels?: AgingBucketsLabels
  /** Warn edge for the rate band (0..1 ratio). Crossing it strictly → elevated.
   *  Compared against the EXACT minor-unit ratio, with a resolution floor of
   *  1e-18: a magnitude finer than that is treated as 1e-18, and a non-finite
   *  value is treated as no threshold at all. */
  warn?: number
  /** Breach edge for the rate band (0..1 ratio). Crossing it strictly → distressed.
   *  Same 1e-18 resolution floor and non-finite handling as `warn`. */
  breach?: number
  /** Render the money-math-exact grand total row under the distribution. */
  showTotal?: boolean
  /**
   * Tint of the healthy band — the low delinquency rate AND the `current`
   * aging bucket. `'success'` (default) is the ambient green; `'ink'` retones
   * both to `text-foreground`, which is the Ledger canon for a healthy-but-
   * nonzero book: green reads as "achievement", and a book merely not in
   * arrears has achieved nothing. Scoped to the healthy band only — elevated,
   * distressed and overdue keep their alert and credit-red tints, since the
   * glyph + sr-only word (not the tint) are the load-bearing cue either way.
   */
  healthyTone?: 'success' | 'ink'
  className?: string
}

export function DelinquencyAging({
  buckets,
  currency,
  locale,
  rateLabel = 'Inadimplência',
  rateBandLabels,
  emptyLabel = 'sem carteira',
  indeterminateLabel = 'indeterminada',
  bucketLabels,
  warn = 0.05,
  breach = 0.1,
  showTotal = false,
  healthyTone = 'success',
  className
}: DelinquencyAgingProps) {
  // THIRD RAIL: the rate scale and the two totals come from money-math, never
  // float. The division below is of two exact BigInt-derived integers.
  const scale = currency ? minorDigitsOf(currency) : 2
  const { rate, overdueMinor, totalMinor, indeterminate } = delinquencyRate(
    buckets,
    scale
  )

  // The band is only meaningful when there is a rate; an empty/indeterminate
  // portfolio has no band to name (rendered as the explicit no-value readout).
  const hasRate = rate !== null
  // higher-is-worse: more value past due is worse. The band comes off the EXACT
  // minor-unit ratio, never `rate` — that float is truncated at 1e-12 and is for
  // DISPLAY only (one decimal place, where the truncation cannot show).
  const band: GaugeBand =
    hasRate && overdueMinor !== null && totalMinor !== null
      ? exactBand(overdueMinor, totalMinor, warn, breach)
      : 'low'
  const { Icon, word } = RATE_BAND[band]
  // `ink` retones ONLY the healthy band; `warn`/`breach` keep their alarm tints.
  const tint =
    healthyTone === 'ink' && band === 'low'
      ? 'text-foreground'
      : RATE_BAND[band].tint
  // Shallow merge: an unlisted band keeps its pt-BR default.
  const bandWord = rateBandLabels?.[band] ?? word
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
            <span className="sr-only">{bandWord}: </span>
            <Figure size="row" className={tint}>
              {formatPercent(rate, { unit: 'ratio', locale })}
            </Figure>
          </span>
        ) : (
          // Zero/indeterminate portfolio: an explicit empty readout, never a
          // "NaN%" artifact. Indeterminate (an unparseable total) reads the same
          // no-value placeholder as a zero portfolio — neither is a real rate.
          <span className="text-muted-foreground inline-flex items-center gap-1.5">
            <span className={LABEL_VOICE_CLASS}>
              {indeterminate ? indeterminateLabel : emptyLabel}
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
        labels={bucketLabels}
        healthyTone={healthyTone}
      />
    </div>
  )
}
