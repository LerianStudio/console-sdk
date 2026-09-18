import React from 'react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../ui/tooltip'
import { CircleHelp, Settings2 } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '../ui/collapsible'
import {
  CollapsibleContentProps,
  CollapsibleProps,
  CollapsibleTriggerProps
} from '@radix-ui/react-collapsible'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

function EntityBox({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="entity-box"
      className={cn(
        'shadow-entity-box bg-card mb-2 flex items-center justify-between rounded-lg p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * The open state, republished for the trigger.
 *
 * Radix keeps it in a context it does not export, and the trigger one element
 * down needs it to say what activating it will DO. Mirroring it here rather
 * than forcing every consumer to lift the state: all ten console call sites
 * render `<EntityBoxCollapsible>` uncontrolled.
 */
const EntityBoxCollapsibleContext = React.createContext(false)

function EntityBoxCollapsible({
  className,
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: CollapsibleProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen ?? false)

  return (
    <EntityBoxCollapsibleContext.Provider value={open ?? uncontrolled}>
      <Collapsible
        className={cn(
          'shadow-entity-box bg-card mb-2 flex flex-col rounded-lg',
          className
        )}
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={(next) => {
          setUncontrolled(next)
          onOpenChange?.(next)
        }}
        {...props}
      />
    </EntityBoxCollapsibleContext.Provider>
  )
}

export type EntityBoxCollapsibleTriggerProps = CollapsibleTriggerProps & {
  /** Accessible name while the box is closed. */
  expandLabel?: string
  /** Accessible name while the box is open. */
  collapseLabel?: string
}

/**
 * ⛔ THIS TRIGGER HAS NO TEXT NODE. It is a `Settings2` glyph inside a Button,
 * so without an `aria-label` a screen reader announced "button" and nothing
 * else (SC 4.1.2) — and this is the control that opens the filter panel on
 * every console list page.
 *
 * The name describes the ACTION and Radix's `aria-expanded` carries the state,
 * so the two halves do not repeat each other. English defaults because no
 * consumer passes a label today; a translated console overrides both.
 */
function EntityBoxCollapsibleTrigger({
  expandLabel = 'Expand',
  collapseLabel = 'Collapse',
  'aria-label': ariaLabel,
  ...props
}: EntityBoxCollapsibleTriggerProps) {
  const open = React.useContext(EntityBoxCollapsibleContext)

  return (
    <CollapsibleTrigger {...props} asChild>
      <Button
        variant="secondary"
        className="h-[34px] w-[34px] p-2"
        aria-label={ariaLabel ?? (open ? collapseLabel : expandLabel)}
      >
        <Settings2 size={16} aria-hidden />
      </Button>
    </CollapsibleTrigger>
  )
}

function EntityBoxCollapsibleContent({
  children,
  ...props
}: CollapsibleContentProps) {
  return (
    <CollapsibleContent {...props}>
      <Separator orientation="horizontal" />
      <div className="grid w-full grid-cols-3 p-6">{children}</div>
    </CollapsibleContent>
  )
}

export interface EntityBoxHeaderProps extends React.ComponentProps<'div'> {
  title: string
  subtitle?: string
  tooltip?: string
  tooltipWidth?: string | number
  /**
   * Heading element used for the title. Defaults to `h2`.
   *
   * An EntityBox is a content box UNDER the page's own heading — the page `h1`
   * belongs to `PageHeaderInfoTitle` — so `h1` here would give the page a
   * second top-level heading. Raise or lower the level to match the section
   * the box actually sits in.
   */
  as?: 'h1' | 'h2' | 'h3' | 'h4'
}

function EntityBoxHeaderTitle({
  title,
  subtitle,
  tooltip,
  tooltipWidth,
  className,
  as: Heading = 'h2',
  ...props
}: EntityBoxHeaderProps) {
  return (
    <div
      data-slot="entity-box-header"
      className={cn('flex flex-col items-start', className)}
      {...props}
    >
      <div className="flex items-center gap-[10px]">
        <Heading className="text-muted-foreground text-lg font-medium">
          {title}
        </Heading>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CircleHelp className="pointer text-muted-foreground h-5 w-5" />
              </TooltipTrigger>
              <TooltipContent
                side="right"
                style={
                  tooltipWidth
                    ? { width: tooltipWidth, maxWidth: tooltipWidth }
                    : undefined
                }
              >
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
    </div>
  )
}

function EntityBoxBanner({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="entity-box-banner"
      className={cn('grid grid-cols-3 p-6', className)}
      {...props}
    >
      {children}
    </div>
  )
}

function EntityBoxActions({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="entity-box-actions"
      className={cn(
        'col-start-3 flex flex-row items-center justify-end gap-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  EntityBox,
  EntityBoxCollapsible,
  EntityBoxCollapsibleTrigger,
  EntityBoxCollapsibleContent,
  EntityBoxHeaderTitle,
  EntityBoxBanner,
  EntityBoxActions
}
