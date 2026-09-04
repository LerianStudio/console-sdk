import { Meta, StoryObj } from '@storybook/nextjs'
import type { ColumnDef } from '@tanstack/react-table'
import { VirtualizedTable, VirtualizedTableProps } from '.'

type Tick = {
  seq: number
  endToEndId: string
  amount: number
}

// Derived, not random: module-scope Math.random() reshuffles the fixture on
// every module evaluation, so the story can never be a stable visual baseline.
// The spread is generated in CENTS and divided once, so the amounts actually
// carry decimals (`* 100 / 100` would cancel and yield whole units).
const data: Tick[] = Array.from({ length: 20000 }, (_, i) => ({
  seq: i + 1,
  endToEndId: `E1234567820260826${String(i).padStart(11, '0')}`,
  amount: (((i * 7919) % 100000) + 1) / 100
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

/**
 * `#` is pinned narrow and the end-to-end id given a floor, so the long
 * identifier stops squeezing the sequence column. Columns that declare no size
 * keep their equal share of the row.
 */
export const SizedColumns: StoryObj<VirtualizedTableProps<Tick>> = {
  args: {
    data,
    columns: [
      { accessorKey: 'seq', header: '#', size: 64 },
      { accessorKey: 'endToEndId', header: 'End-to-end id', minSize: 340 },
      columns[2]
    ]
  }
}

/** The same override seam DataTable exposes: one prop quiets the column heads. */
export const QuietHeader: StoryObj<VirtualizedTableProps<Tick>> = {
  args: {
    columns,
    data,
    headClassName: 'font-normal'
  }
}
