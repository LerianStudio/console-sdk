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

export type TextareaFieldProps<T extends FieldValues = FieldValues> = {
  control: Control<T>
  name: string
  label?: ReactNode
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
  'data-testid': dataTestId
}: TextareaFieldProps<T>) => {
  return (
    <FormField
      control={control}
      name={name as Path<T>}
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
              disabled={disabled}
              readOnly={readOnly}
              rows={rows}
              className={className}
              data-testid={dataTestId}
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
