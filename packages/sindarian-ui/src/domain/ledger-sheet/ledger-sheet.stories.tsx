import { Meta, StoryObj } from '@storybook/nextjs'

import { Figure } from '../figure'
import { SectionLabel } from '../section-label'
import { LedgerPanel, LedgerSheet, LedgerSheetProps } from '.'

const meta: Meta<LedgerSheetProps> = {
  title: 'Domain/LedgerSheet',
  component: LedgerSheet,
  argTypes: {
    cols: { control: { type: 'select' }, options: [1, 2, 3, 4] }
  }
}

export default meta

type Story = StoryObj<LedgerSheetProps>

const Cell = ({ label, value }: { label: string; value: string }) => (
  <LedgerPanel>
    <SectionLabel>{label}</SectionLabel>
    <Figure size="panel">{value}</Figure>
  </LedgerPanel>
)

export const Default: Story = {
  args: { cols: 3 },
  render: (args) => (
    <LedgerSheet {...args}>
      <Cell label="Exposição total" value="1.240.500,00" />
      <Cell label="Em atraso" value="215.400,00" />
      <Cell label="Operações" value="430" />
    </LedgerSheet>
  )
}

export const TwoColumns: Story = {
  args: { cols: 2 },
  render: (args) => (
    <LedgerSheet {...args}>
      <Cell label="Débitos" value="612.000,00" />
      <Cell label="Créditos" value="612.000,00" />
    </LedgerSheet>
  )
}
