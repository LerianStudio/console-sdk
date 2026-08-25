/**
 * AgingBuckets — an ordered, exhaustive bucketed distribution (the receivables
 * aging schedule: current / 1–30 / 31–60 / 61–90 / 90+), each bucket carrying a
 * count and a money total.
 *
 * INTERNAL to `DelinquencyAging`: not re-exported from `src/domain/index.ts`,
 * because the port census only lists the composite. It lives here as the
 * distribution half of that composite.
 *
 * INVARIANT: the buckets are ordered current → oldest and are exhaustive. The
 * ORDER carries the information — older money is worse money — so the ordinal
 * position and its label are the PRIMARY cue; the band glyph + sr-only word are
 * the accessible reinforcement (WCAG 1.4.1 — the escalation survives grayscale
 * and color-vision deficiency), and the color tint is reinforcement only, never
 * the sole carrier of severity. The caller supplies the order; the component
 * never reorders, because a sorted-by-amount view would destroy the one fact the
 * widget exists to show.
 *
 * THIRD RAIL (money): a zero bucket renders an explicit `0` — a zero in the 90+
 * bucket is information ("nothing slipped that far"), never an omission. When a
 * grand total is shown it is summed through `money-math` integer minor units
 * (BigInt, at the currency's CLDR scale) — never IEEE-754 — and rendered via
 * `MoneyText`. A single unparseable bucket total poisons the sum to NO_VALUE
 * rather than silently displaying a wrong number.
 *
 * Pure display: no directive, no interactivity, server-safe for RSC.
 */
