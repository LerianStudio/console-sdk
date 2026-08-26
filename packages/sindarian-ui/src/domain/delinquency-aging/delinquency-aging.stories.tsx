import { Meta, StoryObj } from '@storybook/nextjs'

import { DelinquencyAging, DelinquencyAgingProps } from '.'

const meta: Meta<DelinquencyAgingProps> = {
  title: 'Domain/DelinquencyAging',
  component: DelinquencyAging,
  decorators: [
    (Story) => (
      <div className="border-border bg-card w-[640px] rounded-lg border p-5">
        <Story />
      </div>
    )
  ]
}

export default meta

type Story = StoryObj<DelinquencyAgingProps>

const HEALTHY: DelinquencyAgingProps['buckets'] = [
  { label: 'A vencer', count: 312, total: '1840500.00', overdue: false },
  { label: '1–30', count: 84, total: '40230.00', overdue: true },
  { label: '31–60', count: 21, total: '11890.00', overdue: true },
  { label: '61–90', count: 9, total: '5420.00', overdue: true },
  { label: '90+', count: 4, total: '3810.00', overdue: true }
]

export const Healthy: Story = {
  args: { buckets: HEALTHY, currency: 'BRL', locale: 'pt-BR', showTotal: true }
}

export const Distressed: Story = {
  args: {
    currency: 'BRL',
    locale: 'pt-BR',
    showTotal: true,
    buckets: [
      { label: 'A vencer', count: 120, total: '840500.00', overdue: false },
      { label: '1–30', count: 84, total: '402300.00', overdue: true },
      { label: '31–60', count: 61, total: '318900.00', overdue: true },
      { label: '61–90', count: 39, total: '154200.00', overdue: true },
      { label: '90+', count: 24, total: '138100.00', overdue: true }
    ]
  }
}

export const EmptyPortfolio: Story = {
  args: {
    currency: 'BRL',
    locale: 'pt-BR',
    buckets: [{ label: 'A vencer', count: 0, total: '0.00', overdue: false }]
  }
}
