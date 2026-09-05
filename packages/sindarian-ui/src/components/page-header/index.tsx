import { cn } from '@/lib/utils'
import { createContext, ReactNode, useContext, useState } from 'react'
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
   */
  containerClassName?: string
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
      className={cn(
        'mb-12 flex min-w-0 flex-1 flex-col gap-4',
        containerClassName
      )}
    >
      <Heading
        className={cn('text-foreground text-4xl font-bold', className)}
        data-testid="title"
      >
        {title}
      </Heading>

      <div className="flex items-center gap-2">
        <p className="text-muted-foreground text-sm font-medium">{subtitle}</p>
        {children}
      </div>
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
