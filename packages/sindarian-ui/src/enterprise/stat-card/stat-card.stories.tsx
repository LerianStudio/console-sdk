import { Meta, StoryObj } from '@storybook/nextjs'
import { StatCard, StatCardProps } from '.'

const trend = [
  { value: 12 },
  { value: 18 },
  { value: 15 },
  { value: 24 },
  { value: 31 },
  { value: 28 },
  { value: 39 }
]

const meta: Meta<StatCardProps> = {
  title: 'Enterprise/StatCard',
  component: StatCard,
  argTypes: {
    tone: {
      control: 'select',
      options: ['default', 'success', 'warning', 'destructive']
    }
  }
}

export default meta

export const Default: StoryObj<StatCardProps> = {
  args: { label: 'Match rate', value: '98.4%' }
}

export const WithDelta: StoryObj<StatCardProps> = {
  args: {
    label: 'Match rate',
    value: '98.4%',
    delta: '+0.6 pts',
    tone: 'success'
  }
}

export const WithTrend: StoryObj<StatCardProps> = {
  args: { label: 'In flight', value: 'R$ 129.004', trend }
}

export const WithRows: StoryObj<StatCardProps> = {
  args: {
    label: 'Disputes',
    value: '3',
    tone: 'destructive',
    delta: '+2 today',
    rows: [
      { label: 'Open', value: '3' },
      { label: 'Resolved', value: '128' }
    ]
  }
}

export const Sheet: StoryObj<StatCardProps> = {
  render: () => (
    <div className="border-border bg-border grid grid-cols-1 gap-px overflow-hidden rounded-lg border lg:grid-cols-3">
      <StatCard
        label="Match rate"
        value="98.4%"
        delta="+0.6 pts"
        tone="success"
      />
      <StatCard label="In flight" value="R$ 129.004" trend={trend} />
      <StatCard
        label="Disputes"
        value="3"
        tone="destructive"
        rows={[{ label: 'Open', value: '3' }]}
      />
    </div>
  )
}
