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
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator
} from '@/components/ui/otp-input'
import { ReactNode } from 'react'
import { Control, FieldValues, Path } from 'react-hook-form'

export type OtpFieldProps<T extends FieldValues = FieldValues> = {
  name: string
  label?: ReactNode
  tooltip?: string
  labelExtra?: ReactNode
  description?: ReactNode
  control: Control<T>
  disabled?: boolean
  required?: boolean
  maxLength?: number
  pattern?: string
  separator?: boolean
  'data-testid'?: string
}

export const OtpField = <T extends FieldValues = FieldValues>({
  name,
  label,
  tooltip,
  labelExtra,
  description,
  maxLength = 6,
  pattern,
  separator = false,
  ...others
}: OtpFieldProps<T>) => {
  const midpoint = Math.floor(maxLength / 2)

  const renderSlots = () => {
    if (separator && maxLength > 1) {
      const firstGroup = Array.from({ length: midpoint }, (_, i) => (
        <InputOTPSlot key={i} index={i} />
      ))
      const secondGroup = Array.from(
        { length: maxLength - midpoint },
        (_, i) => <InputOTPSlot key={midpoint + i} index={midpoint + i} />
      )

      return (
        <>
          <InputOTPGroup>{firstGroup}</InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>{secondGroup}</InputOTPGroup>
        </>
      )
    }

    return (
      <InputOTPGroup>
        {Array.from({ length: maxLength }, (_, i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    )
  }

  return (
    <FormField
      {...others}
      name={name as Path<T>}
      render={({ field }) => (
        <FormItem required={others.required}>
          {label && (
            <FormLabel
              extra={
                tooltip ? <FormTooltip>{tooltip}</FormTooltip> : labelExtra
              }
            >
              {label}
            </FormLabel>
          )}
          <FormControl>
            <InputOTP
              maxLength={maxLength}
              pattern={pattern}
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              name={field.name}
              disabled={others.disabled}
              data-testid={others['data-testid']}
            >
              {renderSlots()}
            </InputOTP>
          </FormControl>
          <FormMessage />
          {description && <FormDescription>{description}</FormDescription>}
        </FormItem>
      )}
    />
  )
}
