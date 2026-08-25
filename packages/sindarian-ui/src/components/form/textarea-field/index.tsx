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
 * A control with no accessible name is invisible to screen readers, so the type
 * makes one mandatory: either a visible `label`, or an `aria-label` when the
 * design calls for a bare textarea.
 */
export type TextareaFieldProps<T extends FieldValues = FieldValues> =
  TextareaFieldOwnProps<T> &
    (
      | { label: ReactNode; 'aria-label'?: string }
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
  'aria-label': ariaLabel
}: TextareaFieldProps<T>) => {
  return (
    <FormField
      control={control}
      name={name}
      // Controller-level, not just on the element: this is what keeps a
      // disabled field out of the submitted values.
      disabled={disabled}
      render={({ field }) => (
        <FormItem required={required}>
          {label && (
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
