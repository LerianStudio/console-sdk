'use client'

/**
 * VirtualizedTable — a windowed table for very large, flat datasets.
 *
 * Mirrors DataTable's column/data API (standard TanStack `ColumnDef<T>`, cells
 * receive the row's `original`), so screens reuse the exact same column
 * definitions. The difference is the rendering strategy: where DataTable
 * renders every row, VirtualizedTable renders only the rows inside (and just
 * past) the scroll viewport via `@tanstack/react-virtual`. Tens of thousands of
 * rows stay scroll-smooth because the DOM only ever holds the visible window.
 *
 * Layout is div-based (role="table"/"row"/"cell"), not a real `<table>`:
 * absolute positioning by `virtualItem.start` is incompatible with table
 * layout, so a windowed table cannot use `<tbody>`. The header is a sibling
 * above the scroll region: it stays put by layout (it simply sits above an
 * overflow box), not via `position: sticky`. Inside the scroll container an
 * inner spacer sized to `getTotalSize()` reserves the full scroll height, and
 * each virtual row is absolutely positioned within that spacer.
 *
 * Rows are fixed-height (= `rowHeight`): cell content taller than `rowHeight`
 * will clip — cells use `truncate`. This component is for flat, single-line
 * datasets only; it does NOT measure rows, so it is not suitable for
 * variable-height content.
 *
 * This is deliberately leaner than DataTable: no pagination, selection,
 * keyboard nav, loading or empty affordances — it is the right tool only when
 * the whole dataset is already in memory and the row count is the problem.
 * For server-paged lists, reach for DataTable + CursorPager instead.
 */
