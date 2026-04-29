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
import { Control } from 'react-hook-form'

export type DateRangeFieldProps = {
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
  numberOfMonths?: number
  dateFormat?: string
  align?: 'start' | 'center' | 'end'
  'data-testid'?: string
}

export const DateRangeField = ({
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
}: DateRangeFieldProps) => {
  return (
    <FormField
      name={name}
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
                      'border-button-border w-full justify-start px-2.5 font-normal',
                      !value && 'text-muted-foreground',
                      readOnly && 'pointer-events-none'
                    )}
                    data-testid={others['data-testid']}
                    icon={<CalendarIcon className="size-4" />}
                  >
                    {value?.from ? (
                      value.to ? (
                        <>
                          {dayjs(value.from).format(dateFormat)} -{' '}
                          {dayjs(value.to).format(dateFormat)}
                        </>
                      ) : (
                        dayjs(value.from).format(dateFormat)
                      )
                    ) : (
                      <span>{placeholder}</span>
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
