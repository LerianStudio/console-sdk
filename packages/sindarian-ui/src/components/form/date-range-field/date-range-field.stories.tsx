import { Meta, StoryObj } from '@storybook/nextjs'
import { DateRangeField, DateRangeFieldProps } from '.'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import dayjs from 'dayjs'

const meta: Meta<DateRangeFieldProps> = {
  title: 'Components/Form/DateRangeField',
  component: DateRangeField,
  argTypes: {}
}

export default meta

function BaseComponent(args: Omit<DateRangeFieldProps, 'name' | 'control'>) {
  const form = useForm({
    defaultValues: {
      dateRange: undefined
    }
  })

  return (
    <div className="w-80">
      <Form {...form}>
        <DateRangeField
          {...args}
          control={form.control}
          label="Date Range"
          placeholder="Pick a date"
          name="dateRange"
        />
      </Form>
    </div>
  )
}

function BaseComponentWithValue(
  args: Omit<DateRangeFieldProps, 'name' | 'control'>
) {
  const form = useForm({
    defaultValues: {
      dateRange: {
        from: new Date(),
        to: dayjs().add(7, 'day').toDate()
      }
    }
  })

  return (
    <div className="w-80">
      <Form {...form}>
        <DateRangeField
          {...args}
          control={form.control}
          label="Date Range"
          name="dateRange"
        />
      </Form>
    </div>
  )
}

export const Primary: StoryObj<DateRangeFieldProps> = {
  render: (args) => BaseComponent(args)
}

export const WithValue: StoryObj<DateRangeFieldProps> = {
  render: (args) => BaseComponentWithValue(args)
}

export const Required: StoryObj<DateRangeFieldProps> = {
  args: {
    required: true
  },
  render: (args) => BaseComponent(args)
}

export const WithTooltip: StoryObj<DateRangeFieldProps> = {
  args: {
    tooltip: 'Select a date range for your report'
  },
  render: (args) => BaseComponent(args)
}

export const WithDescription: StoryObj<DateRangeFieldProps> = {
  args: {
    description: 'Select the start and end dates for the period.'
  },
  render: (args) => BaseComponent(args)
}

export const Disabled: StoryObj<DateRangeFieldProps> = {
  args: {
    disabled: true
  },
  render: (args) => BaseComponentWithValue(args)
}

export const SingleMonth: StoryObj<DateRangeFieldProps> = {
  args: {
    numberOfMonths: 1
  },
  render: (args) => BaseComponent(args)
}
