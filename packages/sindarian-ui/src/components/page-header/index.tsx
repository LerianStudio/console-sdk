import { cn } from '@/lib/utils'
import { Children, createContext, ReactNode, useContext, useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { Button } from '../ui/button'
import { HelpCircle, ChevronUp, ExternalLink, Copy } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { Arrow } from '@radix-ui/react-tooltip'

const PageHeaderContext = createContext<{ isOpen: boolean }>({ isOpen: false })

export function PageHeaderActionButtons({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-header-action-buttons"
      className={cn('flex min-w-0 flex-wrap items-center gap-8', className)}
      {...props}
    />
  )
}

export function PageHeaderWrapper({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { isOpen } = useContext(PageHeaderContext)

  return (
    <div
      data-slot="page-header-wrapper"
      className={cn(
        'flex items-start justify-between',
        isOpen && 'border-b',
        className
      )}
      {...props}
    />
  )
}

type PageHeaderProps = {
  children: ReactNode
  /** Routed to the inner Collapsible, as it always has been. */
  className?: string
  /**
   * Seam for the root element's own margins. Merged AFTER the hard-coded
   * `mt-12`/`mb-12` so a consumer utility (e.g. `mt-0`) wins via tailwind-merge.
   */
  rootClassName?: string
}

export function PageHeader({
  children,
  className,
  rootClassName
}: PageHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <PageHeaderContext.Provider value={{ isOpen }}>
      <div
        data-slot="page-header"
        className={cn('mt-12', isOpen && 'mb-12', rootClassName)}
      >
        <Collapsible
          open={isOpen}
          onOpenChange={setIsOpen}
          className={className}
        >
          {children}
        </Collapsible>
      </div>
    </PageHeaderContext.Provider>
  )
}

export type PageHeaderInfoTitleProps = {
  title: string
  subtitle?: string
  subtitleCopyToClipboard?: boolean
  /** Routed to the heading, as it always has been. */
  className?: string
  /**
   * Heading level to render. Defaults to `h1`, which is correct: this IS the
   * page heading. Set it when the block is nested under an existing `h1` (a
   * wizard step, an embedded panel) so the document outline stays valid.
   */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  /**
   * Seam for the wrapper element's own margins. Merged AFTER the hard-coded
   * `mb-12` so a consumer utility (e.g. `mb-0`) wins via tailwind-merge.
   *
   * It is also the way back to the old shrink-to-zero title box:
   * `containerClassName="min-w-0"` simply lands, because the base string
   * declares no `min-w-*` for tailwind-merge to weigh it against. Pass it only
   * if a title box that a wide action slot can squeeze past its longest word
   * is what the surface actually wants.
   */
  containerClassName?: string
  /**
   * Rendered as their own row under the subtitle, wrapping, so a long identity
   * tape never competes with the subtitle for the same line. This is the slot
   * for things that IDENTIFY the record (short id, status, severity, counts),
   * not for controls: buttons belong in the header's action slot, where the
   * wrapper's `justify-between` keeps them right-aligned.
   */
  children?: ReactNode
}

export function PageHeaderInfoTitle({
  title,
  subtitle,
  className,
  containerClassName,
  children,
  as: Heading = 'h1'
}: PageHeaderInfoTitleProps) {
  return (
    <div
      data-slot="page-header-info-title"
      /*
        Two utilities and one deliberate absence.

        `flex-1` (basis 0) is #170: flex shrinking is shared in proportion to
        flex-basis, so a title box at basis auto (its max-content width, which
        a long subtitle inflates) absorbed almost none of the overflow and
        starved the action row into one button per line. At basis 0 the line's
        hypothetical size is the action row alone, so the row keeps its natural
        width and the title grows into what is left, wrapping at spaces.

        NO `min-w-0` is #174, and the absence is the fix. A flex item's
        automatic minimum size is its own min-content, so left alone the box
        cannot be squeezed below its longest word (of the title, the subtitle,
        or a child chip) and nothing can overflow horizontally at any width.
        beta.5 carried `min-w-0`, which waives that minimum: on Matcher's
        exception-detail masthead the box collapsed to 68px and the `h1`
        painted straight out of it and across the action row. That is gone.

        A fixed floor was the other candidate and is wrong: any `sm:` gate keys
        on the VIEWPORT while the overflow condition is the MASTHEAD width, so
        a 1024px viewport with a 320px side panel open (a ~332px masthead)
        would keep a 320px floor and scroll the body sideways.

        The measured trade: on a masthead carrying a 520px action row the title
        box shrinks to its longest word and the subtitle wraps to about three
        lines. The remedy there is fewer controls in the action slot, not a
        wider floor. A consumer that wants the collapse back passes
        `containerClassName="min-w-0"`. jsdom does not lay out, so the geometry
        is verified downstream.
      */
      className={cn('mb-12 flex flex-1 flex-col gap-4', containerClassName)}
    >
      <Heading
        className={cn('text-foreground text-4xl font-bold', className)}
        data-testid="title"
      >
        {title}
      </Heading>

      <div className="flex items-center gap-2">
        <p className="text-muted-foreground text-sm font-medium">{subtitle}</p>
      </div>

      {/* `Children.toArray`, not truthiness and not `Children.count`:
          `children={[]}` (a `.map()` over an empty list of chips) is truthy,
          and `count` counts `null`, `undefined` and booleans as nodes, so
          `children={[cond && <Chip />]}` with `cond` false measured as one
          child too. Either way an empty row rendered and still collected the
          parent's `gap-4` as a phantom gap under the subtitle. `toArray` drops
          those empty nodes, so the row exists only when something paints. */}
      {Children.toArray(children).length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  )
}

export type PageHeaderInfoTooltipProps = {
  subtitle: string
}

export function PageHeaderInfoTooltip({
  subtitle
}: PageHeaderInfoTooltipProps) {
  const { toast } = useToast()

  const handleCopyToClipboard = (value: string) => {
    navigator.clipboard.writeText(value)
    toast({
      description: 'Copied to clipboard!'
    })
  }

  return (
    <div data-slot="page-header-info-tooltip">
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger onClick={() => handleCopyToClipboard(subtitle)}>
            <Copy size={16} className="cursor-pointer" />
          </TooltipTrigger>

          <TooltipContent
            className="bg-shadcn-600 border-none"
            arrowPadding={0}
          >
            {/*
              shadcn-400 is correct HERE and must not be swapped for
              --muted-foreground: this surface is bg-shadcn-600 (#27272A), fixed
              dark in BOTH themes, so this is a deliberate light-on-dark pairing
              at 5.81:1 — the same one the base Tooltip primitive uses.
              --muted-foreground would read 1.93:1 against it in the light theme.
            */}
            <p className="text-shadcn-400 text-sm font-medium">{subtitle}</p>
            <p className="text-center text-white">Click to copy</p>
            <Arrow height={8} width={15} />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export type PageHeaderCollapsibleInfoTriggerProps = {
  question: string
}

export function PageHeaderCollapsibleInfoTrigger({
  question
}: PageHeaderCollapsibleInfoTriggerProps) {
  return (
    <div data-slot="page-header-collapsible-info-trigger">
      <CollapsibleTrigger asChild>
        <Button variant="link" className="flex gap-2 pr-0">
          <span className="text-foreground text-sm font-medium">
            {question}
          </span>
          <HelpCircle className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
    </div>
  )
}

export type PageHeaderCollapsibleInfoProps = {
  question?: string
  answer?: string
  seeMore?: string
  href?: string
}

export function PageHeaderCollapsibleInfo({
  question,
  answer,
  seeMore,
  href
}: PageHeaderCollapsibleInfoProps) {
  return (
    <div data-slot="page-header-collapsible-info">
      <CollapsibleContent>
        <div className="flex w-full justify-between pt-6">
          <div className="mt-12 flex grow flex-col gap-3 pr-6">
            {/*
              An h2, NOT an h1: this panel opens underneath the page title, so a
              second h1 gave one document two top-level headings. It stays a
              heading — the question titles a real region and heading navigation
              should reach it — at the level its position describes.
            */}
            <h2 className="text-foreground text-xl font-bold">{question}</h2>

            <p className="text-shadcn-500 text-sm leading-relaxed font-medium">
              {answer}
              {seeMore && href && (
                <>
                  {' '}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={href}
                    className="text-shadcn-600 dark:text-shadcn-400 font-medium"
                  >
                    <span className="underline underline-offset-4">
                      {seeMore}
                    </span>
                    <ExternalLink
                      size={16}
                      className="ml-1 inline align-middle"
                    />
                  </a>
                </>
              )}
            </p>
          </div>

          <CollapsibleTrigger asChild>
            <Button variant="link" className="cursor-pointer self-start">
              <ChevronUp size={24} className="text-shadcn-500" />
            </Button>
          </CollapsibleTrigger>
        </div>
      </CollapsibleContent>
    </div>
  )
}
