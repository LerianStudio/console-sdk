import { useState } from 'react'
import { Meta, StoryObj } from '@storybook/nextjs'
import {
  MultipleFileUpload,
  MultipleFileUploadProps,
  FileUploadResult
} from '.'
import { Label } from '@/components/ui/label'

const meta: Meta<MultipleFileUploadProps> = {
  title: 'Primitives/MultipleFileUpload',
  component: MultipleFileUpload,
  argTypes: {}
}

export default meta

function BaseComponent(args: Partial<MultipleFileUploadProps>) {
  const [value, setValue] = useState<FileUploadResult[]>([])
  // `args` is spread AFTER the default below, so it is what actually reaches
  // the component. `Unbounded` sets maxFiles to undefined through it.
  const maxFiles = 'maxFiles' in args ? args.maxFiles : 5

  return (
    <div className="w-1/2 space-y-2">
      <Label htmlFor="evidence">Evidence</Label>
      <MultipleFileUpload
        id="evidence"
        readAs="none"
        accept="application/pdf,image/jpeg,image/png"
        maxSizeBytes={20 * 1024 * 1024}
        maxFiles={5}
        {...args}
        value={value}
        onValueChange={setValue}
      />
      <p className="text-muted-foreground text-xs">
        {maxFiles === undefined
          ? `${value.length} selected`
          : `${value.length} of ${maxFiles} selected`}
      </p>
    </div>
  )
}

export const Primary: StoryObj<MultipleFileUploadProps> = {
  render: (args) => <BaseComponent {...args} />
}

export const Disabled: StoryObj<MultipleFileUploadProps> = {
  args: { disabled: true },
  render: (args) => <BaseComponent {...args} />
}

export const Invalid: StoryObj<MultipleFileUploadProps> = {
  args: { 'aria-invalid': true },
  render: (args) => <BaseComponent {...args} />
}

export const Unbounded: StoryObj<MultipleFileUploadProps> = {
  args: { maxFiles: undefined },
  render: (args) => <BaseComponent {...args} />
}

const pdf = (name: string, size: number) => {
  const file = new File(['%PDF-1.7'], name, { type: 'application/pdf' })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

export const Selected: StoryObj<MultipleFileUploadProps> = {
  render: () => (
    <div className="w-1/2">
      <MultipleFileUpload
        readAs="none"
        accept="application/pdf"
        maxFiles={5}
        value={[
          { file: pdf('contract.pdf', 184_320), text: '' },
          { file: pdf('receipt.pdf', 22_016), text: '' },
          { file: pdf('statement.pdf', 1_310_720), text: '' }
        ]}
        onValueChange={() => {}}
      />
    </div>
  )
}

export const AtCapacity: StoryObj<MultipleFileUploadProps> = {
  render: () => (
    <div className="w-1/2">
      <MultipleFileUpload
        readAs="none"
        accept="application/pdf"
        maxFiles={2}
        value={[
          { file: pdf('contract.pdf', 184_320), text: '' },
          { file: pdf('receipt.pdf', 22_016), text: '' }
        ]}
        onValueChange={() => {}}
      />
    </div>
  )
}
