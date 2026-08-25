import { Meta, StoryObj } from '@storybook/nextjs'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { RadioGroupField, RadioGroupFieldProps } from '.'

const meta: Meta<RadioGroupFieldProps> = {
  title: 'Components/Form/RadioGroupField',
  component: RadioGroupField,
  argTypes: {}
}

export default meta

const options = [
  { value: 'pix', label: 'Pix' },
  { value: 'ted', label: 'TED' },
  { value: 'siloc', label: 'SILOC' }
]

function BaseComponent(
  args: Omit<RadioGroupFieldProps, 'name' | 'control' | 'options'> & {
    options?: RadioGroupFieldProps['options']
  }
) {
  const form = useForm({ defaultValues: { rail: 'pix' } })

  return (
    <div className="w-1/2">
      <Form {...form}>
        <RadioGroupField
          options={options}
          {...args}
          control={form.control}
          label="Rail"
          name="rail"
        />
      </Form>
    </div>
  )
}

export const Primary: StoryObj<RadioGroupFieldProps> = {
  render: (args) => BaseComponent(args)
}

export const Required: StoryObj<RadioGroupFieldProps> = {
  args: { required: true },
  render: (args) => BaseComponent(args)
}

export const WithDescription: StoryObj<RadioGroupFieldProps> = {
  args: { description: 'Determines settlement window and cut-off.' },
  render: (args) => BaseComponent(args)
}

export const WithTooltip: StoryObj<RadioGroupFieldProps> = {
  args: { tooltip: 'Pix settles 24/7; TED only in business hours.' },
  render: (args) => BaseComponent(args)
}

export const WithDisabledOption: StoryObj<RadioGroupFieldProps> = {
  args: {
    options: [
      ...options.slice(0, 2),
      { value: 'siloc', label: 'SILOC', disabled: true }
    ]
  },
  render: (args) => BaseComponent(args)
}

export const Disabled: StoryObj<RadioGroupFieldProps> = {
  args: { disabled: true },
  render: (args) => BaseComponent(args)
}
