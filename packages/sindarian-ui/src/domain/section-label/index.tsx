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

/** The entry-section head treatment: a hairline double rule under the label.
 *  `border-border`, NOT the register head's ink — this is the quieter of the two
 *  head rules. Pinned here because ~20 call sites were restating it. */
const RULED_CLASS = 'border-b-[3px] border-double border-border pb-2'

export type SectionLabelProps = {
  children: ReactNode
  className?: string
  /** Render element. Defaults to `h2` (the ledger-sheet cell heading). */
  as?: ElementType
  /**
   * Rule the label as an entry-section head (hairline double border, `pb-2`)
   * and stamp `data-variant="ruled"`. Mirrors `EmptyState.ruled`. Default off,
   * so an unruled label renders exactly as before.
   */
  ruled?: boolean
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'>

export function SectionLabel({
  children,
  className,
  as: Tag = 'h2',
  ruled = false,
  ...rest
}: SectionLabelProps) {
  // The remaining element props reach the rendered tag, so a panel can point
  // `aria-labelledby` at this heading via `id`, and tests can hang a `data-*`
  // hook off it. Without the spread there was no way to reference the heading
  // from its own container.
  return (
    <Tag
      data-variant={ruled ? 'ruled' : undefined}
      className={cn(SECTION_LABEL_CLASS, ruled && RULED_CLASS, className)}
      {...rest}
    >
      {children}
    </Tag>
  )
}
