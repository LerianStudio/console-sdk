/**
 * ThresholdGauge — where a value sits across ordered, NAMED bands.
 *
 * A metric is rarely interesting in isolation; what matters is which band it has
 * crossed. A credit utilization of 95% is a breach; a liquidity coverage ratio
 * of 95% may be perfectly calm. So a gauge that paints a smooth red→green
 * gradient is lying by implication — it suggests a continuum where the business
 * has hard thresholds. This atom STATES the thresholds: it resolves the current
 * band (low / warn / breach), names it with a glyph + an sr-only word + a tint,
 * and marks the band edges on the bar so the reader sees the line the value
 * crossed, not a vibe.
 *
 *   <ThresholdGauge value={0.92} max={1} warn={0.8} breach={0.9} format="percent"
 *     direction="higher-is-worse" label="Utilização do limite" />   // breach
 *   <ThresholdGauge value={1.18} max={2} warn={1} breach={0.9} format="ratio"
 *     direction="lower-is-worse" label="Índice de cobertura" />      // low (calm)
 *
 * DIRECTION is mandatory because the same numbers mean opposite things:
 *  - higher-is-worse: the value climbs INTO danger (warn < breach). Utilization,
 *    concentration, error rate.
 *  - lower-is-worse: the value FALLS into danger (breach < warn). Coverage,
 *    liquidity, capital adequacy.
 *
 * INVARIANT (strict edges by DEFAULT): a band escalation requires the value to
 * be STRICTLY beyond the edge. A value sitting exactly ON a threshold belongs to
 * the calmer band, not the louder one — `gaugeBand` encodes this so an on-edge
 * utilization of exactly the breach line still reads as warn, never a surprise
 * breach. A consumer whose own enforcement is INCLUSIVE (a quota blocking at
 * `used >= limit`) opts out with `edges="inclusive"`, which escalates ON the
 * edge in both directions.
 *
 * The current band is the load-bearing signal and it never rides on color alone
 * (WCAG 1.4.1): a glyph leads, an sr-only word names it, the tint only
 * reinforces. The numeric position reads via a mono `Figure`, never inferred
 * from the bar geometry — and a consumer forced to clamp `value` to keep
 * `aria-valuenow` in range can still print the true figure via `displayValue`.
 *
 * Pure display: server-safe, no directive.
 */
