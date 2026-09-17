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
  'data-testid'?: string
  /** Accessible name of the eye button while the password is hidden. */
  showPasswordLabel?: string
  /** Accessible name of the eye button while the password is showing. */
  hidePasswordLabel?: string
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
  disabled = false,
  'data-testid': dataTestId,
  showPasswordLabel = 'Show password',
  hidePasswordLabel = 'Hide password'
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
                  {/* ⛔ A GLYPH IS NOT A NAME. This button renders an Eye and
                      nothing else, so it announced as "button" on every
                      credential form in the fleet (SC 4.1.2). `aria-pressed`
                      carries the state — is the password showing — and the
                      name carries what pressing it will DO, so neither has to
                      be inferred from the icon. */}
                  <IconButton
                    type="button"
                    variant="outline"
                    rounded
                    aria-label={show ? hidePasswordLabel : showPasswordLabel}
                    aria-pressed={show}
                    onClick={() => setShow(!show)}
                  >
                    {show ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                  </IconButton>
                </InputAdornment>
              }
              disabled={disabled}
              className="pr-10"
              data-testid={dataTestId}
            />
          </FormControl>

          <FormMessage />
        </FormItem>
      )}
    />
  )
}
