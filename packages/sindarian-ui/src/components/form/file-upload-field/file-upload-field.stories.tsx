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

/**
 * `FileUploadFieldProps` is a union (visible label OR aria-label), and a union
 * hands `StoryObj` a union of render signatures — which stops contextually
 * typing `args` and makes it implicitly `any`. Omitting the props the story
 * supplies itself collapses the union to a single object type, which types the
 * render argument again.
 */
type FileUploadFieldStoryArgs = Omit<FileUploadFieldProps, 'name' | 'control'>

function BaseComponent(args: FileUploadFieldStoryArgs) {
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

export const Primary: StoryObj<FileUploadFieldStoryArgs> = {
  render: (args) => BaseComponent(args)
}

export const Required: StoryObj<FileUploadFieldStoryArgs> = {
  args: { required: true },
  render: (args) => BaseComponent(args)
}

export const WithDescription: StoryObj<FileUploadFieldStoryArgs> = {
  args: { description: 'PEM or CRT, up to 64 KB.' },
  render: (args) => BaseComponent(args)
}

export const WithTooltip: StoryObj<FileUploadFieldStoryArgs> = {
  args: { tooltip: 'The A1 certificate used to sign RSFN messages.' },
  render: (args) => BaseComponent(args)
}

export const Disabled: StoryObj<FileUploadFieldStoryArgs> = {
  args: { disabled: true },
  render: (args) => BaseComponent(args)
}
