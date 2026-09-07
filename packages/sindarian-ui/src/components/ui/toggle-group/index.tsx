'use client'

import * as React from 'react'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Item styling for the group. Kept local: sindarian-ui has no standalone
 * `Toggle` primitive and the retirement census does not ask for one, so the
 * variants live with their only consumer instead of leaking a new export.
 */
const toggleVariants = cva(
  "hover:bg-muted hover:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground dark:aria-invalid:ring-destructive/40 inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline:
          'border-input hover:bg-accent hover:text-accent-foreground border bg-transparent shadow-xs'
      },
      size: {
        default: 'h-9 min-w-9 px-2',
        sm: 'h-8 min-w-8 px-1.5',
        lg: 'h-10 min-w-10 px-2.5'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']

/**
 * Is an arrow key down right now?
 *
 * This is how an item tells keyboard navigation apart from a pointer press or a
 * programmatic focus, and it is the seam Radix uses for the same job in its own
 * `RadioGroup`. It works because `RovingFocusGroup` defers the focus move to a
 * `setTimeout`: the keydown has already bubbled to `document` and set the flag
 * by the time the item receives `focus`.
 *
 * The distinction is not cosmetic. A pointer press focuses BEFORE the click
 * lands, so selecting on every focus would turn one click into
 * select-then-deselect and break mouse selection outright.
 *
 * Returns null when disabled, so `type="multiple"` carries no flag to read.
 */
function useArrowKeyPressed(enabled: boolean) {
  const arrowKeyPressed = React.useRef(false)

  React.useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (ARROW_KEYS.includes(event.key)) arrowKeyPressed.current = true
    }
    const onKeyUp = () => {
      arrowKeyPressed.current = false
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onKeyUp)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onKeyUp)
      // A group unmounted mid-keystroke never sees the keyup.
      arrowKeyPressed.current = false
    }
  }, [enabled])

  return enabled ? arrowKeyPressed : null
}

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    arrowKeyPressed?: React.RefObject<boolean> | null
  }
>({
  size: 'default',
  variant: 'default',
  spacing: 0,
  arrowKeyPressed: null
})

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  children,
  style,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    spacing?: number
  }) {
  // Read, never destructured: `type` is the discriminant of the Radix props
  // union, and pulling it out then spreading it back widens the union so the
  // single/multiple props stop resolving.
  const arrowKeyPressed = useArrowKeyPressed(props.type === 'single')

  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      // Caller style first: `--gap` is ours and must survive, but everything
      // else the caller passes has to reach the element.
      style={{ ...style, '--gap': spacing } as React.CSSProperties}
      className={cn(
        // Legacy carried a `data-[spacing=default]:...:shadow-xs` rule here that
        // never matched — `data-spacing` is always a number. Removed rather than
        // activated, so the rendered pixels stay identical to sindarian-x.
        'group/toggle-group flex w-fit items-center gap-[--spacing(var(--gap))] rounded-md',
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider
        value={{ variant, size, spacing, arrowKeyPressed }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  onFocus,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  /**
   * Selection follows focus, which is what `role="radio"` promises.
   *
   * With `type="single"` Radix puts the group on the ARIA radio pattern: the
   * root is a `radiogroup`, each item a `radio` with `aria-checked`. Under that
   * pattern an arrow key both moves focus and checks the item it lands on.
   * Radix only moves focus, so a screen-reader operator used to arrow across
   * "radio, not checked, 2 of 3" with nothing ever selected.
   *
   * `type="multiple"` is a `toolbar` of `aria-pressed` buttons and keeps its
   * current behavior, where moving focus without pressing is correct: the flag
   * is null there.
   *
   * Clicking the element rather than writing the value keeps a single
   * activation path, so Radix's own toggle and any caller `onClick` both fire
   * exactly as they do for a real click.
   */
  const handleFocus = (event: React.FocusEvent<HTMLButtonElement>) => {
    onFocus?.(event)

    if (context.arrowKeyPressed?.current) {
      event.currentTarget.click()
    }
  }

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size
        }),
        'w-auto min-w-0 shrink-0 px-3 focus:z-10 focus-visible:z-10',
        'data-[spacing=0]:rounded-none data-[spacing=0]:shadow-none data-[spacing=0]:first:rounded-l-md data-[spacing=0]:last:rounded-r-md data-[spacing=0]:data-[variant=outline]:border-l-0 data-[spacing=0]:data-[variant=outline]:first:border-l',
        className
      )}
      {...props}
      onFocus={handleFocus}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
