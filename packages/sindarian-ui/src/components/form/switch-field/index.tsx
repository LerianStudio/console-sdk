import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormTooltip
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { ReactNode } from 'react'
import { Control, FieldValues, Path } from 'react-hook-form'

export type SwitchFieldProps<T extends FieldValues = FieldValues> = {
  label?: string
  name: string
  control: Control<T>
  labelExtra?: ReactNode
  tooltip?: string
  required?: boolean
  disabled?: boolean
  disabledTooltip?: string
  'data-testid'?: string
}

export const SwitchField = <T extends FieldValues = FieldValues>({
  label,
  name,
  control,
  labelExtra,
  tooltip,
  required,
  disabled,
  disabledTooltip,
  'data-testid': dataTestId
}: SwitchFieldProps<T>) => {
  return (
    <FormField
      name={name as Path<T>}
      control={control}
      render={({ field }) => {
        // FormControl stamps the id the label points at on its direct child,
        // so it must wrap the Switch itself, never the tooltip around it.
        const control = (
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              data-testid={dataTestId}
            />
          </FormControl>
        )

        return (
          <FormItem required={required}>
            {label && (
              <FormLabel
                extra={
                  tooltip ? <FormTooltip>{tooltip}</FormTooltip> : labelExtra
                }
              >
                {label}
              </FormLabel>
            )}

            <div className="relative">
              {disabled && disabledTooltip ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="inline-flex w-auto">{control}</div>
                  </TooltipTrigger>
                  <TooltipContent>{disabledTooltip}</TooltipContent>
                </Tooltip>
              ) : (
                control
              )}
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
