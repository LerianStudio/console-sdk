import { Meta, StoryObj } from '@storybook/nextjs'
import { Toaster } from '@/components/ui/toast/toaster'
import { CopyField, CopyFieldProps } from '.'

const meta: Meta<CopyFieldProps> = {
  title: 'Primitives/CopyField',
  component: CopyField,
  argTypes: {},
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
        <Toaster />
      </div>
    )
  ]
}

export default meta

export const Default: StoryObj<CopyFieldProps> = {
  args: {
    value: 'JBSWY3DPEHPK3PXP'
  }
}

export const WithLabel: StoryObj<CopyFieldProps> = {
  args: {
    label: 'Manual entry secret',
    value: 'JBSWY3DPEHPK3PXP'
  }
}

export const Masked: StoryObj<CopyFieldProps> = {
  args: {
    label: 'Recovery code',
    value: 'a1b2-c3d4-e5f6',
    masked: true
  }
}

export const AutoClearingClipboard: StoryObj<CopyFieldProps> = {
  args: {
    label: 'Manual entry secret',
    value: 'JBSWY3DPEHPK3PXP',
    masked: true,
    clearClipboardAfter: 30_000
  }
}

export const WithCustomToastLabel: StoryObj<CopyFieldProps> = {
  args: {
    label: 'Manual entry secret',
    value: 'JBSWY3DPEHPK3PXP',
    onCopyLabel: 'Secret copied to clipboard'
  }
}
