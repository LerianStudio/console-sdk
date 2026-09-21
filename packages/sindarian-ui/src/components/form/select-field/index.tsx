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
    /** Copy for the "nothing to pick" row. Defaults to "No options found." */
    emptyMessage?: string
    /**
     * Rendered inside the trigger, before the value — where a filter bar wants
     * its glyph. On the single select it shares one flex box with the value so
     * the trigger keeps exactly two children; on the multi select the trigger
     * already groups them. The node itself is passed through untouched, with
     * no `aria-hidden`: the prop takes an arbitrary node, and hiding it from
     * the accessibility tree on the caller's behalf would silence a node the
     * caller may have made meaningful on purpose. The trigger is named by its
     * label and its value, so the node passed here should be decorative.
     *
     * Spacing is the caller's: the kit adds no margin, because a gap here
     * would double with the one every existing call site already carries.
     */
    leadingIcon?: ReactNode
    /**
     * Placed on the field's own root box, merged with its spacing rather than
     * replacing it. The root is the element a parent grid positions, so
     * without this a consumer had to wrap the field in a spare div just to
     * span a column.
     */
    className?: string
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
  leadingIcon,
  className,
  onChange,
  ...others
}: SelectFieldProps<T>) => {
  // The props union already pairs `multi` with the callback shape that branch
  // emits, but destructuring an intersection loses that correlation — TS sees
  // two unrelated callbacks. Both branches report through this one seam, each
  // with the payload its own union member declared.
  const emitChange = onChange as
    ((value: string | string[]) => void) | undefined

  /**
   * ⛔ THE GLYPH AND THE VALUE ARE ONE FLEX CHILD, NEVER TWO.
   *
   * `.select-trigger` is `flex w-full items-center justify-between`, so a
   * third child makes it split the free space into TWO gaps: on any trigger
   * wider than its content — which is every filter bar — the selected value
   * drifted to the middle of the box instead of sitting beside the glyph.
   * Wrapped, the trigger is back to two children, content and chevron,
   * whatever the caller passes.
   *
   * `min-w-0` keeps the value truncating: the wrapper is the flex item now,
   * and a flex item never shrinks below its own min-content width. The
   * trigger's `VALUE_OVERFLOW_CLASS` reaches through it by descendant
   * selector.
   *
   * No `gap`: the prop's contract is that spacing is the caller's (the Tracer
   * filter bars carry their own `mr-2`), and a kit gap would double with it.
   *
   * The MULTI trigger needs none of this — it already renders its children
   * inside one `flex grow flex-wrap` box, so the icon already shares a parent
   * with the value and the trigger root already has exactly two children.
   * Wrapping there would put the selected-value badges in a non-wrapping row
   * and stop the trigger growing to a second line.
   */
  const withLeadingIcon = (value: ReactNode) =>
    leadingIcon ? (
      <span className="flex min-w-0 items-center">
        {leadingIcon}
        {value}
      </span>
    ) : (
      value
    )

  const renderItem = (field: Binding) => {
    return (
      <FormItem required={required} className={className}>
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
              {leadingIcon}
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
                {withLeadingIcon(<SelectValue placeholder={placeholder} />)}
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
