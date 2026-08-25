import { ReactNode } from 'react'
import { Control, FieldValues, Path } from 'react-hook-form'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormTooltip
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

type TextareaFieldOwnProps<T extends FieldValues = FieldValues> = {
  control: Control<T>
  name: Path<T>
  description?: ReactNode
  placeholder?: string
  tooltip?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  rows?: number
  className?: string
  'data-testid'?: string
}

/**
 * A label that actually renders an element. `null`, `undefined` and booleans
 * are valid ReactNode but produce nothing, so a control typed on bare ReactNode
 * can satisfy the union below and still end up nameless.
 *
 * The empty string cannot be excluded here — `Exclude<string, ''>` is still
 * `string` — so `label=""` is caught at runtime by `hasRenderableLabel` instead.
 */
type RenderableLabel = Exclude<ReactNode, null | undefined | boolean>

/** Does this label produce a real element a screen reader can read? */
function hasRenderableLabel(label: ReactNode): boolean {
  if (label === null || label === undefined || typeof label === 'boolean') {
    return false
  }
  // Empty AND whitespace-only strings render a label box with nothing to
  // announce, so both count as absent. A number (`0`) is a real label.
  return typeof label === 'string' ? label.trim() !== '' : true
}

/**
 * A control with no accessible name is invisible to screen readers, so the type
 * makes one mandatory: either a visible `label`, or an `aria-label` when the
 * design calls for a bare textarea.
 */
export type TextareaFieldProps<T extends FieldValues = FieldValues> =
  TextareaFieldOwnProps<T> &
    (
      | { label: RenderableLabel; 'aria-label'?: string }
      | { label?: never; 'aria-label': string }
    )

export const TextareaField = <T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  tooltip,
  required,
  disabled,
  readOnly,
  rows,
  className,
  'data-testid': dataTestId,
  'aria-label': ariaLabelProp
}: TextareaFieldProps<T>) => {
  const showLabel = hasRenderableLabel(label)
  // An empty or whitespace-only aria-label is worse than none: it names the
  // control "". Drop it so the attribute never reaches the DOM.
  const ariaLabel = ariaLabelProp?.trim() ? ariaLabelProp : undefined

  // The type cannot rule out `label=""`, so this is the only signal a developer
  // gets that the control shipped nameless.
  if (process.env.NODE_ENV !== 'production' && !showLabel && !ariaLabel) {
    console.error(
      `TextareaField "${name}" has no accessible name: pass a non-empty label or aria-label.`
    )
  }

  return (
    <FormField
      control={control}
      name={name}
      // Controller-level, not just on the element: this is what keeps a
      // disabled field out of the submitted values.
      disabled={disabled}
      render={({ field }) => (
        <FormItem required={required}>
          {showLabel && (
            <FormLabel
              extra={tooltip ? <FormTooltip>{tooltip}</FormTooltip> : undefined}
            >
              {label}
            </FormLabel>
          )}
          <FormControl>
            {/* `required` drives the asterisk + aria-required (via FormItem),
                not the native `required` attribute — the resolver, not native
                validation, owns the required check. */}
            <Textarea
              placeholder={placeholder}
              readOnly={readOnly}
              rows={rows}
              className={className}
              data-testid={dataTestId}
              aria-label={ariaLabel}
              {...field}
            />
          </FormControl>
          <FormMessage />
          {description && <FormDescription>{description}</FormDescription>}
        </FormItem>
      )}
    />
  )
}
