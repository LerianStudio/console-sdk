import { Meta, StoryObj } from '@storybook/nextjs'

import { Figure } from '../figure'
import { SectionLabel, SectionLabelProps } from '.'

const meta: Meta<SectionLabelProps> = {
  title: 'Domain/SectionLabel',
  component: SectionLabel
}

export default meta

type Story = StoryObj<SectionLabelProps>

export const Default: Story = {
  args: { children: 'Posição consolidada' }
}

export const AsCaption: Story = {
  args: { as: 'span', children: 'Atualizado 12:04 UTC' }
}

export const OverAFigure: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <SectionLabel>Exposição total</SectionLabel>
      <Figure size="panel">1.240.500,00</Figure>
    </div>
  )
}
