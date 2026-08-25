import { Meta, StoryObj } from '@storybook/nextjs'

import { MoneyText, MoneyTextProps } from '.'

const meta: Meta<MoneyTextProps> = {
  title: 'Domain/MoneyText',
  component: MoneyText,
  argTypes: {
    fractionDigits: { control: { type: 'number' } },
    hideCurrency: { control: { type: 'boolean' } },
    signColor: { control: { type: 'boolean' } }
  }
}

export default meta

type Story = StoryObj<MoneyTextProps>

export const Default: Story = {
  args: { amount: '1250.00', currency: 'BRL', locale: 'pt-BR' }
}

export const Negative: Story = {
  args: { amount: '-8820.00', currency: 'BRL', locale: 'pt-BR' }
}

export const AccountingParens: Story = {
  args: { amount: '(123.45)', currency: 'BRL', locale: 'pt-BR' }
}

export const NoValue: Story = {
  args: { amount: null, currency: 'BRL' }
}

export const LosslessPrecision: Story = {
  args: { amount: '12345678901234567890.12', currency: 'BRL', locale: 'pt-BR' }
}

export const MixedCurrencies: Story = {
  render: () => (
    <div className="flex flex-col items-end gap-1">
      <MoneyText amount="1250.00" currency="BRL" locale="pt-BR" />
      <MoneyText amount="1250.00" currency="USD" locale="pt-BR" />
      <MoneyText
        amount="125000"
        currency="JPY"
        fractionDigits={0}
        locale="pt-BR"
      />
      <MoneyText amount="-980.55" currency="BRL" locale="pt-BR" />
    </div>
  )
}
