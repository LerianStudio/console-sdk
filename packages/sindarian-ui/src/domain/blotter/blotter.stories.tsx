import { Meta, StoryObj } from '@storybook/nextjs'

import { MoneyText } from '../money-text'
import { Blotter, BlotterProps, BlotterRow } from '.'

const meta: Meta<BlotterProps> = {
  title: 'Domain/Blotter',
  component: Blotter,
  decorators: [
    (Story) => (
      <div className="border-border bg-card w-96 rounded-lg border p-5">
        <Story />
      </div>
    )
  ]
}

export default meta

type Story = StoryObj<BlotterProps>

export const Default: Story = {
  render: () => (
    <Blotter>
      <BlotterRow label="Liquidadas no prazo" value="128" />
      <BlotterRow label="Em processamento" value="12" />
      <BlotterRow label="Vencidas" value="3" valueClassName="text-credit" />
    </Blotter>
  )
}

export const WithMoney: Story = {
  render: () => (
    <Blotter>
      <BlotterRow
        label="Saldo"
        value={<MoneyText amount="1240500.00" currency="BRL" locale="pt-BR" />}
      />
      <BlotterRow
        label="Diferença"
        value={<MoneyText amount="-8820.00" currency="BRL" locale="pt-BR" />}
      />
    </Blotter>
  )
}

export const Stacked: Story = {
  render: () => (
    <Blotter>
      <BlotterRow label="Identificador" value="E32074…c3d4" />
      <BlotterRow
        stacked
        label="Motivo da devolução"
        value="Conta encerrada pelo titular antes da liquidação do lote."
      />
    </Blotter>
  )
}
