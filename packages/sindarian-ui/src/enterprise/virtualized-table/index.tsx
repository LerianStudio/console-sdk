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

import { cn } from '@/lib/utils'

export type VirtualizedTableProps<TData> = {
  /** Same shape as DataTable: standard TanStack `ColumnDef<T>`. */
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
}

/** Rows rendered just outside the viewport to keep fast scrolls smooth. */
const OVERSCAN = 8

export function VirtualizedTable<TData>({
  columns,
  data,
  rowHeight = 40,
  maxHeight = 480,
  scrollAreaLabel = 'Scrollable table rows',
  className
}: VirtualizedTableProps<TData>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isScrollable, setIsScrollable] = useState(false)

  // Column count for the div-table's ARIA so screen readers can report
  // "column X of Y"; derived from the columns prop.
  const columnCount = columns.length

  // A number is px; a string is used verbatim (e.g. '60vh').
  const viewportMaxHeight =
    typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  const rows = table.getRowModel().rows

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
      {/* aria-rowcount counts the header row too — it is a row of this table,
          so a reader hearing "row 2 of 5001" is being told the truth. */}
      <div
        role="table"
        aria-rowcount={rows.length + 1}
        aria-colcount={columnCount}
      >
        {/* Header: a sibling above the scroll region, so it stays put by layout
            (it sits above an overflow box) — not via position: sticky. z-10 and
            bg-card keep it visually layered over the scrolling rows. */}
        <div role="rowgroup" className="bg-card z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <div
              key={headerGroup.id}
              role="row"
              aria-rowindex={1}
              className="border-border flex border-b"
            >
              {headerGroup.headers.map((header, i) => (
                <div
                  key={header.id}
                  role="columnheader"
                  aria-colindex={i + 1}
                  // Header height is independent of rowHeight: pinning it to a
                  // small rowHeight (32) clipped the uppercase label against its
                  // own padding. Padding sizes it; min-h keeps a stable rule.
                  className="text-muted-foreground min-h-10 flex-1 px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </div>
              ))}
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
                  // +2, not +1: the header occupies aria-rowindex 1.
                  aria-rowindex={virtualItem.index + 2}
                  data-index={virtualItem.index}
                  className="border-border absolute left-0 flex w-full items-center border-b text-sm"
                  style={{
                    height: virtualItem.size,
                    transform: `translateY(${virtualItem.start}px)`
                  }}
                >
                  {row.getVisibleCells().map((cell, i) => (
                    <div
                      key={cell.id}
                      role="cell"
                      aria-colindex={i + 1}
                      className="flex-1 truncate px-4"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
