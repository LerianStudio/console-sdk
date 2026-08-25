/**
 * Figure — the locked mono figure type scale of the enterprise console.
 *
 * All numbers are the hero: mono, tabular, visually dominant. This file is the
 * single source of truth for the canonical figure sizes so screens stop
 * re-typing `font-mono … tabular-nums` strings and drifting on
 * size/weight/tracking. Use `<Figure size>` for new markup, or import the
 * `FIGURE_CLASS` constants when composing className strings inline.
 *
 * Scale:
 *  - hero  : the dominant in-bar figure   — text-4xl/5xl, semibold, tracking-tight
 *  - panel : compliance / exposure        — text-3xl, semibold, tracking-tight
 *  - count : ledger count                 — text-2xl, semibold, tracking-tight
 *  - row   : inline / row figure          — text-sm
 *  - tick  : ruler / micro figure         — text-[10px], leading-none
 */
import type { ElementType, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type FigureSize = 'hero' | 'panel' | 'count' | 'row' | 'tick'

/** Canonical class strings per figure size. The `tabular-nums` and `font-mono`
 *  invariants live here so they can never be forgotten at a call site. */
export const FIGURE_CLASS: Record<FigureSize, string> = {
  hero: 'font-mono text-4xl font-semibold tracking-tight tabular-nums lg:text-5xl',
  panel: 'font-mono text-3xl font-semibold tracking-tight tabular-nums',
  count: 'font-mono text-2xl font-semibold tracking-tight tabular-nums',
  row: 'font-mono text-sm tabular-nums',
  tick: 'font-mono text-[10px] leading-none tabular-nums'
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
