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

function BaseComponent(args: Omit<TextareaFieldProps, 'name' | 'control'>) {
  const form = useForm()

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

export const Primary: StoryObj<TextareaFieldProps> = {
  render: (args) => BaseComponent(args)
}

export const Required: StoryObj<TextareaFieldProps> = {
  args: { required: true },
  render: (args) => BaseComponent(args)
}

export const WithDescription: StoryObj<TextareaFieldProps> = {
  args: { description: 'Visible to the operations team only.' },
  render: (args) => BaseComponent(args)
}

export const WithTooltip: StoryObj<TextareaFieldProps> = {
  args: { tooltip: 'Free-form context attached to the transaction.' },
  render: (args) => BaseComponent(args)
}

export const Rows: StoryObj<TextareaFieldProps> = {
  args: { rows: 8 },
  render: (args) => BaseComponent(args)
}

export const ReadOnly: StoryObj<TextareaFieldProps> = {
  args: { readOnly: true },
  render: (args) => BaseComponent(args)
}

export const Disabled: StoryObj<TextareaFieldProps> = {
  args: { disabled: true },
  render: (args) => BaseComponent(args)
}
