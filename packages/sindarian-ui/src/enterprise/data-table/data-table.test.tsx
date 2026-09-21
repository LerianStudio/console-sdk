import { fireEvent, render, screen } from '@testing-library/react'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { DataTable, type DataTableProps } from '.'

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

  it('renders header cells in the kit label voice', () => {
    render(<DataTable columns={columns} data={rows} getRowId={getRowId} />)

    const head = screen.getByRole('columnheader', { name: 'Name' })
    expect(head).toHaveClass('text-sm', 'font-medium', 'text-muted-foreground')
    // The retired Ledger register: 11px small-caps in a console whose siblings
    // all speak sentence case.
    // One class per assertion: a multi-argument `not.toHaveClass` passes when
    // ANY one of the names is missing, so a single call would go green with
    // three of the four retired tokens still on the element.
    expect(head).not.toHaveClass('uppercase')
    expect(head).not.toHaveClass('tracking-[0.08em]')
    expect(head).not.toHaveClass('text-[11px]')
    expect(head).not.toHaveClass('tracking-wide')
  })

  it('merges headClassName into every header cell', () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={getRowId}
        headClassName="text-foreground"
      />
    )

    screen.getAllByRole('columnheader').forEach((head) => {
      expect(head).toHaveClass('text-foreground', 'font-medium')
      expect(head).not.toHaveClass('text-muted-foreground')
    })
  })

  it('renders the footer slot inside a tfoot and omits it by default', () => {
    const { container, rerender } = render(
      <DataTable columns={columns} data={rows} getRowId={getRowId} />
    )
    expect(container.querySelector('tfoot')).toBeNull()

    rerender(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={getRowId}
        footer={
          <tr>
            <td>Total</td>
            <td>$2230.00</td>
          </tr>
        }
      />
    )

    const tfoot = container.querySelector('tfoot')
    expect(tfoot).not.toBeNull()
    expect(tfoot).toContainElement(screen.getByText('$2230.00'))
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

  it('marks the header checkbox indeterminate on a partial selection', () => {
    const { rerender } = render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={getRowId}
        enableRowSelection
        rowSelection={{ alpha: true }}
        onRowSelectionChange={jest.fn()}
      />
    )

    const header = screen.getByRole('checkbox', {
      name: 'Select all rows on this page'
    }) as HTMLInputElement
    expect(header.indeterminate).toBe(true)
    expect(header.checked).toBe(false)

    rerender(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={getRowId}
        enableRowSelection
        rowSelection={{ alpha: true, bravo: true }}
        onRowSelectionChange={jest.fn()}
      />
    )
    const all = screen.getByRole('checkbox', {
      name: 'Select all rows on this page'
    }) as HTMLInputElement
    expect(all.indeterminate).toBe(false)
    expect(all.checked).toBe(true)

    rerender(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={getRowId}
        enableRowSelection
        rowSelection={{}}
        onRowSelectionChange={jest.fn()}
      />
    )
    const none = screen.getByRole('checkbox', {
      name: 'Select all rows on this page'
    }) as HTMLInputElement
    expect(none.indeterminate).toBe(false)
    expect(none.checked).toBe(false)
  })

  it('drives selection purely from the controlled prop (no internal state)', () => {
    // The legacy contract is controlled-only: a click reports upward and
    // changes nothing until the parent feeds a new rowSelection back down.
    const onRowSelectionChange = jest.fn()
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={getRowId}
        enableRowSelection
        rowSelection={{}}
        onRowSelectionChange={onRowSelectionChange}
      />
    )

    const bravo = screen.getByRole('checkbox', { name: 'Select row bravo' })
    fireEvent.click(bravo)

    expect(onRowSelectionChange).toHaveBeenCalledTimes(1)
    expect(bravo).not.toBeChecked()
  })

  it('names row checkboxes through getRowSelectionLabel when provided', () => {
    render(
      <DataTable
        columns={columns}
        data={rows}
        getRowId={getRowId}
        enableRowSelection
        rowSelection={{}}
        onRowSelectionChange={jest.fn()}
        getRowSelectionLabel={(row) => `Select settlement ${row.name}`}
      />
    )

    expect(
      screen.getByRole('checkbox', { name: 'Select settlement Alpha' })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('checkbox', { name: 'Select row alpha' })
    ).toBeNull()
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

/**
 * `size` / `minSize` on a ColumnDef were inert: `<th>` and `<td>` rendered with
 * no width at all, so a declared floor read as an enforced floor that never
 * applied. TanStack stamps its own defaults (size 150, minSize 20) onto every
 * columnDef, so the table blanks them out via `defaultColumn` and a column
 * declaring exactly the library default is honoured like any other — while an
 * undeclared column keeps the auto table layout it has today.
 *
 * `maxSize` stays unemitted on this path: auto table layout ignores
 * `max-width` on a cell, so rendering it would promise a ceiling that never
 * holds. VirtualizedTable's flex rows are where all three pin.
 */
describe('DataTable column sizing', () => {
  const sizedColumns: ColumnDef<LedgerRow, unknown>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      size: 240,
      minSize: 120,
      maxSize: 320
    },
    { accessorKey: 'amount', header: 'Amount' }
  ]

  it('applies a declared size to the header cell', () => {
    render(<DataTable columns={sizedColumns} data={rows} />)

    const head = screen.getByRole('columnheader', { name: 'Name' })
    expect(head).toHaveStyle({ width: '240px', minWidth: '120px' })
    // `max-width` is inert on a cell under auto table layout, so this path
    // must not advertise a ceiling it cannot hold.
    expect(head.style.maxWidth).toBe('')
  })

  it('applies a declared size to the body cells of that column', () => {
    render(<DataTable columns={sizedColumns} data={rows} />)

    const cell = screen.getAllByRole('cell')[0]
    expect(cell).toHaveStyle({ width: '240px', minWidth: '120px' })
    expect(cell.style.maxWidth).toBe('')
  })

  it('emits nothing for a column declaring only the inert maxSize', () => {
    render(
      <DataTable
        columns={[
          { accessorKey: 'name', header: 'Name', maxSize: 320 },
          { accessorKey: 'amount', header: 'Amount' }
        ]}
        data={rows}
      />
    )

    const head = screen.getByRole('columnheader', { name: 'Name' })
    expect(head.style.width).toBe('')
    expect(head.style.minWidth).toBe('')
    expect(head.style.maxWidth).toBe('')
  })

  it('applies a lone minSize without pinning a width', () => {
    render(
      <DataTable
        columns={[
          { accessorKey: 'name', header: 'Name', minSize: 180 },
          { accessorKey: 'amount', header: 'Amount' }
        ]}
        data={rows}
      />
    )

    const head = screen.getByRole('columnheader', { name: 'Name' })
    expect(head).toHaveStyle({ minWidth: '180px' })
    expect(head.style.width).toBe('')
  })

  it('honours a declared size that equals the library default', () => {
    render(
      <DataTable
        columns={[
          { accessorKey: 'name', header: 'Name', size: 150 },
          { accessorKey: 'amount', header: 'Amount' }
        ]}
        data={rows}
      />
    )

    const head = screen.getByRole('columnheader', { name: 'Name' })
    expect(head).toHaveStyle({ width: '150px' })
  })

  it('honours a declared minSize that equals the library default', () => {
    render(
      <DataTable
        columns={[
          { accessorKey: 'name', header: 'Name', minSize: 20 },
          { accessorKey: 'amount', header: 'Amount' }
        ]}
        data={rows}
      />
    )

    const head = screen.getByRole('columnheader', { name: 'Name' })
    expect(head).toHaveStyle({ minWidth: '20px' })
    expect(head.style.width).toBe('')
  })

  it('leaves an undeclared column with no inline sizing at all', () => {
    render(<DataTable columns={columns} data={rows} />)

    for (const head of screen.getAllByRole('columnheader')) {
      expect(head.style.width).toBe('')
      expect(head.style.minWidth).toBe('')
      expect(head.style.maxWidth).toBe('')
    }
    for (const cell of screen.getAllByRole('cell')) {
      expect(cell.style.width).toBe('')
      expect(cell.style.minWidth).toBe('')
      expect(cell.style.maxWidth).toBe('')
    }
  })
})

