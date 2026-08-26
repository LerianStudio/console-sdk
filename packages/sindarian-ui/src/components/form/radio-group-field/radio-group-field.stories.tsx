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

/**
 * `RadioGroupFieldProps` is a union (visible label OR aria-label), and a union
 * hands `StoryObj` a union of render signatures — which stops contextually
 * typing `args` and makes it implicitly `any`. Omitting the props the story
 * supplies itself collapses the union to a single object type, which types the
 * render argument again.
 */
type RadioGroupFieldStoryArgs = Omit<
  RadioGroupFieldProps,
  'name' | 'control' | 'options'
> & {
  options?: RadioGroupFieldProps['options']
}

function BaseComponent(args: RadioGroupFieldStoryArgs) {
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

export const Primary: StoryObj<RadioGroupFieldStoryArgs> = {
  render: (args) => BaseComponent(args)
}

export const Required: StoryObj<RadioGroupFieldStoryArgs> = {
  args: { required: true },
  render: (args) => BaseComponent(args)
}

export const WithDescription: StoryObj<RadioGroupFieldStoryArgs> = {
  args: { description: 'Determines settlement window and cut-off.' },
  render: (args) => BaseComponent(args)
}

export const WithTooltip: StoryObj<RadioGroupFieldStoryArgs> = {
  args: { tooltip: 'Pix settles 24/7; TED only in business hours.' },
  render: (args) => BaseComponent(args)
}

export const WithDisabledOption: StoryObj<RadioGroupFieldStoryArgs> = {
  args: {
    options: [
      ...options.slice(0, 2),
      { value: 'siloc', label: 'SILOC', disabled: true }
    ]
  },
  render: (args) => BaseComponent(args)
}

export const Disabled: StoryObj<RadioGroupFieldStoryArgs> = {
  args: { disabled: true },
  render: (args) => BaseComponent(args)
}
