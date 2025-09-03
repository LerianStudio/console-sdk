import React from 'react'
import { Control, FieldPath, FieldValues } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormTooltip
} from '@/components/ui/form'
import { Input, InputAdornment } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { IconButton } from '@/components/ui/icon-button'

export type PasswordFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
  label: string
  tooltip?: string
  placeholder?: string
  control: Control<TFieldValues>
  required?: boolean
  disabled?: boolean
}

export function PasswordField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  tooltip,
  placeholder,
  control,
  required = false,
  disabled = false
}: PasswordFieldProps<TFieldValues, TName>) {
  const [show, setShow] = React.useState(false)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem required={required}>
          <FormLabel
            extra={tooltip ? <FormTooltip>{tooltip}</FormTooltip> : undefined}
          >
            {label}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              type={show ? 'text' : 'password'}
              placeholder={placeholder}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    variant="outline"
                    rounded
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff /> : <Eye />}
                  </IconButton>
                </InputAdornment>
              }
              disabled={disabled}
              className="pr-10"
            />
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  )
}
