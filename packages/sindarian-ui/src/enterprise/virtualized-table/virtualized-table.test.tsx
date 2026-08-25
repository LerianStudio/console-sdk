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

  it('exposes the full dataset through ARIA', () => {
    render(<VirtualizedTable columns={columns} data={data} />)

    const table = screen.getByRole('table')
    expect(table).toHaveAttribute('aria-rowcount', '5000')
    expect(table).toHaveAttribute('aria-colcount', '2')
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
      '[role="rowgroup"]:last-of-type > div'
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
      container.querySelector('[role="rowgroup"]:last-of-type') as HTMLElement
    expect(viewport()).toHaveStyle({ maxHeight: '320px' })

    rerender(
      <VirtualizedTable columns={columns} data={data} maxHeight="60vh" />
    )
    expect(viewport()).toHaveStyle({ maxHeight: '60vh' })
  })

  it('renders an empty dataset without rows', () => {
    render(<VirtualizedTable columns={columns} data={[]} />)

    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '0')
    // Only the header row remains.
    expect(screen.getAllByRole('row')).toHaveLength(1)
  })
})
