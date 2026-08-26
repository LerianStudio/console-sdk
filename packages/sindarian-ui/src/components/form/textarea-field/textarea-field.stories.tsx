import { Meta, StoryObj } from '@storybook/nextjs'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { TextareaField, TextareaFieldProps } from '.'

const meta: Meta<TextareaFieldProps> = {
  title: 'Components/Form/TextareaField',
  component: TextareaField,
  argTypes: {}
}

export default meta

/**
 * `TextareaFieldProps` is a union (visible label OR aria-label), and a union
 * hands `StoryObj` a union of render signatures — which stops contextually
 * typing `args` and makes it implicitly `any`. Omitting the props the story
 * supplies itself collapses the union to a single object type, which types the
 * render argument again.
 */
type TextareaFieldStoryArgs = Omit<TextareaFieldProps, 'name' | 'control'>

function BaseComponent(args: TextareaFieldStoryArgs) {
  // Seed the field react-hook-form will control. Without it the value goes
  // undefined → string on the first edit, which is React's
  // uncontrolled-to-controlled switch and warns in the console.
  const form = useForm({ defaultValues: { notes: '' } })

  return (
    <div className="w-1/2">
      <Form {...form}>
        <TextareaField
          {...args}
          control={form.control}
          label="Notes"
          name="notes"
          placeholder="Type..."
        />
      </Form>
    </div>
  )
}

export const Primary: StoryObj<TextareaFieldStoryArgs> = {
  render: (args) => BaseComponent(args)
}

export const Required: StoryObj<TextareaFieldStoryArgs> = {
  args: { required: true },
  render: (args) => BaseComponent(args)
}

export const WithDescription: StoryObj<TextareaFieldStoryArgs> = {
  args: { description: 'Visible to the operations team only.' },
  render: (args) => BaseComponent(args)
}

export const WithTooltip: StoryObj<TextareaFieldStoryArgs> = {
  args: { tooltip: 'Free-form context attached to the transaction.' },
  render: (args) => BaseComponent(args)
}

export const Rows: StoryObj<TextareaFieldStoryArgs> = {
  args: { rows: 8 },
  render: (args) => BaseComponent(args)
}

export const ReadOnly: StoryObj<TextareaFieldStoryArgs> = {
  args: { readOnly: true },
  render: (args) => BaseComponent(args)
}

export const Disabled: StoryObj<TextareaFieldStoryArgs> = {
  args: { disabled: true },
  render: (args) => BaseComponent(args)
}
