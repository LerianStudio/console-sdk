import { useState } from 'react'
import { Meta, StoryObj } from '@storybook/nextjs'
import { FileUpload, FileUploadProps, FileUploadResult } from '.'
import { Label } from '@/components/ui/label'

const meta: Meta<FileUploadProps> = {
  title: 'Primitives/FileUpload',
  component: FileUpload,
  argTypes: {}
}

export default meta

function BaseComponent(args: Partial<FileUploadProps>) {
  const [value, setValue] = useState<FileUploadResult | null>(null)

  return (
    <div className="w-1/2 space-y-2">
      <Label htmlFor="certificate">Certificate</Label>
      <FileUpload
        id="certificate"
        accept=".pem,.crt"
        maxSizeBytes={64 * 1024}
        {...args}
        value={value}
        onSelect={setValue}
      />
      {value && (
        <pre className="text-muted-foreground max-h-32 overflow-auto text-xs">
          {value.text.slice(0, 500)}
        </pre>
      )}
    </div>
  )
}

export const Primary: StoryObj<FileUploadProps> = {
  render: (args) => BaseComponent(args)
}

export const Disabled: StoryObj<FileUploadProps> = {
  args: { disabled: true },
  render: (args) => BaseComponent(args)
}

export const Invalid: StoryObj<FileUploadProps> = {
  args: { 'aria-invalid': true },
  render: (args) => BaseComponent(args)
}

export const Selected: StoryObj<FileUploadProps> = {
  render: () => (
    <div className="w-1/2">
      <FileUpload
        accept=".pem"
        value={{
          file: new File(['-----BEGIN CERTIFICATE-----'], 'cert.pem', {
            type: 'text/plain'
          }),
          text: '-----BEGIN CERTIFICATE-----'
        }}
        onSelect={() => {}}
      />
    </div>
  )
}
