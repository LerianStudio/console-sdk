import { Meta, StoryObj } from '@storybook/nextjs'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from './chart'

const meta: Meta<typeof ChartContainer> = {
  title: 'Charts/ChartContainer',
  component: ChartContainer,
  parameters: {
    docs: {
      description: {
        component:
          'Recharts wrapper. Series colors come from the chart tokens as ' +
          '`var(--color-chart-N)` — the Tailwind `@theme` names, already wrapped in ' +
          '`hsl()`. The container injects one `--color-<series>` variable per config ' +
          'key, scoped to that chart and emitted for both themes, so switching the ' +
          'theme re-colors the chart with no re-render.'
      }
    }
  }
}

export default meta

const data = [
  { day: 'Mon', settled: 4210, returned: 320, pending: 180, held: 90 },
  { day: 'Tue', settled: 5180, returned: 410, pending: 240, held: 120 },
  { day: 'Wed', settled: 4870, returned: 280, pending: 310, held: 60 },
  { day: 'Thu', settled: 6120, returned: 520, pending: 190, held: 140 },
  { day: 'Fri', settled: 7340, returned: 460, pending: 220, held: 80 }
]

const config: ChartConfig = {
  settled: { label: 'Settled', color: 'var(--color-chart-1)' },
  returned: { label: 'Returned', color: 'var(--color-chart-2)' },
  pending: { label: 'Pending', color: 'var(--color-chart-3)' },
  held: { label: 'Held', color: 'var(--color-chart-4)' }
}

function SettlementChart() {
  return (
    <ChartContainer
      config={config}
      ariaLabel="Settlement volume by day, four series"
      className="h-[320px] w-full"
    >
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={48} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="settled" fill="var(--color-settled)" radius={2} />
        <Bar dataKey="returned" fill="var(--color-returned)" radius={2} />
        <Bar dataKey="pending" fill="var(--color-pending)" radius={2} />
        <Bar dataKey="held" fill="var(--color-held)" radius={2} />
      </BarChart>
    </ChartContainer>
  )
}

export const Component: StoryObj<typeof ChartContainer> = {
  render: () => (
    <div className="bg-background p-6">
      <SettlementChart />
    </div>
  )
}

/** Same chart under `.dark` — the injected variables switch with the scope. */
export const Dark: StoryObj<typeof ChartContainer> = {
  render: () => (
    <div className="dark bg-background p-6">
      <SettlementChart />
    </div>
  )
}
