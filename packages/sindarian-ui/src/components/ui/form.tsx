'use client'

import * as React from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { Slot } from '@radix-ui/react-slot'
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext
} from 'react-hook-form'

import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'

import { TooltipProviderProps } from '@radix-ui/react-tooltip'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from './tooltip'
import { HelpCircle } from 'lucide-react'

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  // `useFormContext()` is null outside a `<Form>` provider, and destructuring it
  // threw — which is what made every Form primitive, and so every *Field built
  // on them, unusable in a plain `useState` filter bar. Inside a provider
  // nothing below changes; outside one, the field simply has no error state.
  const form = useFormContext()

  const fieldState =
    form && fieldContext.name
      ? form.getFieldState(fieldContext.name, form.formState)
      : undefined

  const { id, required, described, onDescribedChange } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    required,
    described,
    onDescribedChange,
    ...fieldState
  }
}

/** The two slots that can describe a control, in the order a reader hears them. */
type DescribingSlot = 'message' | 'description'

type FormItemContextValue = {
  id: string
  required?: boolean
  /**
   * Which describing slots have actually rendered. `FormControl` cannot see its
   * own siblings, so they announce themselves and it points only at ids that
   * exist. Before this it named the description id unconditionally, and every
   * field built on these primitives renders that slot conditionally
   * (`{description && <FormDescription>…}`) — so a field without a description
   * shipped an `aria-describedby` pointing at nothing.
   */
  described?: Record<DescribingSlot, boolean>
  onDescribedChange?: (slot: DescribingSlot, rendered: boolean) => void
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

/**
 * Announce that this slot is on the page, for as long as it is.
 *
 * `rendered` is a parameter rather than a caller-side condition because
 * `FormMessage` returns null when it has nothing to say, and a hook cannot sit
 * behind that early return.
 */
function useDescribingSlot(slot: DescribingSlot, rendered: boolean) {
  const { onDescribedChange } = React.useContext(FormItemContext)

  React.useEffect(() => {
    if (!rendered) return

    onDescribedChange?.(slot, true)

    return () => onDescribedChange?.(slot, false)
  }, [onDescribedChange, slot, rendered])
}

export type FormItemProps = React.HTMLAttributes<HTMLDivElement> & {
  required?: boolean
}

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, required, ...props }, ref) => {
    const id = React.useId()
    const [described, setDescribed] = React.useState<
      Record<DescribingSlot, boolean>
    >({ message: false, description: false })

    // Keeps the object identity when nothing moved, so a slot re-registering
    // does not re-render the item for no reason.
    const onDescribedChange = React.useCallback(
      (slot: DescribingSlot, rendered: boolean) =>
        setDescribed((current) =>
          current[slot] === rendered
            ? current
            : { ...current, [slot]: rendered }
        ),
      []
    )

    return (
      <FormItemContext.Provider
        value={{ id, required, described, onDescribedChange }}
      >
        <div ref={ref} className={cn('space-y-2', className)} {...props} />
      </FormItemContext.Provider>
    )
  }
)
FormItem.displayName = 'FormItem'

export type FormLabelProps = React.ComponentPropsWithoutRef<
  typeof LabelPrimitive.Root
> & {
  extra?: React.ReactNode
}

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  FormLabelProps
>(({ className, extra, children, ...props }, ref) => {
  const { required, error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(
        'text-muted-foreground flex justify-between text-sm font-semibold',
        // The error TEXT token, matching FormMessage below: `--destructive`
        // is the badge/fill family and reads 3.80:1 as ink on the dark card.
        error && 'text-system-error-h1a',
        className
      )}
      htmlFor={formItemId}
      {...props}
    >
      <span>
        {children}
        {required ? ' *' : ''}
      </span>
      {extra}
    </Label>
  )
})
FormLabel.displayName = 'FormLabel'

export const FormTooltip = ({ children, ...others }: TooltipProviderProps) => (
  <TooltipProvider {...others}>
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="text-container-text ml-2 h-4 w-4" />
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
)

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId, described } =
    useFormField()

  // Only ids that resolve. A screen reader drops a dangling IDREF silently, so
  // the barrier this removes is diagnostic rather than operational: a form with
  // thirteen broken associations is a form where a real one cannot be spotted.
  //
  // Message first: a reader hears the error before the hint. `undefined` when
  // both slots are empty, which drops the attribute — and, because Radix Slot
  // OVERWRITES rather than merges, still lets the wrapped element carry its own
  // (`ui/file-upload` merges the injected id with its own error id that way).
  const describedBy =
    [
      described?.message ? formMessageId : undefined,
      described?.description ? formDescriptionId : undefined
    ]
      .filter(Boolean)
      .join(' ') || undefined

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={describedBy}
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = 'FormControl'

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  useDescribingSlot('description', true)

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-muted-foreground text-xs font-medium', className)}
      {...props}
    />
  )
})
FormDescription.displayName = 'FormDescription'

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  // Registered on `body`, not on `error`: a message given plain children
  // renders copy that the control has to point at too. The old expression only
  // added the message id when react-hook-form reported an error, so a
  // standalone message was rendered and never associated.
  useDescribingSlot('message', Boolean(body))

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      // The error TEXT token, not `text-destructive`: that is the badge/fill
      // family and measures ~3.8:1 as ink, under AA. Validation copy is text.
      className={cn('text-system-error-h1a text-sm font-medium', className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = 'FormMessage'

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField
}
