import { fireEvent, render, screen } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '.'

type LedgerRow = {
  id: string
  name: string
  amount: number
}

const rows: LedgerRow[] = [
  { id: 'alpha', name: 'Alpha', amount: 1250 },
  { id: 'bravo', name: 'Bravo', amount: 980 }
]

const columns: ColumnDef<LedgerRow, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'amount',
    header: 'Amount',
    meta: { numeric: true },
    cell: ({ getValue }) => `$${getValue<number>().toFixed(2)}`
  }
]

const getRowId = (row: LedgerRow) => row.id

describe('DataTable', () => {
  it('announces loading and renders the requested skeleton grid', () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={[]}
        loading
        loadingLabel="Loading settlements"
        skeletonRows={3}
      />
    )

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent('Loading settlements')
    // 1 header row + 3 skeleton rows
    expect(container.querySelectorAll('tr')).toHaveLength(4)
  })

  it('renders the default and custom empty states', () => {
    const { rerender } = render(<DataTable columns={columns} data={[]} />)
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('No rows')

    rerender(
      <DataTable
        columns={columns}
        data={[]}
        empty={{
          title: 'No settlements match this view',
          description: 'Create one first'
        }}
      />
    )
    expect(
      screen.getByText('No settlements match this view')
    ).toBeInTheDocument()
    expect(screen.getByText('Create one first')).toBeInTheDocument()
  })

  it('renders rows and right-aligns numeric columns', () => {
    render(<DataTable columns={columns} data={rows} getRowId={getRowId} />)

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Bravo')).toBeInTheDocument()
    expect(screen.getByText('$1250.00')).toHaveClass('text-right')
    expect(screen.getByRole('columnheader', { name: 'Amount' })).toHaveClass(
      'text-right'
    )
    expect(screen.getByRole('status')).toHaveTextContent('2 rows')
  })

  it('applies the compact density and flush framing', () => {
    const { container } = render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={getRowId}
        density="compact"
        flush
      />
    )

    expect(container.firstElementChild).not.toHaveClass('rounded-lg')
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveClass(
      'h-8'
    )
    expect(screen.getByText('Alpha')).toHaveClass('py-1.5')
  })

  it('reflects controlled selection and renders row-selection controls', () => {
    const onRowSelectionChange = jest.fn()
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={getRowId}
        enableRowSelection
        rowSelection={{ alpha: true }}
        onRowSelectionChange={onRowSelectionChange}
      />
    )

    expect(screen.getAllByRole('checkbox')).toHaveLength(3)
    expect(
      screen.getByRole('checkbox', { name: 'Select row alpha' })
    ).toBeChecked()
    expect(
      screen.getByRole('checkbox', { name: 'Select row bravo' })
    ).not.toBeChecked()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select row bravo' }))
    expect(onRowSelectionChange).toHaveBeenCalled()
  })

  it('adds no keyboard layer without onRowActivate', () => {
    render(<DataTable columns={columns} data={rows} getRowId={getRowId} />)

    screen.getAllByRole('row').forEach((row) => {
      expect(row).not.toHaveAttribute('tabindex')
    })
  })

  it('gives rows a roving tabindex and activates on Enter', () => {
    const onRowActivate = jest.fn()
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={getRowId}
        onRowActivate={onRowActivate}
      />
    )

    const [first, second] = screen.getAllByRole('row').slice(1)
    expect(first).toHaveAttribute('tabindex', '0')
    expect(second).toHaveAttribute('tabindex', '-1')

    fireEvent.keyDown(first, { key: 'Enter' })
    expect(onRowActivate).toHaveBeenCalledWith(rows[0])
  })

  it('moves row focus with the arrow keys and Home/End', () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={getRowId}
        onRowActivate={jest.fn()}
      />
    )

    const [first, second] = screen.getAllByRole('row').slice(1)
    first.focus()

    fireEvent.keyDown(first, { key: 'ArrowDown' })
    expect(second).toHaveFocus()

    fireEvent.keyDown(second, { key: 'Home' })
    expect(first).toHaveFocus()

    fireEvent.keyDown(first, { key: 'End' })
    expect(second).toHaveFocus()
  })

  it('opens rowHref in a new tab on Cmd/Ctrl+Enter and no-ops without it', () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null)
    const onRowActivate = jest.fn()

    const { rerender } = render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={getRowId}
        onRowActivate={onRowActivate}
      />
    )

    let first = screen.getAllByRole('row')[1]
    fireEvent.keyDown(first, { key: 'Enter', metaKey: true })
    expect(open).not.toHaveBeenCalled()
    expect(onRowActivate).not.toHaveBeenCalled()

    rerender(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={getRowId}
        onRowActivate={onRowActivate}
        rowHref={(row) => `/settlements/${row.id}`}
      />
    )

    first = screen.getAllByRole('row')[1]
    fireEvent.keyDown(first, { key: 'Enter', ctrlKey: true })
    expect(open).toHaveBeenCalledWith(
      '/settlements/alpha',
      '_blank',
      'noopener,noreferrer'
    )

    open.mockRestore()
  })

  it('never hijacks keydown originating from an interactive cell child', () => {
    const onRowActivate = jest.fn()
    const interactiveColumns: ColumnDef<LedgerRow, unknown>[] = [
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <button type="button">Inspect {row.original.name}</button>
        )
      }
    ]

    render(
      <DataTable
        columns={interactiveColumns}
        data={rows.slice(0, 1)}
        getRowId={getRowId}
        onRowActivate={onRowActivate}
      />
    )

    fireEvent.keyDown(screen.getByRole('button', { name: 'Inspect Alpha' }), {
      key: 'Enter'
    })
    expect(onRowActivate).not.toHaveBeenCalled()
  })

  it('toggles selection with Space when row selection is enabled', () => {
    const onRowSelectionChange = jest.fn()
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={getRowId}
        enableRowSelection
        rowSelection={{}}
        onRowSelectionChange={onRowSelectionChange}
        onRowActivate={jest.fn()}
      />
    )

    fireEvent.keyDown(screen.getAllByRole('row')[1], { key: ' ' })
    expect(onRowSelectionChange).toHaveBeenCalled()
  })
})
