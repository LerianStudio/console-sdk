/**
 * StatusRail — Row 0 of every console screen. A thin, full-width recessed strip
 * that reads "the terminal is live": a dot-separated mono tape on the recessed
 * page surface (`bg-body-surface`), with optional right-pinned count chips.
 *
 *   <StatusRail
 *     lead={contextName}
 *     items={[
 *       { value: '90d' },
 *       { label: 'Updated', value: '12:04 UTC' },
 *       { value: <><LivePulse /> Live</> }
 *     ]}
 *     chips={[
 *       { label: 'Open', value: '12' },
 *       { label: 'Pending overdue', value: '3', alarm: true }
 *     ]}
 *   />
 *
 * The first token (`lead`) is `text-foreground font-medium`. Tape items are
 * dot-separated; an item with a `label` renders the uppercase label inline
 * before its value. Chips pin right via `ml-auto`; `alarm` escalates a chip to
 * destructive.
 */
import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type StatusRailItem = {
  /** Optional stable key for dynamic (reordered/filtered) rails; falls back to index. */
  id?: string
  /** Optional uppercase label rendered inline before the value. */
  label?: ReactNode
  value: ReactNode
}

export type StatusRailChip = {
  /** Optional stable key for dynamic (reordered/filtered) rails; falls back to index. */
  id?: string
  label: ReactNode
  value: ReactNode
  /** Escalate the chip to destructive styling when a count is in alarm. */
  alarm?: boolean
}

export type StatusRailProps = {
  /** Foreground identity token, rendered first (e.g. context name). */
  lead?: ReactNode
  /** Dot-separated mono tape items. */
  items?: StatusRailItem[]
  /** Right-pinned count chips. */
  chips?: StatusRailChip[]
  className?: string
}

export function StatusRail({
  lead,
  items = [],
  chips = [],
  className
}: StatusRailProps) {
  return (
    <div
      className={cn(
        // Recessed instrument strip: the page surface inside a hairline border
        // whose top edge runs one step darker — light-from-above recession
        // without any inner shadow.
        'border-border border-t-foreground/10 bg-body-surface text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border px-4 py-2 font-mono text-xs tabular-nums',
        className
      )}
    >
      {lead !== undefined && lead !== null ? (
        <span className="text-foreground font-medium">{lead}</span>
      ) : null}

      {items.map((item, i) => (
        <RailFragment key={item.id ?? i} hasLead={lead != null || i > 0}>
          {item.label != null ? (
            <span className="flex items-center gap-1.5">
              <span className="tracking-[0.08em] uppercase">{item.label}</span>
              {item.value}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">{item.value}</span>
          )}
        </RailFragment>
      ))}

      {chips.length ? (
        <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {chips.map((chip, i) => (
            <span
              key={chip.id ?? i}
              className="inline-flex items-center gap-1.5"
            >
              <span className="tracking-[0.08em] uppercase">{chip.label}</span>
              <span
                className={cn(
                  // Tiny mono token: raised a hair off the sunken tape by the
                  // card surface + whisper shadow.
                  'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 shadow-sm',
                  chip.alarm
                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                    : 'border-border bg-card text-foreground'
                )}
              >
                {chip.alarm ? (
                  // WCAG 1.4.1: pair the destructive tint with a non-color cue
                  // (icon + screen-reader-only marker) so the alarm state isn't
                  // conveyed by color alone.
                  <>
                    <TriangleAlert aria-hidden className="size-3" />
                    <span className="sr-only">(alarme)</span>
                  </>
                ) : null}
                {chip.value}
              </span>
            </span>
          ))}
        </span>
      ) : null}
    </div>
  )
}

/** A tape item preceded by a separator dot when it is not the first token. */
function RailFragment({
  children,
  hasLead
}: {
  children: ReactNode
  hasLead: boolean
}) {
  return (
    <>
      {hasLead ? <Dot /> : null}
      {children}
    </>
  )
}

/** Decorative dot separator — muted, so the tape reads as punctuated, not broken. */
export function Dot() {
  return (
    <span aria-hidden className="text-muted-foreground/50">
      ·
    </span>
  )
}

/**
 * The live auto-refresh pulse: a success dot with a reduced-motion-gated ping
 * ring. Place it inside a tape item value, e.g. `<><LivePulse /> Live</>`.
 *
 * The ring rides Tailwind's built-in `ping` keyframe under the `motion-safe:`
 * variant (`@media (prefers-reduced-motion: no-preference)`), so a
 * reduced-motion reader sees only the static dot — same gating as the
 * hand-rolled `status-rail-pulse` keyframe it replaces, with no stylesheet of
 * its own.
 */
export function LivePulse() {
  return (
    <span className="relative flex size-2" aria-hidden>
      <span className="bg-system-success/60 absolute inline-flex size-2 rounded-full motion-safe:animate-ping" />
      <span className="bg-system-success relative inline-flex size-2 rounded-full" />
    </span>
  )
}