import { OctagonX, ShieldCheck, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { LABEL_VOICE_CLASS } from '@/lib/typography'
import { cn } from '@/lib/utils'

import { Figure } from '../figure'
import { formatCount, formatPercent, NO_VALUE } from '../format'
import { MoneyText } from '../money-text'

export type GaugeBand = 'low' | 'warn' | 'breach'

/** higher-is-worse: value climbs into danger (warn < breach) — utilization.
 *  lower-is-worse: value falls into danger (breach < warn) — coverage ratio. */
export type GaugeDirection = 'higher-is-worse' | 'lower-is-worse'

/** How the numeric readout is formatted. 'ratio' is a 0..1 share shown as a
 *  percent; 'percent' is an already-scaled 0..100; 'count' a plain integer;
 *  'money' an ISO-4217 amount via MoneyText. */
export type GaugeFormat = 'percent' | 'ratio' | 'count' | 'money'

/** Whether a value sitting exactly ON a threshold escalates.
 *  'strict' (default) — it stays in the calmer band; escalation needs the value
 *  strictly past the edge. 'inclusive' — being ON the edge already escalates,
 *  for consumers whose enforcement is inclusive (a quota that blocks at
 *  `used >= limit`: a tenant exactly at the cap is already blocked). */
export type GaugeEdges = 'strict' | 'inclusive'

export interface GaugeThresholds {
  /** The warn edge — crossing it escalates low → warn. */
  warn: number
  /** The breach edge — crossing it escalates to breach. */
  breach: number
  /** Whether a value exactly ON a threshold escalates. Defaults to 'strict'. */
  edges?: GaugeEdges
}

export interface ThresholdGaugeProps {
  /** The observed value, in the same unit as `min`/`max`/`warn`/`breach`. It
   *  drives the band, the track fill and every ARIA attribute. */
  value: number
  /** The figure to PRINT, when it differs from `value`. A consumer that must
   *  keep `aria-valuenow` inside [min, max] has to clamp `value` — pass the true
   *  (unclamped) figure here so the readout does not contradict the number the
   *  consumer renders beside the gauge. Band and ARIA still follow `value`.
   *  Omitted → the readout formats `value`. */
  displayValue?: number
  /** Bottom of the track. Defaults to 0. */
  min?: number
  /** Top of the track. */
  max: number
  /** Warn edge (see `GaugeThresholds`). */
  warn: number
  /** Breach edge (see `GaugeThresholds`). */
  breach: number
  /** On-edge behaviour (see `GaugeEdges`). Defaults to 'strict'. */
  edges?: GaugeEdges
  /** Which way is danger — mandatory, the numbers alone do not say. */
  direction: GaugeDirection
  /** Numeric readout format. Defaults to 'percent'. */
  format?: GaugeFormat
  /** ISO 4217 code for `format='money'`, e.g. "BRL". */
  currency?: string
  /** BCP 47 locale for figure grouping/decimal marks. */
  locale?: string
  /** Quiet caption above the gauge (e.g. "Utilização do limite"). */
  label?: string
  /** Accessible name for the meter when no visible `label` is rendered, or when
   *  the meter needs a fuller name than the caption. A meter with no name is
   *  announced as a bare number, so this resolves `ariaLabel ?? label ?? the
   *  band word`, which is never empty. Additive — existing call sites that pass
   *  only `label` are unaffected. */
  ariaLabel?: string
  /** Override the accessible band word, per band, in the consumer's own locale.
   *  Shallow-merged over the pt-BR defaults, so `{ breach: 'Limit exceeded' }`
   *  leaves low/warn untouched. The band word is the ONLY non-chromatic carrier
   *  of the band (the glyph and the tint are decorative), so a consumer serving
   *  en/es MUST be able to translate it — see WCAG 1.4.1 note above. */
  bandLabels?: Partial<Record<GaugeBand, string>>
  className?: string
}

/** Band → glyph + tint + accessible word. The glyph and sr-only word are the
 *  load-bearing cue; the tint only reinforces, so the band survives grayscale
 *  and color-vision deficiency. The words are pt-BR defaults — a consumer in
 *  another locale overrides them via the `bandLabels` prop. */
const BAND: Record<
  GaugeBand,
  { Icon: LucideIcon; tint: string; word: string }
> = {
  low: {
    Icon: ShieldCheck,
    tint: 'text-system-success',
    word: 'Dentro do limite'
  },
  warn: {
    Icon: TriangleAlert,
    tint: 'text-system-alert',
    word: 'Próximo do limite'
  },
  breach: {
    Icon: OctagonX,
    tint: 'text-destructive',
    word: 'Limite ultrapassado'
  }
}

/** Track fill tint per band — kept distinct from the glyph tint so the bar can
 *  use the softer wash while the glyph carries the full tint. */
const BAND_FILL: Record<GaugeBand, string> = {
  low: 'bg-system-success',
  warn: 'bg-system-alert',
  breach: 'bg-destructive'
}

/**
 * Resolve which band a value occupies. Pure — the testable heart of the atom.
 *
 * STRICT edges by default: a value exactly ON a threshold stays in the CALMER
 * band; escalation needs the value strictly past.
 *
 *  - higher-is-worse: `value > breach` → breach; `value > warn` → warn; else low.
 *  - lower-is-worse:  `value < breach` → breach; `value < warn` → warn; else low.
 *
 * `thresholds.edges = 'inclusive'` opts into `>=` / `<=` instead, for a consumer
 * whose enforcement is inclusive. Omitted or 'strict' → the behaviour above.
 *
 * Non-finite input degrades to 'low' rather than throwing — a missing reading is
 * not, by itself, an alarm.
 */
export function gaugeBand(
  value: number,
  thresholds: GaugeThresholds,
  direction: GaugeDirection
): GaugeBand {
  if (!Number.isFinite(value)) return 'low'
  const { warn, breach, edges = 'strict' } = thresholds
  const beyond =
    direction === 'higher-is-worse'
      ? (edge: number) => (edges === 'inclusive' ? value >= edge : value > edge)
      : (edge: number) => (edges === 'inclusive' ? value <= edge : value < edge)
  if (beyond(breach)) return 'breach'
  if (beyond(warn)) return 'warn'
  return 'low'
}

/** Clamp a value into [min, max] then normalize to a 0..1 fraction of the
 *  track. A zero-width track (max <= min) collapses to 0 rather than dividing by
 *  zero. */
function trackFraction(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || max <= min) return 0
  const clamped = Math.max(min, Math.min(max, value))
  return (clamped - min) / (max - min)
}

