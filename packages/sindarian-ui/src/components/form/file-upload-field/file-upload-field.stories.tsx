import { Meta, StoryObj } from '@storybook/nextjs'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { FileUploadField, FileUploadFieldProps } from '.'

const meta: Meta<FileUploadFieldProps> = {
  title: 'Components/Form/FileUploadField',
  component: FileUploadField,
  argTypes: {}
}

export default meta

function BaseComponent(args: Omit<FileUploadFieldProps, 'name' | 'control'>) {
  const form = useForm({ defaultValues: { certificate: '' } })
  const value = form.watch('certificate')

  return (
    <div className="w-1/2 space-y-2">
      <Form {...form}>
        <FileUploadField
          accept=".pem,.crt"
          maxSizeBytes={64 * 1024}
          {...args}
          control={form.control}
          label="Certificate"
          name="certificate"
        />
      </Form>
      {value && (
        <pre className="text-muted-foreground max-h-32 overflow-auto text-xs">
          {value.slice(0, 500)}
        </pre>
      )}
    </div>
  )
}

export const Primary: StoryObj<FileUploadFieldProps> = {
  render: (args) => BaseComponent(args)
}

export const Required: StoryObj<FileUploadFieldProps> = {
  args: { required: true },
  render: (args) => BaseComponent(args)
}

export const WithDescription: StoryObj<FileUploadFieldProps> = {
  args: { description: 'PEM or CRT, up to 64 KB.' },
  render: (args) => BaseComponent(args)
}

export const WithTooltip: StoryObj<FileUploadFieldProps> = {
  args: { tooltip: 'The A1 certificate used to sign RSFN messages.' },
  render: (args) => BaseComponent(args)
}

export const Disabled: StoryObj<FileUploadFieldProps> = {
  args: { disabled: true },
  render: (args) => BaseComponent(args)
}
