import { render, screen } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { VirtualizedTable } from '.'

type Tick = { id: number; label: string }

const columns: ColumnDef<Tick, unknown>[] = [
  { accessorKey: 'id', header: 'Id' },
  { accessorKey: 'label', header: 'Label' }
]

const data: Tick[] = Array.from({ length: 5000 }, (_, i) => ({
  id: i,
  label: `row-${i}`
}))

const VIEWPORT_HEIGHT = 480
const ROW_HEIGHT = 40

/**
 * jsdom has no layout engine and no ResizeObserver, so a virtualizer measures a
 * 0px viewport and renders zero rows. Give the scroll container a real height so
 * the windowing assertions below are about the component, not about jsdom.
 */
function stubLayout() {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver

  // The virtualizer sizes its viewport from offsetWidth/offsetHeight, both of
  // which are hard-coded to 0 in jsdom.
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute('role') === 'rowgroup' ? VIEWPORT_HEIGHT : 0
    }
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get: () => 800
  })
}

describe('VirtualizedTable', () => {
  beforeAll(stubLayout)

  it('exposes the full dataset through ARIA, header row included', () => {
    render(<VirtualizedTable columns={columns} data={data} />)

    const table = screen.getByRole('table')
    // 5000 data rows + the header row.
    expect(table).toHaveAttribute('aria-rowcount', '5001')
    expect(table).toHaveAttribute('aria-colcount', '2')
  })

  it('indexes the header at row 1 and data rows from row 2', () => {
    render(
      <VirtualizedTable
        columns={columns}
        data={data}
        rowHeight={ROW_HEIGHT}
        maxHeight={VIEWPORT_HEIGHT}
      />
    )

    const rows = screen.getAllByRole('row')
    expect(rows[0]).toHaveAttribute('aria-rowindex', '1')
    expect(rows[0]).toContainElement(
      screen.getByRole('columnheader', { name: 'Id' })
    )
    expect(rows[1]).toHaveAttribute('aria-rowindex', '2')
  })

  it('keeps rows as direct accessibility children of their rowgroup', () => {
    const { container } = render(
      <VirtualizedTable
        columns={columns}
        data={data}
        rowHeight={ROW_HEIGHT}
        maxHeight={VIEWPORT_HEIGHT}
      />
    )

    // The spacer sits between the rowgroup and its rows in the DOM; it must be
    // presentational so the accessibility tree still reads rowgroup -> row.
    const viewport = container.querySelector(
      '[data-testid="virtualized-table-viewport"]'
    ) as HTMLElement
    const spacer = viewport.firstElementChild as HTMLElement
    expect(spacer).toHaveAttribute('role', 'presentation')
    expect(spacer.querySelector('[role="row"]')).toBeInTheDocument()
  })

  it('keeps the header legible at a row height smaller than the header', () => {
    render(<VirtualizedTable columns={columns} data={data} rowHeight={32} />)

    // The header must not inherit rowHeight — at 32px its padded uppercase
    // label overflowed its own box.
    const header = screen.getByRole('columnheader', { name: 'Id' })
    expect(header.style.height).toBe('')
    expect(header).toHaveClass('min-h-10')
  })

  it('mounts only the visible window plus overscan, never the whole dataset', () => {
    render(
      <VirtualizedTable
        columns={columns}
        data={data}
        rowHeight={ROW_HEIGHT}
        maxHeight={VIEWPORT_HEIGHT}
      />
    )

    // 480px / 40px = 12 visible rows, + overscan (8) on each side, + the header
    // row. Far below 5000 either way — the point of the component.
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
    expect(rows.length).toBeLessThan(40)

    // The first rows are mounted; rows far past the viewport are not.
    expect(screen.getByText('row-0')).toBeInTheDocument()
    expect(screen.queryByText('row-4999')).toBeNull()
  })

  it('reserves the full scroll height for the entire dataset', () => {
    const { container } = render(
      <VirtualizedTable
        columns={columns}
        data={data}
        rowHeight={ROW_HEIGHT}
        maxHeight={VIEWPORT_HEIGHT}
      />
    )

    const spacer = container.querySelector(
      '[data-testid="virtualized-table-viewport"] > div'
    ) as HTMLElement
    expect(spacer).toHaveStyle({ height: `${5000 * ROW_HEIGHT}px` })
  })

  it('renders the column headers as a sibling rowgroup', () => {
    render(<VirtualizedTable columns={columns} data={data.slice(0, 3)} />)

    expect(screen.getByRole('columnheader', { name: 'Id' })).toBeInTheDocument()
    expect(
      screen.getByRole('columnheader', { name: 'Label' })
    ).toBeInTheDocument()
  })

  it('renders cell content from the column definitions', () => {
    render(<VirtualizedTable columns={columns} data={data.slice(0, 3)} />)
    expect(screen.getByText('row-0')).toBeInTheDocument()
    expect(screen.getByText('row-2')).toBeInTheDocument()
  })

  it('accepts a numeric or string maxHeight', () => {
    const { container, rerender } = render(
      <VirtualizedTable columns={columns} data={data} maxHeight={320} />
    )
    const viewport = () =>
      container.querySelector(
        '[data-testid="virtualized-table-viewport"]'
      ) as HTMLElement
    expect(viewport()).toHaveStyle({ maxHeight: '320px' })

    rerender(
      <VirtualizedTable columns={columns} data={data} maxHeight="60vh" />
    )
    expect(viewport()).toHaveStyle({ maxHeight: '60vh' })
  })

  it('renders an empty dataset without rows', () => {
    render(<VirtualizedTable columns={columns} data={[]} />)

    // Zero data rows, but the header row still counts.
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '1')
    expect(screen.getAllByRole('row')).toHaveLength(1)
  })

  it('re-measures when rowHeight changes', () => {
    const { container, rerender } = render(
      <VirtualizedTable
        columns={columns}
        data={data}
        rowHeight={ROW_HEIGHT}
        maxHeight={VIEWPORT_HEIGHT}
      />
    )

    const spacer = () =>
      (
        container.querySelector(
          '[data-testid="virtualized-table-viewport"]'
        ) as HTMLElement
      ).firstElementChild as HTMLElement

    expect(spacer()).toHaveStyle({ height: `${5000 * ROW_HEIGHT}px` })

    // Without an explicit virtualizer.measure(), the cached per-item sizes keep
    // the spacer at the old total.
    rerender(
      <VirtualizedTable
        columns={columns}
        data={data}
        rowHeight={20}
        maxHeight={VIEWPORT_HEIGHT}
      />
    )
    expect(spacer()).toHaveStyle({ height: `${5000 * 20}px` })
  })
})
