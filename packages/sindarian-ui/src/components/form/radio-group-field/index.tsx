'use client'

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
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export type RadioGroupFieldOption = {
  value: string
  label: ReactNode
  disabled?: boolean
}

type RadioGroupFieldOwnProps<T extends FieldValues = FieldValues> = {
  control: Control<T>
  name: Path<T>
  options: RadioGroupFieldOption[]
  description?: ReactNode
  tooltip?: string
  required?: boolean
  disabled?: boolean
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
  return (
    label !== null &&
    label !== undefined &&
    typeof label !== 'boolean' &&
    label !== ''
  )
}

/**
 * A control with no accessible name is invisible to screen readers, so the type
 * makes one mandatory: either a visible `label`, or an `aria-label` when the
 * design calls for a bare radio group.
 */
export type RadioGroupFieldProps<T extends FieldValues = FieldValues> =
  RadioGroupFieldOwnProps<T> &
    (
      | { label: RenderableLabel; 'aria-label'?: string }
      | { label?: never; 'aria-label': string }
    )

export const RadioGroupField = <T extends FieldValues = FieldValues>({
  control,
  name,
  options,
  label,
  description,
  tooltip,
  required,
  disabled,
  'aria-label': ariaLabelProp
}: RadioGroupFieldProps<T>) => {
  const showLabel = hasRenderableLabel(label)
  // An empty aria-label is worse than none: it names the control "". Drop it so
  // the attribute never reaches the DOM.
  const ariaLabel = ariaLabelProp === '' ? undefined : ariaLabelProp

  // The type cannot rule out `label=""`, so this is the only signal a developer
  // gets that the control shipped nameless.
  if (process.env.NODE_ENV !== 'production' && !showLabel && !ariaLabel) {
    console.error(
      `RadioGroupField "${name}" has no accessible name: pass a non-empty label or aria-label.`
    )
  }

  // `setFocus(name)` / focus-on-error needs a ref to something focusable. The
  // RadioGroup root is a plain div, so the ref goes on the first option a user
  // could actually reach — a disabled radio is not focusable.
  const focusTargetIndex = options.findIndex((option) => !option.disabled)

  return (
    <FormField
      control={control}
      name={name}
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
            <RadioGroup
              name={field.name}
              value={field.value ?? ''}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              disabled={disabled}
              aria-label={ariaLabel}
              className="gap-2"
            >
              {options.map((option, index) => {
                const id = `${name}-${option.value}`
                return (
                  <div key={option.value} className="flex items-center gap-2">
                    <RadioGroupItem
                      ref={index === focusTargetIndex ? field.ref : undefined}
                      value={option.value}
                      id={id}
                      disabled={option.disabled}
                    />
                    <Label htmlFor={id} className="font-normal">
                      {option.label}
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </FormControl>
          <FormMessage />
          {description && <FormDescription>{description}</FormDescription>}
        </FormItem>
      )}
    />
  )
}
