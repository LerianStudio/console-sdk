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
import { type DateRange } from 'react-day-picker'
import { Control, FieldValues, Path } from 'react-hook-form'

export type DateRangeFieldProps<T extends FieldValues = FieldValues> = {
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
  numberOfMonths?: number
  dateFormat?: string
  align?: 'start' | 'center' | 'end'
  'data-testid'?: string
}

export const DateRangeField = <T extends FieldValues = FieldValues>({
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
  numberOfMonths = 2,
  dateFormat = 'MMM DD, YYYY',
  align = 'start',
  ...others
}: DateRangeFieldProps<T>) => {
  return (
    <FormField
      name={name as Path<T>}
      control={control}
      render={({ field }) => {
        const value = field.value as DateRange | undefined

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
                      'bg-input hover:bg-input border-border text-foreground h-9 w-full justify-start rounded-md px-2.5 font-normal',
                      readOnly && 'pointer-events-none'
                    )}
                    data-testid={others['data-testid']}
                    icon={<CalendarIcon className="size-4" />}
                  >
                    {value?.from ? (
                      <span className="text-foreground flex-1 text-left font-bold">
                        {value.to ? (
                          <>
                            {dayjs(value.from).format(dateFormat)} -{' '}
                            {dayjs(value.to).format(dateFormat)}
                          </>
                        ) : (
                          dayjs(value.from).format(dateFormat)
                        )}
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
                  mode="range"
                  defaultMonth={value?.from}
                  selected={value}
                  onSelect={field.onChange}
                  numberOfMonths={numberOfMonths}
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