import { AlertOctagon, AlertTriangle, CircleDot, Clock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { LABEL_VOICE_CLASS } from '@/lib/typography'
import { cn } from '@/lib/utils'

import { Figure } from '../figure'
import { formatCount, NO_VALUE } from '../format'
import { minorDigitsOf, minorToDecimal, sumMinor } from '../money-math'
import { MoneyText } from '../money-text'

export interface AgingBucket {
  /** Human label for the band, e.g. "A vencer", "31–60", "90+". */
  label: string
  /** Number of items in the band. A zero is shown explicitly, never omitted. */
  count: number
  /** Money total for the band. Pass a decimal STRING for lossless sums. */
  total: string | number
}

export interface AgingBucketsProps {
  /** Ordered current → oldest. Order carries meaning; not reordered internally. */
  buckets: AgingBucket[]
  /** ISO 4217 currency code, e.g. "BRL". Drives the minor-unit sum scale. */
  currency?: string
  /** BCP 47 locale for grouping/decimal marks. Defaults to the runtime locale. */
  locale?: string
  /** Render a money-math-exact grand total row across all buckets. */
  showTotal?: boolean
  className?: string
}

export type AgingBand = 'current' | 'recent' | 'aging' | 'overdue'

/** Band → glyph + tint + accessible word. The glyph (and the sr-only word) is
 *  the load-bearing severity cue; the tint only reinforces it, so the
 *  escalation survives grayscale and color-vision deficiency. */
const BAND: Record<
  AgingBand,
  { Icon: LucideIcon; tint: string; word: string }
> = {
  current: {
    Icon: CircleDot,
    tint: 'text-system-success',
    word: 'Em dia'
  },
  recent: {
    Icon: Clock,
    tint: 'text-muted-foreground',
    word: 'Vencido recentemente'
  },
  aging: {
    Icon: AlertTriangle,
    tint: 'text-system-alert',
    word: 'Em atraso'
  },
  overdue: { Icon: AlertOctagon, tint: 'text-credit', word: 'Vencido' }
}

/**
 * Resolve a bucket's severity band from its ORDINAL POSITION, not its amount —
 * the order is the information (older = worse). The first bucket is `current`;
 * the LAST bucket (the oldest, the 90+ tail) is always `overdue`; the middle
 * escalates `recent` → `aging` toward the tail. A single-bucket list reads as
 * `current` (there is no escalation to show). Pure: no React, unit-tested.
 */
export function bucketBand(index: number, count: number): AgingBand {
  if (count <= 1) return 'current'
  if (index === 0) return 'current'
  if (index === count - 1) return 'overdue'
  // Middle buckets: the second-oldest reads `aging`, the rest `recent`.
  return index === count - 2 ? 'aging' : 'recent'
}

/**
 * Sum the bucket totals through integer minor units (BigInt) at `scale`, then
 * render losslessly to a decimal string. Returns null if ANY bucket total is
 * unparseable (indeterminate) — the caller renders NO_VALUE rather than a wrong
 * grand total. Pure: the money-math third rail, unit-tested.
 */
export function sumBucketTotals(
  buckets: AgingBucket[],
  scale: number
): string | null {
  const total = sumMinor(
    buckets.map((b) => b.total),
    scale
  )
  return total === null ? null : minorToDecimal(total, scale)
}

export function AgingBuckets({
  buckets,
  currency,
  locale,
  showTotal = false,
  className
}: AgingBucketsProps) {
  const scale = currency ? minorDigitsOf(currency) : 2
  const grandTotal = showTotal ? sumBucketTotals(buckets, scale) : null

  return (
    <div className={cn('flex flex-col', className)}>
      <ul className="flex flex-col">
        {buckets.map((bucket, i) => {
          const band = bucketBand(i, buckets.length)
          const { Icon, tint, word } = BAND[band]

          return (
            // Stable key: the label is the natural band identity; the index
            // disambiguates the rare duplicate label.
            <li
              key={`${bucket.label}-${i}`}
              className="border-border flex items-center gap-3 border-b py-2.5 last:border-b-0"
            >
              {/* The band glyph leads the row; the sr-only word carries the
                  severity to assistive tech so it is never color-only. */}
              <Icon aria-hidden className={cn('size-4 shrink-0', tint)} />
              <span className="sr-only">{word}: </span>

              <span
                className={cn(
                  LABEL_VOICE_CLASS,
                  'text-foreground min-w-0 flex-1 tracking-normal normal-case'
                )}
              >
                {bucket.label}
              </span>

              <span className="flex shrink-0 flex-col items-end leading-none">
                <Figure size="row" className="text-foreground">
                  {formatCount(bucket.count, locale)}
                </Figure>
                <span className={cn(LABEL_VOICE_CLASS, 'mt-1')}>Itens</span>
              </span>

              <span className="flex w-32 shrink-0 flex-col items-end leading-none sm:w-40">
                <Figure
                  size="row"
                  className={cn(band === 'overdue' && 'text-credit')}
                >
                  <MoneyText
                    amount={bucket.total}
                    currency={currency}
                    locale={locale}
                    signColor={false}
                  />
                </Figure>
                <span className={cn(LABEL_VOICE_CLASS, 'mt-1')}>Total</span>
              </span>
            </li>
          )
        })}
      </ul>

      {showTotal ? (
        // Grand total: money-math-exact (BigInt minor units), set off by a
        // heavier seam. A heavier weight than the rows, never a card.
        <div className="border-border flex items-center gap-3 border-t-2 pt-2.5">
          <span aria-hidden className="size-4 shrink-0" />
          <span
            className={cn(LABEL_VOICE_CLASS, 'text-foreground min-w-0 flex-1')}
          >
            Total geral
          </span>
          <span className="w-32 shrink-0 text-right sm:w-40">
            {grandTotal === null ? (
              <Figure size="row" className="text-muted-foreground">
                {NO_VALUE}
              </Figure>
            ) : (
              <Figure size="row" className="text-foreground font-semibold">
                <MoneyText
                  amount={grandTotal}
                  currency={currency}
                  locale={locale}
                  signColor={false}
                />
              </Figure>
            )}
          </span>
        </div>
      ) : null}
    </div>
  )
}
