import * as React from 'react'
import { Meta, StoryObj } from '@storybook/nextjs'
import { Calendar } from '.'
import { DateRange } from 'react-day-picker'

const meta: Meta<typeof Calendar> = {
  title: 'Primitives/Calendar',
  component: Calendar,
  argTypes: {}
}

export default meta

export const Primary: StoryObj<typeof Calendar> = {
  render: (args) => <Calendar mode="single" {...args} />
}

export const WithSelectedDate: StoryObj<typeof Calendar> = {
  render: function Render(args) {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    return (
      <Calendar {...args} mode="single" selected={date} onSelect={setDate} />
    )
  }
}

export const RangeSelection: StoryObj<typeof Calendar> = {
  render: function Render(args) {
    const [range, setRange] = React.useState<DateRange | undefined>({
      from: new Date(),
      to: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })
    return (
      <Calendar {...args} mode="range" selected={range} onSelect={setRange} />
    )
  }
}

export const WithWeekNumbers: StoryObj<typeof Calendar> = {
  render: (args) => <Calendar mode="single" {...args} showWeekNumber />
}

export const MultipleMonths: StoryObj<typeof Calendar> = {
  render: (args) => <Calendar mode="single" {...args} numberOfMonths={2} />
}