import { useEffect, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'

import { LABEL_VOICE_CLASS } from '@/lib/typography'
import { cn } from '@/lib/utils'
import {
  readDeclaredColumnSize,
  readDeclaredGroupSize,
  UNSIZED_DEFAULT_COLUMN
} from '../data-table/column-size'

export type VirtualizedTableProps<TData> = {
  /**
   * Same shape as DataTable: standard TanStack `ColumnDef<T>`. A column that
   * declares none keeps its equal share of the row.
   *
   * Declared sizing does NOT mean the same thing in the kit's two table paths.
   * Here, flex rows PIN all three: `size`, `minSize` and `maxSize` are honoured
   * exactly as declared. DataTable renders real `<th>`/`<td>` under CSS auto
   * table layout, where `size` is only a PREFERRED width, `minSize` a floor,
   * and `maxSize` is ignored outright. A column that must not grow past a width
   * belongs here.
   */
  columns: ColumnDef<TData, unknown>[]
  /** The full dataset, already in memory. Only the visible window renders. */
  data: TData[]
  /**
   * Row height in px, fed to the virtualizer's `estimateSize`. Rows are
   * rendered at this FIXED height — content taller than `rowHeight` will clip
   * (cells use `truncate`). Use only for flat, single-line rows; this is not a
   * variable-height table. Defaults to 40.
   */
  rowHeight?: number
  /**
   * Max height of the scroll viewport (the inner overflow container, NOT the
   * outer wrapper). A `number` is treated as px; a `string` is used verbatim
   * (e.g. `'60vh'`). Defaults to `480` → `480px`.
   */
  maxHeight?: number | string
  /** Accessible name announced for the viewport while it is scrollable. */
  scrollAreaLabel?: string
  /** Applied to the outer wrapper (the scroll container's parent). */
  className?: string
  /**
   * Extra classes merged onto every header cell, after the kit label voice —
   * the same seam DataTable exposes, so a screen that switches between the two
   * render paths quiets both column heads with one prop instead of one.
   */
  headClassName?: string
}

/** Rows rendered just outside the viewport to keep fast scrolls smooth. */
const OVERSCAN = 8

export function VirtualizedTable<TData>({
  columns,
  data,
  rowHeight = 40,
  maxHeight = 480,
  scrollAreaLabel = 'Scrollable table rows',
  className,
  headClassName
}: VirtualizedTableProps<TData>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)

  // A number is px; a string is used verbatim (e.g. '60vh').
  const viewportMaxHeight =
    typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight

  const table = useReactTable({
    data,
    columns,
    // Keeps `columnDef.size`/`minSize`/`maxSize` meaning "declared" — see
    // ../data-table/column-size. `getSize()` is unaffected; it falls back to
    // the library defaults itself.
    defaultColumn: UNSIZED_DEFAULT_COLUMN,
    getCoreRowModel: getCoreRowModel()
  })

  const rows = table.getRowModel().rows
  // Grouped columns (a ColumnDef with nested `columns`) render one header row
  // per depth level, so the header is not always a single row.
  const headerGroups = table.getHeaderGroups()
  const headerRowCount = headerGroups.length

  // The table's real column geometry is its LEAF columns: a grouped ColumnDef
  // contributes one spanning header cell but no column of its own, so counting
  // top-level defs both under-reports aria-colcount and misplaces every
  // aria-colindex to its right.
  const leafColumns = table.getVisibleLeafColumns()
  const leafPosition = new Map(leafColumns.map((column, i) => [column.id, i]))

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: OVERSCAN
  })

  const virtualRows = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  // `estimateSize` is read through a closure the virtualizer caches per item, so
  // changing rowHeight leaves every already-measured row at its old size until
  // the cache is dropped explicitly.
  useEffect(() => {
    virtualizer.measure()
  }, [rowHeight, virtualizer])

  useEffect(() => {
    const viewport = scrollRef.current
    if (!viewport) return

    const updateScrollability = () => {
      const nextIsScrollable =
        viewport.scrollHeight > viewport.clientHeight ||
        viewport.scrollWidth > viewport.clientWidth

      setIsScrollable((current) =>
        current === nextIsScrollable ? current : nextIsScrollable
      )
    }

    updateScrollability()

    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(updateScrollability)
    observer.observe(viewport)

    const content = viewport.firstElementChild
    if (content) observer.observe(content)

    return () => observer.disconnect()
  }, [totalSize, viewportMaxHeight])

  return (
    <div
      className={cn(
        'border-border bg-card text-card-foreground rounded-lg border',
        className
      )}
    >
      {/* aria-rowcount counts the header rows too — they are rows of this
          table, so a reader hearing "row 3 of 5002" is being told the truth. */}
      <div
        role="table"
        aria-rowcount={rows.length + headerRowCount}
        aria-colcount={leafColumns.length}
      >
        {/* Header: a sibling above the scroll region, so it stays put by layout
            (it sits above an overflow box) — not via position: sticky. z-10 and
            bg-card keep it visually layered over the scrolling rows. */}
        <div role="rowgroup" className="bg-card z-10">
          {headerGroups.map((headerGroup, groupIndex) => (
            <div
              key={headerGroup.id}
              role="row"
              // Positional: with grouped columns the header spans several rows.
              aria-rowindex={groupIndex + 1}
              className="border-border flex border-b"
            >
              {headerGroup.headers.map((header) => {
                // Anchor the cell on its leftmost leaf column, so a spanning
                // group reports the column it actually starts at rather than
                // its position among its siblings.
                const firstLeaf = header.column.getLeafColumns()[0]
                const start = leafPosition.get(
                  firstLeaf?.id ?? header.column.id
                )
                // A group header spans leaf columns whose body cells carry
                // their own widths, so its size comes from those leaves, not
                // from the group def (which declares nothing). A leaf header
                // reads its own column, as before.
                const size =
                  header.subHeaders.length > 0
                    ? readDeclaredGroupSize(header.column.getLeafColumns())
                    : readDeclaredColumnSize(header.column)
                return (
                  <div
                    key={header.id}
                    role="columnheader"
                    aria-colindex={(start ?? 0) + 1}
                    // A group cell covers colSpan leaf columns — announce it,
                    // and give it that many shares of the row so it lines up
                    // with the leaf cells beneath it.
                    aria-colspan={
                      header.colSpan > 1 ? header.colSpan : undefined
                    }
                    // A declared width must not be flexed away; without one the
                    // cell keeps its colSpan share of the row, as before.
                    style={
                      size?.width === undefined
                        ? { flex: `${header.colSpan} 1 0%`, ...size }
                        : { flex: '0 0 auto', ...size }
                    }
                    // Header height is independent of rowHeight: pinning it to a
                    // small rowHeight (32) clipped the uppercase label against its
                    // own padding. Padding sizes it; min-h keeps a stable rule.
                    className={cn(
                      'min-h-10 px-4 py-2.5 text-left',
                      LABEL_VOICE_CLASS,
                      headClassName
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Fixed-height scroll container. Only the windowed rows below are in
            the DOM at any time, regardless of how large `data` is. */}
        <div
          ref={scrollRef}
          role="rowgroup"
          data-testid="virtualized-table-viewport"
          aria-label={isScrollable ? scrollAreaLabel : undefined}
          tabIndex={isScrollable ? 0 : undefined}
          className="focus-visible:ring-ring relative overflow-auto focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          style={{ maxHeight: viewportMaxHeight }}
        >
          {/* Spacer sized to the full virtual height so the scrollbar reflects
              the entire dataset while rows are absolutely positioned. It is
              role="presentation" so it drops out of the accessibility tree and
              the rows stay DIRECT children of the rowgroup — an unlabelled
              generic between a rowgroup and its rows breaks the table mapping. */}
          <div
            role="presentation"
            className="relative w-full"
            style={{ height: totalSize }}
          >
            {virtualRows.map((virtualItem) => {
              const row = rows[virtualItem.index]
              return (
                <div
                  key={row.id}
                  role="row"
                  // Offset past the header rows, which occupy indices
                  // 1..headerRowCount.
                  aria-rowindex={virtualItem.index + headerRowCount + 1}
                  data-index={virtualItem.index}
                  className="border-border absolute left-0 flex w-full items-center border-b text-sm"
                  style={{
                    height: virtualItem.size,
                    transform: `translateY(${virtualItem.start}px)`
                  }}
                >
                  {row.getVisibleCells().map((cell, i) => {
                    const size = readDeclaredColumnSize(cell.column)
                    return (
                      <div
                        key={cell.id}
                        role="cell"
                        aria-colindex={i + 1}
                        // An inline `flex` beats the class, so a sized column
                        // stops flexing while every other column renders
                        // exactly as it did before.
                        style={
                          size?.width === undefined
                            ? size
                            : { flex: '0 0 auto', ...size }
                        }
                        className="flex-1 truncate px-4"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
