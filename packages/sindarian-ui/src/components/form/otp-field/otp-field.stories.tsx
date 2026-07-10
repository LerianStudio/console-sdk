import { Meta, StoryObj } from '@storybook/nextjs'
import { OtpField, OtpFieldProps } from '.'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'

const meta: Meta<OtpFieldProps> = {
  title: 'Components/Form/OtpField',
  component: OtpField,
  argTypes: {}
}

export default meta

function BaseComponent(args: Omit<OtpFieldProps, 'name' | 'control'>) {
  const form = useForm()

  return (
    <div className="w-1/2">
      <Form {...form}>
        <OtpField
          {...args}
          control={form.control}
          label="Verification Code"
          name="otp"
        />
      </Form>
    </div>
  )
}

export const Primary: StoryObj<OtpFieldProps> = {
  render: (args) => BaseComponent(args)
}

export const WithSeparator: StoryObj<OtpFieldProps> = {
  args: {
    separator: true
  },
  render: (args) => BaseComponent(args)
}

export const Required: StoryObj<OtpFieldProps> = {
  args: {
    required: true
  },
  render: (args) => BaseComponent(args)
}

export const WithTooltip: StoryObj<OtpFieldProps> = {
  args: {
    tooltip: 'Enter the 6-digit code sent to your email'
  },
  render: (args) => BaseComponent(args)
}

export const Disabled: StoryObj<OtpFieldProps> = {
  args: {
    disabled: true
  },
  render: (args) => BaseComponent(args)
}

export const WithDescription: StoryObj<OtpFieldProps> = {
  args: {
    description: 'Check your email for the verification code'
  },
  render: (args) => BaseComponent(args)
}
