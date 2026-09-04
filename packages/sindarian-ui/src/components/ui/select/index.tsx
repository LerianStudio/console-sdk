'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'

import { cn } from '@/lib/utils'

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

/**
 * Radix strips `className` and `style` off its `Select.Value` before rendering
 * the span, so this slot cannot be styled directly — it is styled from the
 * trigger instead, see VALUE_OVERFLOW_CLASS.
 */
function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

type SelectTriggerProps = React.ComponentProps<
  typeof SelectPrimitive.Trigger
> & {
  readOnly?: boolean
}

/**
 * Truncate the selected value instead of letting it wrap out of the trigger.
 *
 * `.select-trigger` is a fixed-height `flex w-full items-center justify-between`
 * box, and a flex item never shrinks below its own min-content width: a long
 * value broke to a second line and overflowed the box. `min-w-0` lets the value
 * slot shrink, `truncate` ellipsises what no longer fits — the chevron keeps its
 * place because the value absorbs all the shrinkage.
 *
 * Written as a child-scoped variant on the TRIGGER because Radix strips
 * `className` off `Select.Value` itself; the `>` combinator holds because Radix
 * renders that span as the trigger's direct child.
 *
 * Truncation hides text, so a trigger showing a long value should also carry
 * `title` — on the trigger, never on the value slot, which Radix renders
 * `pointer-events: none`.
 */
const VALUE_OVERFLOW_CLASS =
  '[&>[data-slot=select-value]]:min-w-0 [&>[data-slot=select-value]]:truncate'

function SelectTrigger({
  className,
  readOnly,
  children,
  ...props
}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size="default"
      className={cn(
        'select-trigger select-read-only select-disabled',
        VALUE_OVERFLOW_CLASS,
        className
      )}
      aria-readonly={readOnly}
      data-read-only={readOnly ? '' : undefined}
      {...props}
    >
      {children}
      {!readOnly && (
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="select-chevron" />
        </SelectPrimitive.Icon>
      )}
    </SelectPrimitive.Trigger>
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn('select-scroll-button', className)}
      {...props}
    >
      <ChevronUp className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}
function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn('select-scroll-button', className)}
      {...props}
    >
      <ChevronDown className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  const options = React.useMemo(
    () =>
      React.Children.map(React.Children.toArray(children), (child) => {
        if (
          React.isValidElement<{ value: string }>(child) &&
          child.type === SelectItem
        ) {
          return child.props.value
        }
      }),
    [children]
  )

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        data-position={position}
        className={cn(
          'group/select select-content',
          position === 'popper' && 'select-content-popper',
          className
        )}
        data-empty={options.length === 0}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)'
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectEmpty({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      data-slot="select-empty"
      className={cn('select-empty', className)}
      {...props}
    />
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('select-label', className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn('select-item', className)}
      {...props}
    >
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('select-separator', className)}
      {...props}
    />
  )
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectEmpty,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton
}
