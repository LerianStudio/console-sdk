import * as React from 'react'
import { Meta, StoryObj } from '@storybook/nextjs'
import { ptBR } from 'react-day-picker/locale'
import { DateRangePicker, DateRangePickerProps, DateRangeValue } from '.'

const meta: Meta<DateRangePickerProps> = {
  title: 'Enterprise/DateRangePicker',
  component: DateRangePicker,
  argTypes: { invalid: { control: 'boolean' } }
}

export default meta

/** Controlled by construction — the story owns the range. */
function Harness(props: Omit<DateRangePickerProps, 'value' | 'onValueChange'>) {
  const [value, setValue] = React.useState<DateRangeValue>({
    from: '',
    to: ''
  })
  return (
    <div className="space-y-3">
      <DateRangePicker {...props} value={value} onValueChange={setValue} />
      <p className="text-muted-foreground font-mono text-xs">
        {value.from || '—'} → {value.to || '—'}
      </p>
    </div>
  )
}

const base = {
  fromId: 'date-from',
  toId: 'date-to',
  fromLabel: 'From',
  toLabel: 'To'
}

export const Default: StoryObj<DateRangePickerProps> = {
  render: () => <Harness {...base} />
}

export const Invalid: StoryObj<DateRangePickerProps> = {
  render: () => (
    <>
      <Harness {...base} invalid errorId="range-error" />
      <p id="range-error" className="text-destructive mt-2 text-xs">
        Pick a range no wider than 90 days.
      </p>
    </>
  )
}

export const BrazilianLocale: StoryObj<DateRangePickerProps> = {
  render: () => (
    <Harness
      fromId="data-de"
      toId="data-ate"
      fromLabel="De"
      toLabel="Até"
      placeholder="Qualquer data"
      clearLabel="Limpar"
      ariaLabel="Selecionar intervalo de datas"
      locale={ptBR}
    />
  )
}
