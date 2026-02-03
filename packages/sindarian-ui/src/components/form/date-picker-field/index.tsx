'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
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
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import { CalendarIcon } from 'lucide-react'
import { ReactNode } from 'react'
import { Control } from 'react-hook-form'

export type DatePickerFieldProps = {
  name: string
  label?: ReactNode
  tooltip?: string
  labelExtra?: ReactNode
  description?: ReactNode
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  control: Control<any>
  required?: boolean
  dateFormat?: string
  align?: 'start' | 'center' | 'end'
  'data-testid'?: string
  valueAsString?: boolean
}

export const DatePickerField = ({
  name,
  label,
  tooltip,
  labelExtra,
  description,
  placeholder,
  disabled,
  readOnly,
  control,
  required,
  dateFormat = 'MMM DD, YYYY',
  align = 'start',
  valueAsString,
  ...others
}: DatePickerFieldProps) => {
  return (
    <FormField
      name={name}
      control={control}
      render={({ field }) => {
        const convertFieldValueToDate = (
          fieldValue: unknown
        ): Date | undefined => {
          if (!fieldValue) return undefined
          if (valueAsString) {
            const parsed = dayjs(fieldValue as string)
            return parsed.isValid() ? parsed.toDate() : undefined
          }
          return fieldValue as Date
        }

        const convertDateToOutputFormat = (
          date: Date | undefined
        ): Date | string | undefined => {
          if (!date) return undefined
          if (valueAsString) {
            const parsed = dayjs(date)
            return parsed.isValid() ? parsed.format('YYYY-MM-DD') : undefined
          }
          return date
        }

        const value = convertFieldValueToDate(field.value)

        const handleSelect = (date: Date | undefined) => {
          field.onChange(convertDateToOutputFormat(date))
        }

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

            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                      'border-button-border w-full justify-start px-2.5 font-normal',
                      !value && 'text-muted-foreground',
                      readOnly && 'pointer-events-none'
                    )}
                    data-testid={others['data-testid']}
                    icon={<CalendarIcon className="size-4" />}
                  >
                    {value ? (
                      dayjs(value).format(dateFormat)
                    ) : (
                      <span>{placeholder}</span>
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align={align}>
                <Calendar
                  mode="single"
                  defaultMonth={value}
                  selected={value}
                  onSelect={handleSelect}
                  disabled={disabled || readOnly}
                />
              </PopoverContent>
            </Popover>

            <FormMessage />
            {description && <FormDescription>{description}</FormDescription>}
          </FormItem>
        )
      }}
    />
  )
}
