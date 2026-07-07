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
import { TimePicker } from '@/components/ui/time-picker'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import { CalendarIcon, XIcon } from 'lucide-react'
import * as React from 'react'
import { type ReactNode } from 'react'
import { Control, FieldValues, Path } from 'react-hook-form'

export type DateTimePickerFieldProps<T extends FieldValues = FieldValues> = {
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
  minDate?: Date
  maxDate?: Date
  defaultTime?: string
}

export const DateTimePickerField = <T extends FieldValues = FieldValues>({
  name,
  label,
  tooltip,
  labelExtra,
  description,
  placeholder = 'Select date and time...',
  disabled,
  readOnly,
  control,
  required,
  dateFormat = 'MMM DD, YYYY HH:mm',
  align = 'start',
  minDate,
  maxDate,
  defaultTime = '00:00',
  ...others
}: DateTimePickerFieldProps<T>) => {
  const [open, setOpen] = React.useState(false)

  const parseDefaultTime = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return {
      hour: Number.isFinite(h) && h >= 0 && h <= 23 ? h : 0,
      minute: Number.isFinite(m) && m >= 0 && m <= 59 ? m : 0
    }
  }

  return (
    <FormField
      name={name as Path<T>}
      control={control}
      render={({ field }) => {
        const current = field.value ? dayjs(field.value as string) : null
        const isValid = current?.isValid() ?? false
        const validCurrent = isValid ? current : null

        const handleDateSelect = (date: Date | undefined) => {
          if (!date) return

          const time = validCurrent
            ? { hour: validCurrent.hour(), minute: validCurrent.minute() }
            : parseDefaultTime(defaultTime)

          const combined = dayjs(date)
            .hour(time.hour)
            .minute(time.minute)
            .second(0)
            .millisecond(0)

          field.onChange(combined.toISOString())
        }

        const handleTimeChange = (time: { hour: number; minute: number }) => {
          if (!validCurrent) return
          const updated = validCurrent
            .hour(time.hour)
            .minute(time.minute)
            .second(0)
            .millisecond(0)
          field.onChange(updated.toISOString())
        }

        const handleClear = (e: React.MouseEvent) => {
          e.stopPropagation()
          field.onChange('')
          setOpen(false)
        }

        const showClear = !!field.value && !readOnly && !disabled

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
                    <span
                      className={cn(
                        'text-foreground flex-1 text-left',
                        validCurrent && 'font-bold'
                      )}
                    >
                      {validCurrent
                        ? validCurrent.format(dateFormat)
                        : placeholder}
                    </span>

                    {showClear && (
                      <XIcon
                        className="text-muted-foreground hover:text-foreground ml-2 size-4 shrink-0"
                        onClick={handleClear}
                      />
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0" align={align}>
                <div className="flex flex-col sm:flex-row sm:items-stretch">
                  <Calendar
                    mode="single"
                    defaultMonth={
                      validCurrent ? validCurrent.toDate() : undefined
                    }
                    selected={validCurrent ? validCurrent.toDate() : undefined}
                    onSelect={handleDateSelect}
                    disabled={(date) => {
                      if (disabled || readOnly) return true
                      if (
                        minDate &&
                        date < dayjs(minDate).startOf('day').toDate()
                      )
                        return true
                      if (
                        maxDate &&
                        date > dayjs(maxDate).endOf('day').toDate()
                      )
                        return true
                      return false
                    }}
                  />

                  <div className="bg-border hidden w-px self-stretch sm:block" />
                  <div className="border-border border-t sm:hidden" />

                  <TimePicker
                    hour={validCurrent ? validCurrent.hour() : undefined}
                    minute={validCurrent ? validCurrent.minute() : undefined}
                    onChange={handleTimeChange}
                    disabled={disabled || readOnly || !validCurrent}
                  />
                </div>
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
