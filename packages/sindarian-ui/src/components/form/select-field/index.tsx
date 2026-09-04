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

type SelectFieldSharedProps<T extends FieldValues = FieldValues> =
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
    required?: boolean
    emptyMessage?: string
    'data-testid'?: string
  }

/**
 * `multi` is the DISCRIMINANT, not an independent flag: it selects which of the
 * two field shapes the rest of the props must speak. Typed as a plain boolean
 * beside `value?: string | string[]`, `multi` with `value="pix"` compiled and
 * then rendered empty — the multi implementation only understands arrays and
 * turned the string into `[]`, dropping the caller's selection with no error
 * anywhere. The mismatch is unrepresentable now, and a multi consumer's
 * `onChange` receives `string[]` without a cast at the call site.
 */
type SelectFieldModeProps =
  | {
      multi: true
      /** Controlled values for the no-`control` path. Omit to let the select
       *  keep its own state and just report changes through `onChange`. */
      value?: string[]
      onChange?: (value: string[]) => void
    }
  | {
      multi?: false
      /** Controlled value for the no-`control` path. Omit to let the select
       *  keep its own state and just report changes through `onChange`. */
      value?: string
      onChange?: (value: string) => void
    }

export type SelectFieldProps<T extends FieldValues = FieldValues> =
  SelectFieldSharedProps<T> & SelectFieldModeProps

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
  // The props union already pairs `multi` with the callback shape that branch
  // emits, but destructuring an intersection loses that correlation — TS sees
  // two unrelated callbacks. Both branches report through this one seam, each
  // with the payload its own union member declared.
  const emitChange = onChange as
    ((value: string | string[]) => void) | undefined

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
              emitChange?.(value)
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
              emitChange?.(value)
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
      // An unset field falls back to the EMPTY value of its own shape: `''`
      // for the single select, `[]` for the multi one. Falling back to `''`
      // for both handed MultipleSelect a string it silently discarded.
      render={({ field }) =>
        renderItem({ ...field, value: field.value ?? (multi ? [] : '') })
      }
    />
  )
}
