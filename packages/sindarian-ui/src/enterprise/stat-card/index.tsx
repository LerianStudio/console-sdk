/**
 * StatCard — a single headline-figure cell of the console.
 *
 * A flush `bg-card` panel holding a recessive uppercase label, the dominant
 * mono figure, an optional delta line, an optional inline trend sparkline, and
 * optional secondary key/value rows.
 *
 *   <StatCard label="Match rate" value="98.4%" delta="+0.6 pts" tone="success" />
 *   <StatCard label="In flight" value="R$ 129,004" trend={series} trendKey="v" />
 *
 * The `tone` escalates the value + delta color to a semantic theme token.
 *
 * NOTE (sindarian-x port): the legacy StatCard composed LedgerPanel /
 * SectionLabel / Figure / Blotter / Sparkline. Those live in sindarian-ui's
 * `domain` and `charts` surfaces, which are owned by sibling lanes; the panel,
 * label, figure and key/value grammars are therefore inlined here (they are the
 * same class strings the domain lane ports) and the trend renders as a
 * dependency-free inline SVG rather than the recharts-backed Sparkline.
 */
import type { ReactNode } from 'react'

import { LABEL_VOICE_CLASS } from '@/lib/typography'
import { cn } from '@/lib/utils'

export type StatCardTone = 'default' | 'success' | 'warning' | 'destructive'

/** Value/delta color per tone. `default` keeps the high-contrast foreground;
 *  the rest escalate to a semantic theme token that tracks light/dark. */
const TONE_VALUE: Record<StatCardTone, string> = {
  default: 'text-foreground',
  success: 'text-system-success-text',
  warning: 'text-system-alert-text',
  destructive: 'text-destructive'
}

/** Trend stroke color per tone. Resolved through the `--color-*` wrappers (the
 *  raw `--chart-N` tokens are bare HSL triples, not usable colors). */
const TONE_TREND: Record<StatCardTone, string> = {
  default: 'var(--color-chart-1)',
  success: 'var(--color-system-success)',
  warning: 'var(--color-system-alert)',
  destructive: 'var(--color-destructive)'
}

/** The canonical hero figure class — mirrors the ledger `Figure size="hero"`. */
const HERO_FIGURE_CLASS =
  'font-mono text-4xl font-semibold tracking-tight tabular-nums lg:text-5xl'

export type StatCardRow = {
  label: ReactNode
  value: ReactNode
}

export type StatCardProps = {
  /** Recessive uppercase heading. */
  label: string
  /** The dominant headline value — rendered in the hero mono figure. */
  value: ReactNode
  /** Optional delta line below the value (e.g. `+0.6 pts`, `-3`). Inherits the tone color. */
  delta?: ReactNode
  /** Semantic escalation for the value + delta color. */
  tone?: StatCardTone
  /** Optional trend series for the inline sparkline. */
  trend?: ReadonlyArray<Record<string, string | number | null>>
  /** Key in each `trend` datum to plot. Defaults to `value`. */
  trendKey?: string
  /** Optional secondary key/value rows. */
  rows?: StatCardRow[]
  className?: string
}

const TREND_VIEWBOX_WIDTH = 100
const TREND_VIEWBOX_HEIGHT = 40

/**
 * Chrome-less inline trend: no axes, grid, legend or tooltip. Decorative by
 * construction (`aria-hidden`) — the figure above it carries the meaning.
 * Renders nothing when fewer than two points are plottable.
 */
function TrendSpark({
  data,
  dataKey,
  color
}: {
  data: ReadonlyArray<Record<string, string | number | null>>
  dataKey: string
  color: string
}) {
  const points = data
    .map((row) => Number(row[dataKey]))
    .filter((n) => Number.isFinite(n))

  if (points.length < 2) return null

  const min = Math.min(...points)
  const max = Math.max(...points)
  // A flat series has zero span; pin it to the vertical midline instead of
  // dividing by zero.
  const span = max - min
  const stepX = TREND_VIEWBOX_WIDTH / (points.length - 1)

  const coords = points.map((n, i) => {
    const x = i * stepX
    const y =
      span === 0
        ? TREND_VIEWBOX_HEIGHT / 2
        : TREND_VIEWBOX_HEIGHT - ((n - min) / span) * TREND_VIEWBOX_HEIGHT
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  return (
    <svg
      aria-hidden
      role="presentation"
      viewBox={`0 0 ${TREND_VIEWBOX_WIDTH} ${TREND_VIEWBOX_HEIGHT}`}
      preserveAspectRatio="none"
      className="h-10 w-full"
    >
      <polygon
        points={`0,${TREND_VIEWBOX_HEIGHT} ${coords.join(' ')} ${TREND_VIEWBOX_WIDTH},${TREND_VIEWBOX_HEIGHT}`}
        fill={color}
        fillOpacity={0.15}
      />
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.75}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function StatCard({
  label,
  value,
  delta,
  tone = 'default',
  trend,
  trendKey = 'value',
  rows,
  className
}: StatCardProps) {
  const hasTrend = trend !== undefined && trend.length > 0
  const hasRows = rows !== undefined && rows.length > 0

  return (
    <section
      data-tone={tone}
      className={cn('bg-card flex h-full flex-col gap-4 p-5', className)}
    >
      <h2 className={LABEL_VOICE_CLASS}>{label}</h2>

      <div className="space-y-1">
        <span className={cn(HERO_FIGURE_CLASS, 'block', TONE_VALUE[tone])}>
          {value}
        </span>
        {delta !== undefined ? (
          <p className={cn('font-mono text-xs tabular-nums', TONE_VALUE[tone])}>
            {delta}
          </p>
        ) : null}
      </div>

      {hasTrend ? (
        <TrendSpark data={trend} dataKey={trendKey} color={TONE_TREND[tone]} />
      ) : null}

      {hasRows ? (
        <dl className="divide-border mt-auto divide-y">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 px-2 py-2"
            >
              <dt className={LABEL_VOICE_CLASS}>{row.label}</dt>
              <dd className="font-mono text-sm font-medium tabular-nums">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  )
}
