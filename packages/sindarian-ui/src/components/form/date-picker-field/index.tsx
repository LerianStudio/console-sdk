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
import * as React from 'react'
import { ReactNode } from 'react'
import { Control, FieldValues, Path } from 'react-hook-form'

export type DatePickerFieldProps<T extends FieldValues = FieldValues> = {
  name: string
  label?: ReactNode
  tooltip?: string
  labelExtra?: ReactNode
  description?: ReactNode
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  control: Control<T>
  required?: boolean
  dateFormat?: string
  align?: 'start' | 'center' | 'end'
  'data-testid'?: string
  valueAsString?: boolean
}

export const DatePickerField = <T extends FieldValues = FieldValues>({
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
}: DatePickerFieldProps<T>) => {
  const [open, setOpen] = React.useState(false)

  return (
    <FormField
      name={name as Path<T>}
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

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                      'bg-input hover:bg-input border-border text-foreground h-9 w-full justify-start rounded-md px-2.5 font-normal',
                      readOnly && 'pointer-events-none',
                      open && 'border-accent border-2'
                    )}
                    data-testid={others['data-testid']}
                    icon={<CalendarIcon className="size-4" />}
                  >
                    {value ? (
                      <span className="text-foreground flex-1 text-left font-bold">
                        {dayjs(value).format(dateFormat)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex-1 text-left">
                        {placeholder}
                      </span>
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
