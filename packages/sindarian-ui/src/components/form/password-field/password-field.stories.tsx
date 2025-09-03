import { Meta, StoryObj } from '@storybook/nextjs'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { PasswordField, PasswordFieldProps } from '.'

const meta: Meta<PasswordFieldProps> = {
  title: 'Components/Form/PasswordField',
  component: PasswordField,
  argTypes: {}
}

export default meta

export const Primary: StoryObj<PasswordFieldProps> = {
  args: {
    name: 'password',
    label: 'Password',
    placeholder: 'Input password...',
    required: true
  },
  render: (args) => {
    const form = useForm()

    return (
      <Form {...form}>
        <PasswordField {...args} />
      </Form>
    )
  }
}
