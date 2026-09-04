import { render, screen } from '@testing-library/react'
import type { ColumnDef } from '@tanstack/react-table'
import { VirtualizedTable } from '.'
import { LABEL_VOICE_CLASS } from '@/lib/typography'

type Tick = { id: number; label: string; note: string }

const columns: ColumnDef<Tick, unknown>[] = [
  { accessorKey: 'id', header: 'Id' },
  { accessorKey: 'label', header: 'Label' }
]

const data: Tick[] = Array.from({ length: 5000 }, (_, i) => ({
  id: i,
  label: `row-${i}`,
  note: `note-${i}`
}))

/**
 * Two header depths and two sibling groups of UNEQUAL width: "Identity" spans
 * two leaf columns, "Meta" spans one. Anything that counts top-level defs or
 * sibling positions instead of leaf columns gets the geometry wrong here.
 */
const groupedColumns: ColumnDef<Tick, unknown>[] = [
  {
    id: 'identity',
    header: 'Identity',
    columns: [
      { accessorKey: 'id', header: 'Id' },
      { accessorKey: 'label', header: 'Label' }
    ]
  },
  {
    id: 'meta',
    header: 'Meta',
    columns: [{ accessorKey: 'note', header: 'Note' }]
  }
]

const VIEWPORT_HEIGHT = 480
const ROW_HEIGHT = 40

/**
 * jsdom has no layout engine, so a virtualizer measures a 0px viewport and
 * renders zero rows. Give the scroll container a real height so the windowing
 * assertions below are about the component, not about jsdom. (ResizeObserver
 * itself comes from the shared jest setup in packages/utils.)
 */
