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

export const Localized: StoryObj<CopyFieldProps> = {
  args: {
    label: 'Chave de API',
    value: 'mtch_sk_7f3a9c21e84b0d56',
    mono: true,
    description: 'Guarde esta chave em um gerenciador de senhas.',
    copyLabel: 'Copiar chave de API',
    onCopyLabel: 'Chave copiada para a área de transferência',
    fallbackLabel:
      'Cópia indisponível — texto selecionado, pressione Ctrl/Cmd+C'
  }
}
