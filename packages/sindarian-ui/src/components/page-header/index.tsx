import { cn } from '@/lib/utils'
import { ReactNode, useState } from 'react'
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

export function PageHeaderActionButtons({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-header-action-buttons"
      className={cn('flex gap-8', className)}
      {...props}
    />
  )
}

export function PageHeaderWrapper({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-header-wrapper"
      className={cn('flex justify-between border-b', className)}
      {...props}
    />
  )
}

type PageHeaderProps = {
  children: ReactNode
  className?: string
}

export function PageHeader({ children, className }: PageHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div data-slot="page-header" className="mt-12">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
        {children}
      </Collapsible>
    </div>
  )
}

export type PageHeaderInfoTitleProps = {
  title: string
  subtitle?: string
  subtitleCopyToClipboard?: boolean
  className?: string
  children?: ReactNode
}

export function PageHeaderInfoTitle({
  title,
  subtitle,
  className,
  children
}: PageHeaderInfoTitleProps) {
  return (
    <div
      data-slot="page-header-info-title"
      className="mb-12 flex flex-col gap-4"
    >
      <h1
        className={cn('text-4xl font-bold text-[#3f3f46]', className)}
        data-testid="title"
      >
        {title}
      </h1>

      <div className="flex items-center gap-2">
        <p className="text-shadcn-400 text-sm font-medium">{subtitle}</p>
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
          <span className="text-sm font-medium text-[#3f3f46]">{question}</span>
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
        <div className="flex w-full justify-between">
          <div className="mt-12 flex flex-col gap-3">
            <h1 className="text-xl font-bold text-[#3f3f46]">{question}</h1>

            <div className="flex items-center gap-3">
              <p className="text-shadcn-500 text-sm leading-none font-medium">
                {answer}
              </p>

              <div className="flex items-center gap-1">
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href={href}
                  className="text-shadcn-600 justify-start text-sm font-medium underline underline-offset-4"
                >
                  {seeMore}
                </a>
                <ExternalLink size={16} />
              </div>
            </div>
          </div>

          <CollapsibleTrigger asChild>
            <Button variant="plain" className="cursor-pointer self-start">
              <ChevronUp size={24} className="text-shadcn-500" />
            </Button>
          </CollapsibleTrigger>
        </div>
      </CollapsibleContent>
    </div>
  )
}
