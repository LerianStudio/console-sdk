import { Meta, StoryObj } from '@storybook/nextjs'
import { DateTimePickerField, DateTimePickerFieldProps } from '.'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'

const meta: Meta<DateTimePickerFieldProps> = {
  title: 'Components/Form/DateTimePickerField',
  component: DateTimePickerField,
  argTypes: {}
}

export default meta

function BaseComponent(
  args: Omit<DateTimePickerFieldProps, 'name' | 'control'>
) {
  const form = useForm({
    defaultValues: {
      dateTime: ''
    }
  })

  return (
    <div className="w-60">
      <Form {...form}>
        <DateTimePickerField
          {...args}
          control={form.control}
          label="Date and Time"
          placeholder="Select date and time..."
          name="dateTime"
        />
      </Form>
    </div>
  )
}

function BaseComponentWithValue(
  args: Omit<DateTimePickerFieldProps, 'name' | 'control'>
) {
  const form = useForm({
    defaultValues: {
      dateTime: '2026-04-16T10:03:00.000Z'
    }
  })

  return (
    <div className="w-60">
      <Form {...form}>
        <DateTimePickerField
          {...args}
          control={form.control}
          label="Date and Time"
          name="dateTime"
        />
      </Form>
    </div>
  )
}

export const Primary: StoryObj<DateTimePickerFieldProps> = {
  render: (args) => BaseComponent(args)
}

export const WithValue: StoryObj<DateTimePickerFieldProps> = {
  render: (args) => BaseComponentWithValue(args)
}

export const Required: StoryObj<DateTimePickerFieldProps> = {
  args: {
    required: true
  },
  render: (args) => BaseComponent(args)
}

export const WithTooltip: StoryObj<DateTimePickerFieldProps> = {
  args: {
    tooltip: 'Select date and time for the event'
  },
  render: (args) => BaseComponent(args)
}

export const WithDescription: StoryObj<DateTimePickerFieldProps> = {
  args: {
    description: 'Choose the date and time for the scheduled event.'
  },
  render: (args) => BaseComponent(args)
}

export const Disabled: StoryObj<DateTimePickerFieldProps> = {
  args: {
    disabled: true
  },
  render: (args) => BaseComponentWithValue(args)
}

export const ReadOnly: StoryObj<DateTimePickerFieldProps> = {
  args: {
    readOnly: true
  },
  render: (args) => BaseComponentWithValue(args)
}

export const WithMinMaxDate: StoryObj<DateTimePickerFieldProps> = {
  args: {
    minDate: new Date('2026-04-10T00:00:00.000Z'),
    maxDate: new Date('2026-04-20T00:00:00.000Z')
  },
  render: (args) => BaseComponentWithValue(args)
}
