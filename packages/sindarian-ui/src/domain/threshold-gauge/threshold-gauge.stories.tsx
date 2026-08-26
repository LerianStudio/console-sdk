import { Meta, StoryObj } from '@storybook/nextjs'

import { ThresholdGauge, ThresholdGaugeProps } from '.'

const meta: Meta<ThresholdGaugeProps> = {
  title: 'Domain/ThresholdGauge',
  component: ThresholdGauge,
  argTypes: {
    direction: {
      control: { type: 'inline-radio' },
      options: ['higher-is-worse', 'lower-is-worse']
    },
    format: {
      control: { type: 'select' },
      options: ['percent', 'ratio', 'count', 'money']
    },
    edges: {
      control: { type: 'inline-radio' },
      options: ['strict', 'inclusive']
    }
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    )
  ]
}

export default meta

type Story = StoryObj<ThresholdGaugeProps>

export const Breach: Story = {
  args: {
    value: 0.92,
    max: 1,
    warn: 0.8,
    breach: 0.9,
    format: 'ratio',
    direction: 'higher-is-worse',
    label: 'Utilização do limite',
    locale: 'pt-BR'
  }
}

export const Warn: Story = {
  args: { ...Breach.args, value: 0.85 } as ThresholdGaugeProps
}

export const Calm: Story = {
  args: { ...Breach.args, value: 0.42 } as ThresholdGaugeProps
}

export const LowerIsWorse: Story = {
  args: {
    value: 1.18,
    max: 2,
    warn: 1,
    breach: 0.9,
    format: 'ratio',
    direction: 'lower-is-worse',
    label: 'Índice de cobertura',
    locale: 'pt-BR'
  }
}

export const MoneyFormat: Story = {
  args: {
    value: 1_240_500,
    max: 2_000_000,
    warn: 1_500_000,
    breach: 1_800_000,
    format: 'money',
    currency: 'BRL',
    direction: 'higher-is-worse',
    label: 'Exposição contratada',
    locale: 'pt-BR'
  }
}
