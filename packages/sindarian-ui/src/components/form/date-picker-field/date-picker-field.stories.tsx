import { Meta, StoryObj } from '@storybook/nextjs'
import { DatePickerField, DatePickerFieldProps } from '.'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'

const meta: Meta<DatePickerFieldProps> = {
  title: 'Components/Form/DatePickerField',
  component: DatePickerField,
  argTypes: {}
}

export default meta

function BaseComponent(args: Omit<DatePickerFieldProps, 'name' | 'control'>) {
  const form = useForm({
    defaultValues: {
      date: undefined
    }
  })

  return (
    <div className="w-60">
      <Form {...form}>
        <DatePickerField
          {...args}
          control={form.control}
          label="Date"
          placeholder="Pick a date"
          name="date"
        />
      </Form>
    </div>
  )
}

function BaseComponentWithValue(
  args: Omit<DatePickerFieldProps, 'name' | 'control'>
) {
  const form = useForm({
    defaultValues: {
      date: new Date()
    }
  })

  return (
    <div className="w-60">
      <Form {...form}>
        <DatePickerField
          {...args}
          control={form.control}
          label="Date"
          name="date"
        />
      </Form>
    </div>
  )
}

export const Primary: StoryObj<DatePickerFieldProps> = {
  render: (args) => BaseComponent(args)
}

export const WithValue: StoryObj<DatePickerFieldProps> = {
  render: (args) => BaseComponentWithValue(args)
}

export const Required: StoryObj<DatePickerFieldProps> = {
  args: {
    required: true
  },
  render: (args) => BaseComponent(args)
}

export const WithTooltip: StoryObj<DatePickerFieldProps> = {
  args: {
    tooltip: 'Select a date'
  },
  render: (args) => BaseComponent(args)
}

export const WithDescription: StoryObj<DatePickerFieldProps> = {
  args: {
    description: 'Select the date for the event.'
  },
  render: (args) => BaseComponent(args)
}

export const Disabled: StoryObj<DatePickerFieldProps> = {
  args: {
    disabled: true
  },
  render: (args) => BaseComponentWithValue(args)
}
