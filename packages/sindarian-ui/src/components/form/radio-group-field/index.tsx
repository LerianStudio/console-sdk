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

export type RadioGroupFieldProps<T extends FieldValues = FieldValues> = {
  control: Control<T>
  name: Path<T>
  options: RadioGroupFieldOption[]
  label?: ReactNode
  description?: ReactNode
  tooltip?: string
  required?: boolean
  disabled?: boolean
}

export const RadioGroupField = <T extends FieldValues = FieldValues>({
  control,
  name,
  options,
  label,
  description,
  tooltip,
  required,
  disabled
}: RadioGroupFieldProps<T>) => {
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
          {label && (
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
