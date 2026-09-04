import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormTooltip
} from '@/components/ui/form'
import {
  MultipleSelect,
  MultipleSelectContent,
  MultipleSelectTrigger,
  MultipleSelectValue
} from '@/components/ui/multiple-select'
import {
  Select,
  SelectContent,
  SelectEmpty,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import React, { PropsWithChildren, ReactNode } from 'react'
import {
  Control,
  ControllerRenderProps,
  FieldValues,
  Path
} from 'react-hook-form'

export type SelectFieldProps<T extends FieldValues = FieldValues> =
  PropsWithChildren & {
    name: string
    label?: ReactNode
    tooltip?: string
    labelExtra?: React.ReactNode
    description?: ReactNode
    placeholder?: string
    disabled?: boolean
    readOnly?: boolean
    /** react-hook-form control. Omit it to drive the field from plain state
     *  with `value` + `onChange`. */
    control?: Control<T>
    /** Controlled value for the no-`control` path. Omit it to let the select
     *  keep its own state and just report changes through `onChange`. */
    value?: string | string[]
    multi?: boolean
    required?: boolean
    emptyMessage?: string
    onChange?: (value: string | string[]) => void
    'data-testid'?: string
  }

/**
 * Both paths hand the body the shape react-hook-form's `render` already gives
 * it, so the markup below is the same object it always received and the
 * multi-select branch keeps compiling: `MultipleSelectProps['value']`
 * intersects cmdk's `value: string` with its own `value: string[]`, which no
 * concrete type satisfies. See the report for that upstream fix.
 */
type Binding = ControllerRenderProps

export const SelectField = <T extends FieldValues = FieldValues>({
  name,
  label,
  tooltip,
  labelExtra,
  required,
  placeholder,
  description,
  disabled,
  readOnly,
  multi,
  control,
  value,
  children,
  emptyMessage = 'No options found.',
  onChange,
  ...others
}: SelectFieldProps<T>) => {
  const renderItem = (field: Binding) => {
    return (
      <FormItem required={required}>
        {label && (
          <FormLabel
            extra={tooltip ? <FormTooltip>{tooltip}</FormTooltip> : labelExtra}
          >
            {label}
          </FormLabel>
        )}

        {multi ? (
          <MultipleSelect
            onValueChange={(value) => {
              field.onChange(value)
              onChange?.(value)
            }}
            disabled={disabled}
            {...field}
          >
            <MultipleSelectTrigger readOnly={readOnly}>
              <MultipleSelectValue placeholder={placeholder} />
            </MultipleSelectTrigger>
            <MultipleSelectContent>{children}</MultipleSelectContent>
          </MultipleSelect>
        ) : (
          <Select
            onValueChange={(value) => {
              field.onChange(value)
              onChange?.(value)
            }}
            value={field.value as string | undefined}
            disabled={disabled}
            open={readOnly ? false : undefined}
            onOpenChange={readOnly ? () => {} : undefined}
          >
            <FormControl>
              <SelectTrigger
                className={cn(disabled && 'bg-shadcn-100')}
                readOnly={readOnly}
                data-testid={others['data-testid']}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectEmpty>{emptyMessage}</SelectEmpty>
              {children}
            </SelectContent>
          </Select>
        )}

        <FormMessage />
        {description && <FormDescription>{description}</FormDescription>}
      </FormItem>
    )
  }

  if (!control) {
    // `value` undefined leaves Radix to keep its own state, so an uncontrolled
    // standalone select still opens and picks; `onChange` reports either way.
    // The caller's own `onChange` is invoked by the body, so this is a no-op.
    return renderItem({
      name,
      value,
      onChange: () => {},
      onBlur: () => {},
      ref: () => {},
      disabled
    } as ControllerRenderProps)
  }

  return (
    <FormField
      name={name as Path<T>}
      control={control}
      {...others}
      render={({ field }) => renderItem({ ...field, value: field.value ?? '' })}
    />
  )
}
