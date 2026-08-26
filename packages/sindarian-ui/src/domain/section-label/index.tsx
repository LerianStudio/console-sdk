/**
 * SectionLabel — THE canonical uppercase tracked sans label of the console.
 *
 * Every panel heading, section title, and caption is uppercase, tracked
 * (0.08em) muted-foreground — the recessive foil that lets the mono figures be
 * loud. The class itself lives in `@/lib/typography` (`SECTION_LABEL_CLASS`,
 * an alias of `LABEL_VOICE_CLASS`) and is NEVER re-stated here, so the voice
 * cannot drift between this component and the `ui/` layer that shares it.
 *
 * Renders an `<h2>` by default (the ledger-sheet cell heading), but `as` lets
 * it become a `<p>`/`<span>`/`<dt>` for captions and inline labels.
 */
import type { ElementType, HTMLAttributes, ReactNode } from 'react'

import { SECTION_LABEL_CLASS } from '@/lib/typography'
import { cn } from '@/lib/utils'

export type SectionLabelProps = {
  children: ReactNode
  className?: string
  /** Render element. Defaults to `h2` (the ledger-sheet cell heading). */
  as?: ElementType
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'>

export function SectionLabel({
  children,
  className,
  as: Tag = 'h2',
  ...rest
}: SectionLabelProps) {
  // The remaining element props reach the rendered tag, so a panel can point
  // `aria-labelledby` at this heading via `id`, and tests can hang a `data-*`
  // hook off it. Without the spread there was no way to reference the heading
  // from its own container.
  return (
    <Tag className={cn(SECTION_LABEL_CLASS, className)} {...rest}>
      {children}
    </Tag>
  )
}