/**
 * The table renders every header cell itself, so it is the only place that can
 * put the sort state where ARIA defines it. Before this, a consumer's only
 * channels were `ColumnMeta.numeric` and `headClassName`, neither of which
 * reaches an attribute, so the state ended up on the header `<button>` where
 * `aria-sort` is not allowed and axe `aria-allowed-attr` fails at critical on
 * every sortable column. Sorting stays controlled and manual: the attribute
 * reports the consumer's order, the body never reorders itself.
 */
describe('DataTable aria-sort', () => {
  const sortableColumns: ColumnDef<LedgerRow, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'amount', header: 'Amount', enableSorting: false },
    { id: 'actions', header: 'Actions', cell: () => <button>Open</button> }
  ]

  const renderSorted = (sorting: SortingState) =>
    render(
      <DataTable
        columns={sortableColumns}
        data={rows}
        getRowId={getRowId}
        enableSorting
        sorting={sorting}
        onSortingChange={jest.fn()}
      />
    )

  it('announces the sorted column and follows the direction it is given', () => {
    const { rerender } = renderSorted([{ id: 'name', desc: true }])

    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'descending'
    )

    rerender(
      <DataTable
        columns={sortableColumns}
        data={rows}
        getRowId={getRowId}
        enableSorting
        sorting={[{ id: 'name', desc: false }]}
        onSortingChange={jest.fn()}
      />
    )

    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending'
    )
  })

  it('marks a sortable but unsorted column as none', () => {
    renderSorted([])

    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'none'
    )
  })

  it('omits the attribute on an opted-out column and on a display column', () => {
    renderSorted([{ id: 'name', desc: true }])

    expect(
      screen.getByRole('columnheader', { name: 'Amount' })
    ).not.toHaveAttribute('aria-sort')
    // No accessor, so TanStack can never sort it: an actions column stays
    // silent rather than advertising a control that does not exist.
    expect(
      screen.getByRole('columnheader', { name: 'Actions' })
    ).not.toHaveAttribute('aria-sort')
  })

  it('adds no aria-sort anywhere with sorting off, the default', () => {
    const { container } = render(
      <DataTable columns={sortableColumns} data={rows} getRowId={getRowId} />
    )

    expect(container.querySelectorAll('[aria-sort]')).toHaveLength(0)
  })

  it('ignores a controlled pair passed without the flag', () => {
    // The prop types forbid this, but a JS consumer can still write it. Half
    // enabling sorting would announce a state the table is not tracking.
    const props = {
      columns: sortableColumns,
      data: rows,
      getRowId,
      sorting: [{ id: 'name', desc: true }],
      onSortingChange: jest.fn()
    } as unknown as DataTableProps<LedgerRow>

    const { container } = render(<DataTable {...props} />)

    expect(container.querySelectorAll('[aria-sort]')).toHaveLength(0)
  })

  it('puts aria-sort on the th and nowhere else', () => {
    renderSorted([{ id: 'name', desc: true }])

    const marked = Array.from(document.querySelectorAll('[aria-sort]'))
    expect(marked).toHaveLength(1)
    marked.forEach((el) => expect(el.tagName).toBe('TH'))
  })

  it('leaves the row order to the consumer when sorting is enabled', () => {
    renderSorted([{ id: 'name', desc: true }])

    const cells = screen.getAllByRole('cell').map((cell) => cell.textContent)
    expect(cells[0]).toBe('Alpha')
  })

  it('leaves a placeholder cell under a column group unannounced', () => {
    // Mixing a grouped column with an ungrouped one makes react-table pad the
    // shallower column with an empty placeholder `th`. It labels nothing, so
    // announcing its leaf column's sort state there would report the same sort
    // twice, once from a cell with no header text at all.
    const groupedColumns: ColumnDef<LedgerRow, unknown>[] = [
      {
        id: 'identity',
        header: 'Group',
        columns: [{ accessorKey: 'name', header: 'Name' }]
      },
      { accessorKey: 'amount', header: 'Amount' }
    ]

    const { container } = render(
      <DataTable
        columns={groupedColumns}
        data={rows}
        getRowId={getRowId}
        enableSorting
        sorting={[{ id: 'amount', desc: false }]}
        onSortingChange={jest.fn()}
      />
    )

    const placeholders = Array.from(container.querySelectorAll('th')).filter(
      (th) => th.textContent === ''
    )

    expect(placeholders).toHaveLength(1)
    expect(placeholders[0]).not.toHaveAttribute('aria-sort')
    expect(
      screen.getByRole('columnheader', { name: 'Amount' })
    ).toHaveAttribute('aria-sort', 'ascending')
  })
})

