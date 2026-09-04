import * as React from 'react'
import { Meta, StoryObj } from '@storybook/nextjs'
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table'
import { DataTable, DataTableProps } from '.'
import { StatusBadge } from '../status-badge'

type Settlement = {
  id: string
  counterparty: string
  status: string
  amount: number
}

const data: Settlement[] = [
  {
    id: 'stl_01',
    counterparty: 'Banco Alpha',
    status: 'SUCCEEDED',
    amount: 1250
  },
  {
    id: 'stl_02',
    counterparty: 'Banco Bravo',
    status: 'PENDING',
    amount: 980.5
  },
  { id: 'stl_03', counterparty: 'Banco Charlie', status: 'FAILED', amount: 42 }
]

const columns: ColumnDef<Settlement, unknown>[] = [
  { accessorKey: 'id', header: 'Id' },
  { accessorKey: 'counterparty', header: 'Counterparty' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} withIcon />
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    meta: { numeric: true },
    cell: ({ getValue }) =>
      getValue<number>().toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
  }
]

const meta: Meta<DataTableProps<Settlement>> = {
  title: 'Enterprise/DataTable',
  component: DataTable,
  argTypes: {
    density: { control: 'inline-radio', options: ['comfortable', 'compact'] },
    flush: { control: 'boolean' },
    loading: { control: 'boolean' }
  }
}

export default meta

export const Default: StoryObj<DataTableProps<Settlement>> = {
  args: { columns, data, getRowId: (row) => row.id }
}

export const Loading: StoryObj<DataTableProps<Settlement>> = {
  args: { columns, data: [], loading: true, skeletonRows: 4 }
}

export const Empty: StoryObj<DataTableProps<Settlement>> = {
  args: {
    columns,
    data: [],
    empty: {
      title: 'No settlements match this view',
      description: 'Try widening the date range.'
    }
  }
}

export const Compact: StoryObj<DataTableProps<Settlement>> = {
  args: { columns, data, getRowId: (row) => row.id, density: 'compact' }
}

export const KeyboardNavigable: StoryObj<DataTableProps<Settlement>> = {
  args: {
    columns,
    data,
    getRowId: (row) => row.id,
    onRowActivate: (row) => window.alert(`Activated ${row.id}`),
    rowHref: (row) => `/settlements/${row.id}`
  }
}

export const Footed: StoryObj<DataTableProps<Settlement>> = {
  args: {
    columns,
    data,
    getRowId: (row) => row.id,
    footer: (
      <tr>
        <td colSpan={3}>{data.length} settlements</td>
        <td className="text-right font-mono tabular-nums">
          {data
            .reduce((total, row) => total + row.amount, 0)
            .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </td>
      </tr>
    )
  }
}

/**
 * `Id` prefers 96px and `Status` gets a floor so its badge never wraps. Under
 * auto table layout a preferred width is not a pin: the browser may exceed it
 * to fit content. Columns that declare no size keep the auto table layout.
 */
export const SizedColumns: StoryObj<DataTableProps<Settlement>> = {
  args: {
    data,
    getRowId: (row) => row.id,
    columns: [
      { ...columns[0], size: 96 },
      columns[1],
      { ...columns[2], minSize: 140 },
      columns[3]
    ]
  }
}

export const RowSelection: StoryObj<DataTableProps<Settlement>> = {
  render: () => {
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(
      {}
    )
    return (
      <DataTable
        columns={columns}
        data={data}
        getRowId={(row) => row.id}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />
    )
  }
}
