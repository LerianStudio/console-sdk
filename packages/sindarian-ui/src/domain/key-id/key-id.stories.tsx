import { Meta, StoryObj } from '@storybook/nextjs'

import { KeyId, KeyIdProps } from '.'

const meta: Meta<KeyIdProps> = {
  title: 'Domain/KeyId',
  component: KeyId,
  argTypes: {
    kind: {
      control: { type: 'select' },
      options: [
        'pix-cpf',
        'pix-cnpj',
        'pix-email',
        'pix-phone',
        'pix-evp',
        'e2e',
        'idempotency',
        'generic'
      ]
    },
    mask: { control: { type: 'boolean' } },
    copyable: { control: { type: 'boolean' } }
  }
}

export default meta

type Story = StoryObj<KeyIdProps>

export const Default: Story = {
  args: {
    value: '529.982.247-25',
    kind: 'pix-cpf',
    label: 'Pagador',
    copyable: true
  }
}

export const PiiKinds: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <KeyId value="529.982.247-25" kind="pix-cpf" label="CPF" copyable />
      <KeyId value="11.222.333/0001-81" kind="pix-cnpj" label="CNPJ" copyable />
      <KeyId
        value="fred@lerian.studio"
        kind="pix-email"
        label="E-mail"
        copyable
      />
      <KeyId
        value="+55 (11) 91234-5678"
        kind="pix-phone"
        label="Telefone"
        copyable
      />
    </div>
  )
}

export const IdKinds: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <KeyId
        value="E3207415820240621120049a1b2c3d4"
        kind="e2e"
        label="E2E"
        copyable
      />
      <KeyId
        value="123e4567-e89b-12d3-a456-426614174000"
        kind="pix-evp"
        label="EVP"
        copyable
      />
      <KeyId value="idem-8f2c9d1e-4a7b-11ee" kind="idempotency" label="Idem" />
    </div>
  )
}

export const Revealed: Story = {
  args: { value: '529.982.247-25', kind: 'pix-cpf', label: 'CPF', mask: false }
}
