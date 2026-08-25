import { Meta, StoryObj } from '@storybook/nextjs'
import type { ColumnDef } from '@tanstack/react-table'
import { VirtualizedTable, VirtualizedTableProps } from '.'

type Tick = {
  seq: number
  endToEndId: string
  amount: number
}

const data: Tick[] = Array.from({ length: 20000 }, (_, i) => ({
  seq: i + 1,
  endToEndId: `E1234567820260826${String(i).padStart(11, '0')}`,
  amount: Math.round(Math.random() * 100000) / 100
}))

const columns: ColumnDef<Tick, unknown>[] = [
  { accessorKey: 'seq', header: '#' },
  { accessorKey: 'endToEndId', header: 'End-to-end id' },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ getValue }) =>
      getValue<number>().toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
  }
]

const meta: Meta<VirtualizedTableProps<Tick>> = {
  title: 'Enterprise/VirtualizedTable',
  component: VirtualizedTable,
  argTypes: { rowHeight: { control: 'number' } }
}

export default meta

export const TwentyThousandRows: StoryObj<VirtualizedTableProps<Tick>> = {
  args: { columns, data }
}

export const ShortViewport: StoryObj<VirtualizedTableProps<Tick>> = {
  args: { columns, data, maxHeight: 200 }
}

export const ViewportUnits: StoryObj<VirtualizedTableProps<Tick>> = {
  args: { columns, data, maxHeight: '60vh', rowHeight: 32 }
}
