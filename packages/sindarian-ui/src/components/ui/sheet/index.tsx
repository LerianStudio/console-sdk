'use client'

import * as React from 'react'
import * as SheetPrimitive from '@radix-ui/react-dialog'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        'motion-safe:data-[state=open]:animate-in motion-safe:data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80',
        className
      )}
      {...props}
    />
  )
}

/**
 * ⛔ A PANEL BUILT FOR A DESKTOP HAS TO STOP BEING TWO FIFTHS ON A PHONE.
 *
 * `w-2/5` and `p-12` were unconditional. At a 390px viewport that is a 156px
 * panel with 59px of usable width, and a form field inside it measures 9px of
 * text — a sheet that cannot be read, let alone filled in. At 320px the panel
 * is 128px and the field has NOTHING: its own padding is wider than its box.
 * Thirteen product-console routes opened a sheet that looked like that, which
 * is why that console has carried a rule against `[data-slot='sheet-content']`
 * since its M10 lane; this is that rule brought home, and the console can drop
 * its copy.
 *
 * ⚠️ THE PHONE VALUES CARRY THE MODIFIER, THE DESKTOP ONES DO NOT, AND THAT
 * ASYMMETRY IS THE WHOLE MECHANISM. `cn` resolves these through tailwind-merge
 * before the cascade sees them, and tailwind-merge only drops a conflicting
 * class carrying the SAME modifiers. So a caller's `w-[594px]` replaces
 * `w-2/5` and leaves `max-sm:w-full` standing: the fifteen product-console
 * sheets that declare a pixel width of their own — and the two that declare
 * `w-full` — all still fill a phone, with no edit at the call site. Written
 * the other way round — `w-full sm:w-2/5` — the caller's bare `w-[594px]`
 * would have been overruled by `sm:w-2/5` at every desktop width instead,
 * which is the same bug pointing the other way.
 *
 * ⚠️ IT CUTS BOTH WAYS, AND THE PADDING IS WHERE THAT IS FELT. A caller's bare
 * `p-0` drops `p-12` and cannot reach `max-sm:px-4` either, so a panel that
 * asked for no padding gets 16px a side below 40rem. That is deliberate — it
 * is what makes the phone step reach the call sites that need it most — and it
 * is what product-console's own unlayered rule already did to those five
 * sheets, so nothing there moves. For any other consumer it is a behaviour
 * change from 2.0.0-beta.11, and the way out is one token.
 *
 * A call site that genuinely wants its own phone width or padding says so with
 * the modifier (`max-sm:w-[320px]`, `max-sm:p-0`), which is one token and
 * strictly more than the console's unlayered rule allowed anyone.
 *
 * 40rem rather than 768px, unlike `SidebarTrigger` next door: nothing here is
 * paired with a pixel media query in JavaScript. This is a reading-width
 * decision and it is the complement of `sm:`, so it moves with the reader's
 * font exactly as the rest of the package's responsive steps do. The one panel
 * that IS coupled to the pixel breakpoint is the navigation drawer, and
 * `SidebarRoot` opts it out by restating both tokens under `max-sm:`.
 */
const sheetVariants = cva(
  'fixed z-50 gap-4 bg-background p-12 max-sm:px-4 shadow-lg transition ease-in-out motion-safe:data-[state=open]:animate-in motion-safe:data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-2/5 max-sm:w-full border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        right:
          'inset-y-0 right-0 h-full w-2/5 max-sm:w-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right'
      }
    },
    defaultVariants: {
      side: 'right'
    }
  }
)

type SheetContentProps = React.ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetVariants>

function SheetContent({
  side = 'right',
  className,
  children,
  onInteractOutside,
  ...props
}: SheetContentProps) {
  const handleInteractOutside = React.useCallback(
    (event: CustomEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('[data-sonner-toaster]')) {
        event.preventDefault()
        return
      }
      onInteractOutside?.(
        event as Parameters<
          NonNullable<SheetContentProps['onInteractOutside']>
        >[0]
      )
    },
    [onInteractOutside]
  )

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          'flex max-h-screen flex-col overflow-x-auto px-8 pb-0',
          sheetVariants({ side }),
          className
        )}
        onInteractOutside={handleInteractOutside}
        {...props}
      >
        {children}
        {/* ⛔ THE RING IS NOT DECORATION. This carried `focus:outline-hidden`
            and nothing else, so it removed the user agent's focus indicator and
            replaced it with nothing: a reader tabbing through an open sheet
            could not see where they were (SC 2.4.7), and the kit ships no
            global focus-visible rule to supply one. The sidebar drawer put this
            control on the navigation path of every phone. Same idiom as
            `.button-base`, `Checkbox` and `Textarea`; no new colour. */}
        <SheetPrimitive.Close className="data-[state=open]:bg-secondary ring-offset-background focus-visible:ring-ring absolute top-7 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none">
          <X className="h-6 w-6" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        'mb-4 flex flex-col space-y-2 text-center sm:text-left',
        className
      )}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        'mt-auto flex flex-col-reverse justify-center pt-20 sm:flex-row sm:justify-end sm:space-x-2',
        className
      )}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        'text-muted-foreground mb-2 flex text-xl font-bold',
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn('text-muted-foreground text-sm font-medium', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription
}