/** Format the value for the mono readout per `format`. Money routes through
 *  MoneyText (never a hand-rolled string); the rest through the format helpers. */
function readout(
  value: number,
  format: GaugeFormat,
  currency: string | undefined,
  locale: string | undefined
) {
  if (!Number.isFinite(value)) return NO_VALUE
  if (format === 'money') {
    return (
      <MoneyText
        amount={value}
        currency={currency}
        signColor={false}
        locale={locale}
      />
    )
  }
  if (format === 'percent')
    return formatPercent(value, { unit: 'percent', locale })
  if (format === 'ratio') return formatPercent(value, { unit: 'ratio', locale })
  return formatCount(value, locale)
}

export function ThresholdGauge({
  value,
  displayValue,
  min = 0,
  max,
  warn,
  breach,
  edges,
  direction,
  format = 'percent',
  currency,
  locale,
  label,
  ariaLabel,
  bandLabels,
  className
}: ThresholdGaugeProps) {
  const band = gaugeBand(value, { warn, breach, edges }, direction)
  const { Icon, tint } = BAND[band]
  // The sr-only word is the band's only non-chromatic cue, so it is also the
  // string a trilingual consumer has to translate. pt-BR default, override wins.
  const word = bandLabels?.[band] ?? BAND[band].word
  // A `role="meter"` with no accessible name is announced as a naked number.
  // The band word is always present and always meaningful, so the meter is named
  // even when a consumer renders the gauge without a visible caption.
  const meterName = ariaLabel ?? label ?? word

  const valuePct = trackFraction(value, min, max) * 100
  const warnPct = trackFraction(warn, min, max) * 100
  const breachPct = trackFraction(breach, min, max) * 100

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Header: quiet label on the left, the named band on the right. The
          band is the headline — glyph + word + figure, color-independent. */}
      <div className="flex items-baseline justify-between gap-3">
        {label != null ? (
          <span className={LABEL_VOICE_CLASS}>{label}</span>
        ) : (
          <span />
        )}
        <span className={cn('inline-flex items-center gap-1.5', tint)}>
          <Icon aria-hidden className="size-4 shrink-0" />
          <span className="sr-only">{word}: </span>
          <Figure size="row" className={tint}>
            {/* The printed figure may be the unclamped truth; the band, the
                track and the ARIA below all stay on `value`. */}
            {readout(displayValue ?? value, format, currency, locale)}
          </Figure>
        </span>
      </div>

      {/* The track: a hairline-bordered bar (no card) with edge ticks at the
          warn and breach thresholds, and a fill up to the value. The fill tint
          reinforces the resolved band; the ticks STATE the thresholds so the
          reader sees the line the value crossed, not an implied gradient. */}
      <div
        role="meter"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={meterName}
        className="border-border bg-muted relative h-2 w-full overflow-hidden rounded-full border"
      >
        <div
          aria-hidden
          className={cn(
            'absolute inset-y-0 left-0 rounded-full',
            BAND_FILL[band]
          )}
          style={{ width: `${valuePct}%` }}
        />
        {/* Threshold ticks: a full-height seam at each band edge. */}
        <span
          aria-hidden
          className="bg-system-alert absolute inset-y-0 w-px"
          style={{ left: `${warnPct}%` }}
        />
        <span
          aria-hidden
          className="bg-destructive absolute inset-y-0 w-px"
          style={{ left: `${breachPct}%` }}
        />
      </div>
    </div>
  )
}
