/**
 * Figure — the figure type scale of the enterprise console.
 *
 * All numbers are the hero: tabular and visually dominant, on the console's own
 * Inter — NOT a second typeface. `tabular-nums` (Inter's `tnum`) is what keeps
 * digits column-aligned, so the mono lock the scale used to carry bought
 * nothing the console needed. This file is the single source of truth for the
 * canonical figure sizes so screens stop re-typing `tabular-nums` strings and
 * drifting on size/weight/tracking. Use `<Figure size>` for new markup, or
 * import the `FIGURE_CLASS` constants when composing className strings inline.
 *
 * Scale:
 *  - hero       : the dominant in-bar figure — text-4xl/5xl, semibold, tracking-tight
 *  - money-hero : hero-role MONEY figure     — text-2xl/3xl, semibold, tracking-tight
 *  - panel      : compliance / exposure      — text-3xl, semibold, tracking-tight
 *  - count      : ledger count               — text-2xl, semibold, tracking-tight
 *  - row        : inline / row figure        — text-sm
 *  - tick       : ruler / micro figure       — text-[10px], leading-none
 *
 * `money-hero` is `hero`'s role at one step down the scale: a formatted BRL
 * amount runs ~13 characters, which clips a three-column panel at 4xl/5xl, so
 * consoles were hand-rolling `text-2xl lg:text-3xl` at the call site and losing
 * the tabular/weight invariants along the way. Same responsive shape as
 * `hero`, same weight and tracking — only the two size steps differ.
 */
import type { ElementType, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type FigureSize =
  'hero' | 'money-hero' | 'panel' | 'count' | 'row' | 'tick'

/** Canonical class strings per figure size. The `tabular-nums` invariant lives
 *  here so it can never be forgotten at a call site. */
export const FIGURE_CLASS: Record<FigureSize, string> = {
  hero: 'text-4xl font-semibold tracking-tight tabular-nums lg:text-5xl',
  'money-hero':
    'text-2xl font-semibold tracking-tight tabular-nums lg:text-3xl',
  panel: 'text-3xl font-semibold tracking-tight tabular-nums',
  count: 'text-2xl font-semibold tracking-tight tabular-nums',
  row: 'text-sm tabular-nums',
  tick: 'text-xs leading-none tabular-nums'
}

export type FigureProps = {
  size: FigureSize
  children: ReactNode
  className?: string
  /** Render element. Defaults to `span` so figures nest inside `dd`/`p`/etc. */
  as?: ElementType
}

export function Figure({
  size,
  children,
  className,
  as: Tag = 'span'
}: FigureProps) {
  return <Tag className={cn(FIGURE_CLASS[size], className)}>{children}</Tag>
}