/**
 * Per-column meta is the only channel a consumer has into cells the table
 * renders for it. Until now that channel carried one thing, `numeric`, so a
 * status column could not centre itself, no column could carry its own classes
 * on head or body, and a cell that must be its own `<td>` (a colspan, a link
 * that fills the cell box) had no way to say so — the table always wrapped it.
 * That is why the console kept a second table instead of using this one. The
 * four member names are frozen by plan 2026-09-21-console-simplification C9.
 */
describe('DataTable column meta', () => {
  it('aligns head and body from an explicit alignment', () => {
    render(
      <DataTable
        columns={[
          { accessorKey: 'name', header: 'Name' },
          { accessorKey: 'amount', header: 'Amount', meta: { align: 'right' } }
        ]}
        data={rows}
        getRowId={getRowId}
      />
    )

    expect(screen.getByRole('columnheader', { name: 'Amount' })).toHaveClass(
      'text-right'
    )
    expect(screen.getByText('1250')).toHaveClass('text-right')
  })

  it('lets an explicit alignment beat numeric while the figures stay mono', () => {
    render(
      <DataTable
        columns={[
          { accessorKey: 'name', header: 'Name' },
          {
            accessorKey: 'amount',
            header: 'Amount',
            meta: { numeric: true, align: 'left' }
          }
        ]}
        data={rows}
        getRowId={getRowId}
      />
    )

    const head = screen.getByRole('columnheader', { name: 'Amount' })
    expect(head).not.toHaveClass('text-right')

    const cell = screen.getByText('1250')
    expect(cell).toHaveClass('text-left', 'font-mono', 'tabular-nums')
    expect(cell).not.toHaveClass('text-right')
  })

  it('merges headerClassName after the table-level headClassName', () => {
    render(
      <DataTable
        columns={[
          { accessorKey: 'name', header: 'Name' },
          {
            accessorKey: 'amount',
            header: 'Amount',
            meta: { headerClassName: 'text-destructive' }
          }
        ]}
        data={rows}
        getRowId={getRowId}
        headClassName="text-foreground"
      />
    )

    const amount = screen.getByRole('columnheader', { name: 'Amount' })
    expect(amount).toHaveClass('text-destructive')
    expect(amount).not.toHaveClass('text-foreground')
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveClass(
      'text-foreground'
    )
  })

  it('merges a column className onto that column body cells only', () => {
    render(
      <DataTable
        columns={[
          { accessorKey: 'name', header: 'Name' },
          {
            accessorKey: 'amount',
            header: 'Amount',
            meta: { className: 'whitespace-nowrap' }
          }
        ]}
        data={rows}
        getRowId={getRowId}
      />
    )

    expect(screen.getByText('1250')).toHaveClass('whitespace-nowrap')
    expect(screen.getByText('Alpha')).not.toHaveClass('whitespace-nowrap')
  })

  it('lets a column emit its own cell, with head and body still agreeing on cell count', () => {
    const { container } = render(
      <DataTable
        columns={[
          { accessorKey: 'name', header: 'Name' },
          {
            id: 'own',
            header: 'Own',
            size: 120,
            // align and className have no element of the table's to land on
            // once the column owns its `<td>`; both are ignored on purpose.
            meta: {
              renderOwnCell: true,
              align: 'right',
              className: 'whitespace-nowrap'
            },
            cell: ({ row }) => <td data-testid="own">{row.original.id}</td>
          }
        ]}
        data={rows}
        getRowId={getRowId}
      />
    )

    const headCount = container.querySelectorAll('thead th').length
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2)
    container.querySelectorAll('tbody tr').forEach((row) => {
      expect(row.querySelectorAll('td')).toHaveLength(headCount)
    })

    const own = screen.getAllByTestId('own')
    expect(own).toHaveLength(2)
    expect(own[0]).toHaveTextContent('alpha')
    expect(own[0]).not.toHaveClass('text-right')
    expect(own[0]).not.toHaveClass('whitespace-nowrap')
    // The head keeps the declared width so an auto-layout table still sizes
    // the column; the body cell is the consumer's and carries none of it.
    expect(screen.getByRole('columnheader', { name: 'Own' })).toHaveStyle({
      width: '120px'
    })
    expect(own[0].style.width).toBe('')
  })

  /**
   * The split is by ELEMENT, not by column. A money column that owns its
   * `<td>` still declares `align: 'right'` for its heading, and the `<th>` is
   * the table's to style — so the header alignment has to be pinned, or a
   * later "align is ignored for renderOwnCell" reading silently left-aligns
   * every own-cell money heading over its right-aligned figures.
   */
  it('still aligns and dresses the head of a column that owns its cell', () => {
    render(
      <DataTable
        columns={[
          { accessorKey: 'name', header: 'Name' },
          {
            id: 'own',
            header: 'Amount',
            meta: {
              renderOwnCell: true,
              align: 'right',
              headerClassName: 'whitespace-nowrap',
              className: 'text-destructive'
            },
            cell: ({ row }) => (
              <td data-testid="own" className="text-right">
                {row.original.amount}
              </td>
            )
          }
        ]}
        data={rows}
        getRowId={getRowId}
      />
    )

    const head = screen.getByRole('columnheader', { name: 'Amount' })
    expect(head).toHaveClass('text-right', 'whitespace-nowrap')

    // The body cell is the consumer's: it carries only what the consumer put
    // on it, and none of the table's column classes.
    const own = screen.getAllByTestId('own')[0]
    expect(own).toHaveClass('text-right')
    expect(own).not.toHaveClass('text-destructive')
  })

  it('keeps the kit selection cell wrapped beside a column that owns its cell', () => {
    const { container } = render(
      <DataTable
        columns={[
          { accessorKey: 'name', header: 'Name' },
          {
            id: 'own',
            header: 'Own',
            meta: { renderOwnCell: true },
            cell: ({ row }) => <td data-testid="own">{row.original.id}</td>
          }
        ]}
        data={rows}
        getRowId={getRowId}
        enableRowSelection
        rowSelection={{}}
        onRowSelectionChange={jest.fn()}
      />
    )

    const headCount = container.querySelectorAll('thead th').length
    expect(headCount).toBe(3)
    container.querySelectorAll('tbody tr').forEach((row) => {
      expect(row.querySelectorAll('td')).toHaveLength(headCount)
    })
    expect(
      screen.getByRole('checkbox', { name: 'Select row alpha' }).closest('td')
    ).not.toBeNull()
  })
})