function stubLayout() {
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

  it('counts and indexes every header row when columns are grouped', () => {
    render(
      <VirtualizedTable
        columns={groupedColumns}
        data={data}
        rowHeight={ROW_HEIGHT}
        maxHeight={VIEWPORT_HEIGHT}
      />
    )

    // Two header depths: the spanning group row and the leaf row.
    expect(screen.getByRole('table')).toHaveAttribute('aria-rowcount', '5002')

    const rows = screen.getAllByRole('row')
    expect(rows[0]).toHaveAttribute('aria-rowindex', '1')
    expect(rows[0]).toContainElement(
      screen.getByRole('columnheader', { name: 'Identity' })
    )
    expect(rows[1]).toHaveAttribute('aria-rowindex', '2')
    expect(rows[1]).toContainElement(
      screen.getByRole('columnheader', { name: 'Id' })
    )
    // Data rows start after BOTH header rows.
    expect(rows[2]).toHaveAttribute('aria-rowindex', '3')
    expect(rows[2]).toHaveTextContent('row-0')
  })

  it('counts LEAF columns, not top-level column defs', () => {
    render(
      <VirtualizedTable
        columns={groupedColumns}
        data={data}
        rowHeight={ROW_HEIGHT}
        maxHeight={VIEWPORT_HEIGHT}
      />
    )

    // Two grouped defs, but three real columns: Id, Label, Note.
    expect(screen.getByRole('table')).toHaveAttribute('aria-colcount', '3')
  })

  it('positions spanning headers by their first leaf column', () => {
    render(
      <VirtualizedTable
        columns={groupedColumns}
        data={data}
        rowHeight={ROW_HEIGHT}
        maxHeight={VIEWPORT_HEIGHT}
      />
    )

    const identity = screen.getByRole('columnheader', { name: 'Identity' })
    const meta = screen.getByRole('columnheader', { name: 'Meta' })

    expect(identity).toHaveAttribute('aria-colindex', '1')
    expect(identity).toHaveAttribute('aria-colspan', '2')
    // "Meta" is the SECOND sibling but starts at the THIRD column — indexing by
    // sibling position would report 2 here.
    expect(meta).toHaveAttribute('aria-colindex', '3')
    expect(meta).not.toHaveAttribute('aria-colspan')

    // The leaf row tiles the same three positions.
    expect(screen.getByRole('columnheader', { name: 'Id' })).toHaveAttribute(
      'aria-colindex',
      '1'
    )
    expect(screen.getByRole('columnheader', { name: 'Label' })).toHaveAttribute(
      'aria-colindex',
      '2'
    )
    expect(screen.getByRole('columnheader', { name: 'Note' })).toHaveAttribute(
      'aria-colindex',
      '3'
    )
  })

  it('sizes a spanning header to cover its leaf columns', () => {
    render(
      <VirtualizedTable
        columns={groupedColumns}
        data={data}
        rowHeight={ROW_HEIGHT}
        maxHeight={VIEWPORT_HEIGHT}
      />
    )

    // Two shares for the two-leaf group, one for the single-leaf group, so the
    // header rule lines up with the cells beneath it.
    expect(screen.getByRole('columnheader', { name: 'Identity' })).toHaveStyle({
      flex: '2 1 0%'
    })
    expect(screen.getByRole('columnheader', { name: 'Meta' })).toHaveStyle({
      flex: '1 1 0%'
    })
    expect(screen.getByRole('columnheader', { name: 'Id' })).toHaveStyle({
      flex: '1 1 0%'
    })
  })

  it('keeps flat columns at one column each', () => {
    render(<VirtualizedTable columns={columns} data={data.slice(0, 3)} />)

    expect(screen.getByRole('table')).toHaveAttribute('aria-colcount', '2')
    const id = screen.getByRole('columnheader', { name: 'Id' })
    expect(id).toHaveAttribute('aria-colindex', '1')
    expect(id).not.toHaveAttribute('aria-colspan')
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

/**
 * Both of the kit's table render paths must speak ONE column-head voice, with
 * ONE override seam. DataTable already renders LABEL_VOICE_CLASS and takes
 * `headClassName`; VirtualizedTable hard-coded `tracking-wide uppercase` on its
 * `div[role=columnheader]` with no seam at all, so a screen that used both
 * (entity-table switches between them) shouted in two different registers and
 * could only quiet one of them. The shared voice is now product-console's
 * table head, so the override that proves the seam swaps size and ink rather
 * than case and tracking.
 */
describe('VirtualizedTable header voice', () => {
  beforeAll(stubLayout)

  it('speaks the shared label voice by default', () => {
    render(<VirtualizedTable columns={columns} data={data} />)

    expect(screen.getByRole('columnheader', { name: 'Id' })).toHaveClass(
      ...LABEL_VOICE_CLASS.split(' ')
    )
  })

  it('lets headClassName override the voice, as DataTable does', () => {
    render(
      <VirtualizedTable
        columns={columns}
        data={data}
        headClassName="text-foreground text-base"
      />
    )

    const head = screen.getByRole('columnheader', { name: 'Id' })
    expect(head).toHaveClass('text-foreground', 'text-base')
    // tailwind-merge drops the voice tokens the override replaces.
    expect(head).not.toHaveClass('text-muted-foreground', 'text-sm')
  })
})

/**
 * `size` / `minSize` / `maxSize` on a ColumnDef were inert here: every column
 * got an equal `flex` share regardless. A consumer that needed a floor on one
 * column had no way to ask for it, and a declared `minSize` read as an enforced
 * floor that was never applied.
 */
describe('VirtualizedTable column sizing', () => {
  beforeAll(stubLayout)

  const sizedColumns: ColumnDef<Tick, unknown>[] = [
    { accessorKey: 'id', header: 'Id', size: 240, minSize: 120, maxSize: 320 },
    { accessorKey: 'label', header: 'Label' }
  ]

  it('applies a declared size to the header cell', () => {
    render(<VirtualizedTable columns={sizedColumns} data={data} />)

    expect(screen.getByRole('columnheader', { name: 'Id' })).toHaveStyle({
      width: '240px',
      minWidth: '120px',
      maxWidth: '320px'
    })
  })

  it('applies a declared size to the body cells of that column', () => {
    render(
      <VirtualizedTable
        columns={sizedColumns}
        data={data}
        rowHeight={ROW_HEIGHT}
        maxHeight={VIEWPORT_HEIGHT}
      />
    )

    expect(screen.getAllByRole('cell')[0]).toHaveStyle({
      width: '240px',
      minWidth: '120px',
      maxWidth: '320px'
    })
  })

  it('stops a sized column from flexing', () => {
    render(<VirtualizedTable columns={sizedColumns} data={data} />)

    expect(screen.getByRole('columnheader', { name: 'Id' })).toHaveStyle({
      flex: '0 0 auto'
    })
  })

  it('leaves an undeclared column on its equal flex share, unsized', () => {
    render(
      <VirtualizedTable
        columns={sizedColumns}
        data={data}
        rowHeight={ROW_HEIGHT}
        maxHeight={VIEWPORT_HEIGHT}
      />
    )

    const head = screen.getByRole('columnheader', { name: 'Label' })
    expect(head).toHaveStyle({ flex: '1 1 0%' })
    expect(head.style.width).toBe('')
    expect(head.style.minWidth).toBe('')
    expect(head.style.maxWidth).toBe('')

    const cell = screen.getAllByRole('cell')[1]
    expect(cell).toHaveClass('flex-1')
    expect(cell.style.width).toBe('')
  })

  it('renders a table of undeclared columns exactly as before', () => {
    render(<VirtualizedTable columns={columns} data={data} />)

    for (const head of screen.getAllByRole('columnheader')) {
      expect(head).toHaveStyle({ flex: '1 1 0%' })
      expect(head.style.width).toBe('')
      expect(head.style.minWidth).toBe('')
      expect(head.style.maxWidth).toBe('')
    }
  })
})
