/**
 * StatCard — a single headline-figure cell of the console.
 *
 * A `LedgerPanel` holding a recessive `SectionLabel`, the dominant
 * `Figure`, an optional delta line, an optional inline trend, and optional
 * secondary `BlotterRow` key/value rows. Drop StatCards into a `LedgerSheet` so
 * they read as connected hairline-seamed panels rather than floating cards.
 *
 *   <StatCard label="Match rate" value="98.4%" delta="+0.6 pts" tone="success" />
 *   <StatCard label="In flight" value="R$ 129,004" trend={series} trendKey="v" />
 *
 * The `tone` escalates the value + delta color to a semantic theme token.
 *
 * NOTE (sindarian-x port): the legacy StatCard drew its trend with the
 * recharts-backed Sparkline. That component is outside the port census, so the
 * trend here is a dependency-free inline SVG; everything else composes the same
 * ledger grammar the legacy card did.
 */
import type { ReactNode } from 'react'

import { Blotter, BlotterRow } from '@/domain/blotter'
import { Figure } from '@/domain/figure'
import { LedgerPanel } from '@/domain/ledger-sheet'
import { SectionLabel } from '@/domain/section-label'
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

export type StatCardRow = {
  label: ReactNode
  value: ReactNode
}

export type StatCardProps = {
  /** Recessive heading, rendered through `SectionLabel`'s quiet label voice. */
  label: string
  /** The dominant headline value — rendered in the hero figure. */
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
  // Drop absent samples BEFORE coercing: Number(null) and Number('') are both
  // 0, which would draw a phantom dip to the floor where the series simply has
  // no reading.
  const points: number[] = []
  for (const row of data) {
    const raw = row[dataKey]
    if (raw === null || raw === undefined || raw === '') continue
    const n = Number(raw)
    if (Number.isFinite(n)) points.push(n)
  }

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
    <LedgerPanel data-tone={tone} className={className}>
      <SectionLabel>{label}</SectionLabel>

      <div className="space-y-1">
        <Figure size="hero" className={cn('block', TONE_VALUE[tone])}>
          {value}
        </Figure>
        {delta !== undefined ? (
          <p className={cn('text-xs tabular-nums', TONE_VALUE[tone])}>
            {delta}
          </p>
        ) : null}
      </div>

      {hasTrend ? (
        <TrendSpark data={trend} dataKey={trendKey} color={TONE_TREND[tone]} />
      ) : null}

      {hasRows ? (
        <Blotter className="mt-auto">
          {rows.map((row, i) => (
            <BlotterRow key={i} label={row.label} value={row.value} />
          ))}
        </Blotter>
      ) : null}
    </LedgerPanel>
  )
}