/**
 * Column visibility: a listing whose own dropdown hides a column had nowhere to
 * send the result. TanStack's visibility model is always running inside the
 * table, but the state was unreachable from the page, so a console screen could
 * only fake a hidden column by rebuilding its column array. Frozen by plan
 * 2026-09-21-console-simplification C9.
 */
describe('DataTable column visibility', () => {
  const visibilityColumns: ColumnDef<LedgerRow, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    { id: 'status', accessorKey: 'id', header: 'Status' },
    { accessorKey: 'amount', header: 'Amount' }
  ]

  it('hides a column from head and body', () => {
    const { container } = render(
      <DataTable
        columns={visibilityColumns}
        data={rows}
        getRowId={getRowId}
        columnVisibility={{ status: false }}
      />
    )

    expect(screen.queryByRole('columnheader', { name: 'Status' })).toBeNull()
    expect(screen.queryByText('alpha')).toBeNull()

    const headCount = container.querySelectorAll('thead th').length
    expect(headCount).toBe(2)
    container.querySelectorAll('tbody tr').forEach((row) => {
      expect(row.querySelectorAll('td')).toHaveLength(headCount)
    })
  })

  it('counts only the visible columns in the skeleton and the empty span', () => {
    const { container, rerender } = render(
      <DataTable
        columns={visibilityColumns}
        data={[]}
        loading
        skeletonRows={2}
        columnVisibility={{ status: false }}
      />
    )

    container.querySelectorAll('tbody tr').forEach((row) => {
      expect(row.querySelectorAll('td')).toHaveLength(2)
    })

    rerender(
      <DataTable
        columns={visibilityColumns}
        data={[]}
        columnVisibility={{ status: false }}
      />
    )

    expect(container.querySelector('tbody td')).toHaveAttribute('colspan', '2')
  })

  it('renders every column when the prop is omitted', () => {
    render(
      <DataTable columns={visibilityColumns} data={rows} getRowId={getRowId} />
    )

    expect(
      screen.getAllByRole('columnheader').map((h) => h.textContent)
    ).toEqual(['Name', 'Status', 'Amount'])
  })

  it('sends a table-driven toggle to the consumer updater', () => {
    const onColumnVisibilityChange = jest.fn()
    render(
      <DataTable
        columns={[
          { accessorKey: 'name', header: 'Name' },
          {
            id: 'status',
            accessorKey: 'id',
            header: ({ column }) => (
              <button
                type="button"
                onClick={() => column.toggleVisibility(false)}
              >
                Status
              </button>
            )
          }
        ]}
        data={rows}
        getRowId={getRowId}
        columnVisibility={{}}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Status' }))

    expect(onColumnVisibilityChange).toHaveBeenCalledTimes(1)
  })

  it('keeps the feature updater when a page passes state and no updater', () => {
    let seen: unknown = 'unread'
    render(
      <DataTable
        columns={[
          {
            accessorKey: 'name',
            header: ({ table }) => {
              seen = table.options.onColumnVisibilityChange
              return 'Name'
            }
          }
        ]}
        data={rows}
        getRowId={getRowId}
        columnVisibility={{}}
      />
    )

    // `'onColumnVisibilityChange' in table.options` cannot tell the two cases
    // apart: TanStack's ColumnVisibility feature puts that key in its own
    // `defaultOptions`, so it is present either way. The VALUE is the pin.
    // Guarding the updater on the STATE spread `{ onColumnVisibilityChange:
    // undefined }` into the options for exactly this arm — the shipped console
    // usage, where a dropdown outside the table owns the state — and
    // `setColumnVisibility` reads a null updater and returns, so
    // `column.toggleVisibility()` went quietly dead.
    expect(typeof seen).toBe('function')
  })

  it('takes the state alone, and refuses the updater alone', () => {
    // A separate dropdown owning the state and passing no updater is the
    // shipped console usage, so it has to keep compiling.
    const stateAlone: DataTableProps<LedgerRow> = {
      columns: visibilityColumns,
      data: rows,
      columnVisibility: { status: false }
    }

    // TanStack reads an `on*Change` callback as a declaration of controlled
    // state, so an updater with no `columnVisibility` freezes visibility at its
    // initial value while the callback keeps firing.
    // @ts-expect-error the updater alone is unrepresentable — plan 2026-09-21-console-simplification C9
    const updaterAlone: DataTableProps<LedgerRow> = {
      columns: visibilityColumns,
      data: rows,
      onColumnVisibilityChange: jest.fn()
    }

    expect(stateAlone.columnVisibility).toEqual({ status: false })
    expect(updaterAlone.onColumnVisibilityChange).toBeDefined()
  })
})

/**
 * A TABLE NOBODY CONTROLS LOST ITS OWN VISIBILITY STATE.
 *
 * Forwarding `columnVisibility` and `onColumnVisibilityChange` on every render
 * put both keys in the options object holding `undefined`, and TanStack merges
 * options and state as plain spreads — so the `undefined` updater overwrote the
 * feature default and `setColumnVisibility` became a no-op, while the
 * `undefined` state slice overwrote the table's own `{}`. A column header
 * carrying its own hide control stopped working, silently, in every table that
 * asked for neither prop.
 */
describe('DataTable uncontrolled column visibility', () => {
  const selfHidingColumns: ColumnDef<LedgerRow, unknown>[] = [
    { accessorKey: 'name', header: 'Name' },
    {
      id: 'status',
      accessorKey: 'id',
      header: ({ column }) => (
        <button type="button" onClick={() => column.toggleVisibility(false)}>
          Status
        </button>
      )
    }
  ]

  it('hides a column from an in-table toggle when neither prop is given', () => {
    render(
      <DataTable columns={selfHidingColumns} data={rows} getRowId={getRowId} />
    )

    expect(screen.getAllByRole('columnheader')).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Status' }))

    expect(screen.queryByRole('button', { name: 'Status' })).toBeNull()
    expect(screen.getAllByRole('columnheader')).toHaveLength(1)
  })

  it('reads an empty visibility state, never undefined, when neither prop is given', () => {
    let seen: unknown = 'unread'
    render(
      <DataTable
        columns={[
          {
            accessorKey: 'name',
            header: ({ table }) => {
              seen = table.getState().columnVisibility
              return 'Name'
            }
          }
        ]}
        data={rows}
        getRowId={getRowId}
      />
    )

    // A consumer reading the slice in a header renderer gets `{}` as TanStack
    // initialises it; `undefined` crashes `Object.keys` in their code.
    expect(seen).toEqual({})
  })
})
