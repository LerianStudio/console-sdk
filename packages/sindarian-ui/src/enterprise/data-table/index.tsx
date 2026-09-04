'use client'

/**
 * DataTable — a typed, generic wrapper over TanStack Table v8.
 *
 * Pairs with CursorPager (server-driven pagination): pass the page's `items`
 * as `data`; this component does no client-side paging or sorting by default.
 * It owns the three render states the list screens need:
 *   - loading  → header + skeleton rows
 *   - empty    → EmptyState (data resolved, zero rows)
 *   - data     → semantic table rows; cells own any links/actions
 *
 * Column heads speak the kit's LABEL_VOICE_CLASS; `headClassName` overrides it
 * per table. An optional `footer` node renders in a `tfoot` for footed totals.
 *
 * Columns are standard TanStack `ColumnDef<T>`; cells receive the row's
 * `original` value, so screens compose money / date / status cells directly in
 * their column `cell` renderers.
 *
 * Declared column sizing (see `./column-size`) does NOT mean the same thing in
 * the kit's two table paths, because their layouts differ:
 *   - DataTable renders real `<th>`/`<td>` under CSS AUTO table layout (the
 *     `Table` primitive sets no `table-fixed`). There, `size` is a PREFERRED
 *     width the browser may exceed to fit content, `minSize` acts as a floor,
 *     and `maxSize` is ignored outright — Chrome and Firefox do not apply
 *     `max-width` to table cells. A column declaring none keeps auto width.
 *   - VirtualizedTable renders flex rows, where all three PIN: `size`,
 *     `minSize` and `maxSize` are honoured exactly as declared.
 * So a column that must not grow past a width belongs in VirtualizedTable, or
 * in a cell renderer that truncates its own content.
 *
 * Row selection is opt-in and controlled: pass `enableRowSelection` plus
 * `rowSelection` / `onRowSelectionChange` (TanStack-native types). When
 * enabled, a checkbox column is prepended — header checkbox selects the
 * page (indeterminate for partial), checkbox-cell clicks never bubble to
 * row-level handlers. With the flag off (the default), nothing changes.
 *
 * Keyboard navigation is opt-in via `onRowActivate`: when present, rows get
 * a roving tabindex (Tab enters the table once at the anchor row; the next
 * Tab moves to the row's first tabbable child if it has one, otherwise out
 * of the table — no trap), ArrowUp/Down move row focus clamped to the page,
 * Home/End jump to the page edges, Enter activates the row through the
 * callback, and Space toggles selection when `enableRowSelection` is on.
 * Cmd/Ctrl+Enter opens the row's destination in a new tab when the optional
 * `rowHref` builder is provided (window.open with noopener,noreferrer);
 * without it, modified Enter stays a deliberate no-op — never a same-tab
 * activation. Keydown events originating from interactive children (links,
 * buttons, checkboxes, form fields) are never hijacked.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type Row,
  type RowData,
  type RowSelectionState,
  type Table as TanstackTable
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { LABEL_VOICE_CLASS } from '@/lib/typography'
import { cn } from '@/lib/utils'
import { EmptyState, type EmptyStateProps } from '../empty-state'
import { readPreferredColumnSize } from './column-size'

/**
 * Per-column opt-in for ledger numeric alignment. Set `meta: { numeric: true }`
 * on a money/number `ColumnDef` and DataTable right-aligns both the header and
 * its body cells (mono tabular figures).
 */
declare module '@tanstack/react-table' {
  // Type parameters mirror TanStack's own ColumnMeta declaration exactly, which
  // declaration merging requires; neither is referenced by this member.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    numeric?: boolean
  }
}

/**
 * Row selection is CONTROLLED-ONLY — the contract sindarian-x shipped: the
 * component holds no selection state and only mirrors `rowSelection` back into
 * TanStack. Legacy typed all three props as independently optional, so opting
 * into `enableRowSelection` without wiring the other two compiled fine and then
 * rendered checkboxes that could never toggle (state pinned to a constant `{}`,
 * no updater). Same runtime contract here, honest types: enabling selection
 * requires the controlled pair, and leaving it off forbids them.
 */
type RowSelectionProps<TData> =
  | {
      enableRowSelection?: false
      rowSelection?: never
      onRowSelectionChange?: never
      getRowSelectionLabel?: never
    }
  | {
      enableRowSelection: true
      /** Controlled selection state (TanStack `RowSelectionState`, keyed by row id). */
      rowSelection: RowSelectionState
      /** Controlled selection updater (TanStack `OnChangeFn`). */
      onRowSelectionChange: OnChangeFn<RowSelectionState>
      /**
       * Accessible name for a row's checkbox. Defaults to `Select row <id>`,
       * which announces the raw row id (`Select row 0` with the default index
       * ids) — pass a builder to name the record the way a user recognises it,
       * e.g. ``(row) => `Select settlement ${row.reference}` ``.
       */
      getRowSelectionLabel?: (row: TData) => string
    }

type DataTableBaseProps<TData> = {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  /** Show skeleton rows instead of data/empty state. */
  loading?: boolean
  /** Number of skeleton rows when loading. Defaults to 8. */
  skeletonRows?: number
  /** Announced by the persistent status region while loading. Defaults to "Loading table rows". */
  loadingLabel?: string
  /** Empty-state config when data resolves to zero rows. */
  empty?: EmptyStateProps
  /** Stable row id accessor; defaults to TanStack's index-based id. */
  getRowId?: (row: TData, index: number) => string
  /**
   * Drop the rounded-card framing (radius, hairline border, bg-card) so the
   * table runs full-bleed inside an already-framed surface. Margin tweaks like
   * `-mx-5` stay the caller's job via `className`.
   */
  flush?: boolean
  /**
   * Row density. `comfortable` (default) keeps the table's standard padding;
   * `compact` tightens cell padding for the veteran "more rows per screen"
   * view. Applied as a per-cell padding override on THIS table only.
   */
  density?: 'comfortable' | 'compact'
  /**
   * Opt into the roving-focus keyboard layer. Presence of this callback
   * enables row tabIndex/focus/keydown handling; Enter calls it with the
   * focused row's data. DataTable stays router-agnostic — consumers
   * navigate inside the callback. Default off: rows render exactly as
   * before, with no tabIndex and no handlers.
   */
  onRowActivate?: (row: TData) => void
  /**
   * Optional href builder pairing with `onRowActivate`: when present,
   * Cmd/Ctrl+Enter on a focused row opens the built href in a new tab via
   * `window.open(href, '_blank', 'noopener,noreferrer')` — the keyboard twin
   * of cmd-clicking the row's in-cell link. Build hrefs with the router's
   * own URL builder, never string concatenation. Sheet-based tables (no
   * routable destination) simply omit it and keep modified Enter a no-op.
   */
  rowHref?: (row: TData) => string
  className?: string
  /**
   * Extra classes merged onto every header cell, after the kit label voice —
   * so a caller can override the voice's size/tracking/color for one table
   * without restating the cluster. Per-column alignment stays `meta.numeric`.
   */
  headClassName?: string
  /**
   * Footed-total row(s) rendered inside the kit `TableFooter` after the body.
   * The caller supplies the row markup (`<tr><td>…</td></tr>`) so the footer
   * can span, align and format its own figures. Omitted → no `tfoot`.
   */
  footer?: React.ReactNode
}

export type DataTableProps<TData> = DataTableBaseProps<TData> &
  RowSelectionProps<TData>

const SELECTION_COLUMN_ID = '__select__'

const CHECKBOX_CLASS = 'accent-primary block size-4'

/** Right-aligned mono treatment for `meta: { numeric: true }` columns. */
const NUMERIC_CELL_CLASS = 'text-right font-mono tabular-nums'

/**
 * Keydown events whose target sits inside one of these are never hijacked
 * by the row-level keyboard handler — Space in a checkbox and Enter on an
 * in-cell link keep their native behavior.
 */
const INTERACTIVE_CHILD_SELECTOR =
  'a, button, input, select, textarea, [role="checkbox"]'

/**
 * Inset focus outline for keyboard-navigable rows. Outline, not Tailwind
 * ring: ring is box-shadow, which renders unreliably on display: table-row.
 * `focus-visible`-gated, so mouse users (and visual baselines) see nothing.
 */
const ROW_FOCUS_CLASS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'

function stopPropagation(event: React.MouseEvent) {
  event.stopPropagation()
}

function SelectAllCheckbox<TData>({ table }: { table: TanstackTable<TData> }) {
  const allSelected = table.getIsAllPageRowsSelected()
  const someSelected = table.getIsSomePageRowsSelected()

  return (
    <input
      type="checkbox"
      className={CHECKBOX_CLASS}
      aria-label="Select all rows on this page"
      checked={allSelected}
      ref={(el) => {
        if (el) el.indeterminate = !allSelected && someSelected
      }}
      onChange={table.getToggleAllPageRowsSelectedHandler()}
    />
  )
}

function RowSelectionCheckbox<TData>({
  row,
  getLabel
}: {
  row: Row<TData>
  getLabel?: (row: TData) => string
}) {
  return (
    <input
      type="checkbox"
      className={CHECKBOX_CLASS}
      aria-label={getLabel ? getLabel(row.original) : `Select row ${row.id}`}
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onChange={row.getToggleSelectedHandler()}
    />
  )
}

function createSelectionColumn<TData>(
  getLabel?: (row: TData) => string
): ColumnDef<TData, unknown> {
  return {
    id: SELECTION_COLUMN_ID,
    header: ({ table }) => <SelectAllCheckbox table={table} />,
    cell: ({ row }) => <RowSelectionCheckbox row={row} getLabel={getLabel} />
  }
}

export function DataTable<TData>({
  columns,
  data,
  loading = false,
  skeletonRows = 8,
  loadingLabel = 'Loading table rows',
  empty,
  getRowId,
  flush = false,
  density = 'comfortable',
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  getRowSelectionLabel,
  onRowActivate,
  rowHref,
  className,
  headClassName,
  footer
}: DataTableProps<TData>) {
  const tableColumns = useMemo(
    () =>
      enableRowSelection
        ? [createSelectionColumn<TData>(getRowSelectionLabel), ...columns]
        : columns,
    [columns, enableRowSelection, getRowSelectionLabel]
  )

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    enableRowSelection,
    // Controlled-only, exactly as sindarian-x shipped it: this component holds
    // no selection state. The `?? {}` is the JS-consumer safety net; the prop
    // types make the TS path require the controlled pair whenever selection is
    // enabled, so the dead-checkbox configuration is now unrepresentable.
    onRowSelectionChange: enableRowSelection ? onRowSelectionChange : undefined,
    state: {
      rowSelection: enableRowSelection ? (rowSelection ?? {}) : undefined
    }
  })

  const colCount = tableColumns.length
  const dataRows = table.getRowModel().rows
  const rowCount = dataRows.length

  // Compact density overrides only THIS table's cell padding (tailwind-merge
  // lets the later utility win over TableHead/TableCell's defaults).
  // Comfortable passes nothing, so the default render is unchanged.
  const compact = density === 'compact'
  const headDensityClass = compact ? 'h-8 px-2' : undefined
  const cellDensityClass = compact ? 'px-2 py-1.5' : undefined

  // --- Roving row focus (active only when onRowActivate is provided) ---
  const keyboardNav = onRowActivate !== undefined
  const [focusedIndex, setFocusedIndex] = useState(0)
  // ponytail: rowRefs is keyed by render index, while rows are id-keyed
  // (`key={row.id}`). This holds only because DataTable is server-driven with
  // no in-place client reorder, and React 19's per-render ref cleanup defuses
  // stale entries. If client-side reorder is ever added, re-key this Map by
  // row.id to keep focus targets aligned with their rows.
  const rowRefs = useRef(new Map<number, HTMLTableRowElement>())
  const focusWithinRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Render-time clamp: exactly one anchor row (tabIndex=0) even on the
  // frame where data shrank but state has not caught up yet.
  const anchorIndex = rowCount > 0 ? Math.min(focusedIndex, rowCount - 1) : 0

  // Data changes clamp the anchor but never steal focus: DOM focus moves
  // only if focus was already inside the table and the focused row vanished
  // (e.g. page flip removed it). Never autofocus on mount.
  useEffect(() => {
    if (!keyboardNav) return
    // Clamp the focus target ONCE and drive both the state setter and the
    // .focus() call from the same value — reading `focusedIndex` separately
    // after the functional update would use the stale pre-clamp closure value
    // and try to focus an unmounted row, dropping focus to <body>.
    const max = Math.max(rowCount - 1, 0)
    const target = Math.min(focusedIndex, max)
    setFocusedIndex(target)
    if (!focusWithinRef.current) return
    const active = document.activeElement
    if (active && containerRef.current?.contains(active)) return
    // The target row may have unmounted on a data-shrink frame; walk down to
    // the nearest existing lower index, falling back to the container, so
    // focus never escapes the table.
    for (let i = target; i >= 0; i--) {
      const rowEl = rowRefs.current.get(i)
      if (rowEl) {
        rowEl.focus()
        return
      }
    }
    containerRef.current?.focus()
  }, [keyboardNav, rowCount, focusedIndex, data])

  const focusRow = (index: number) => {
    rowRefs.current.get(index)?.focus()
  }

  const handleRowBlur = (event: React.FocusEvent<HTMLTableRowElement>) => {
    const next = event.relatedTarget as Node | null
    if (!next || !containerRef.current?.contains(next)) {
      focusWithinRef.current = false
    }
  }

  const handleRowKeyDown = (
    event: React.KeyboardEvent<HTMLTableRowElement>,
    row: Row<TData>,
    rowIndex: number
  ) => {
    const target = event.target as HTMLElement
    if (
      target !== event.currentTarget &&
      target.closest(INTERACTIVE_CHILD_SELECTOR) !== null
    ) {
      return
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        focusRow(Math.min(rowIndex + 1, rowCount - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        focusRow(Math.max(rowIndex - 1, 0))
        break
      case 'Home':
        event.preventDefault()
        focusRow(0)
        break
      case 'End':
        event.preventDefault()
        focusRow(rowCount - 1)
        break
      case 'Enter':
        // Modified Enter (Cmd/Ctrl) means "open elsewhere" — a same-tab
        // activation would destroy the user's context. With rowHref it
        // opens the row's destination in a new tab; without it (sheet-based
        // tables), it stays a deliberate no-op.
        if (event.metaKey || event.ctrlKey) {
          if (rowHref) {
            window.open(rowHref(row.original), '_blank', 'noopener,noreferrer')
          }
          break
        }
        onRowActivate?.(row.original)
        break
      case ' ':
        if (enableRowSelection && row.getCanSelect()) {
          event.preventDefault()
          row.getToggleSelectedHandler()(event)
        }
        break
      default:
        break
    }
  }

  return (
    <div
      ref={containerRef}
      // tabIndex={-1} (keyboard-nav only) makes the container programmatically
      // focusable so the focus-restoration fallback can land here when every
      // row has unmounted, keeping focus inside the table rather than on <body>.
      tabIndex={keyboardNav ? -1 : undefined}
      className={cn(
        !flush &&
          'border-border bg-card text-card-foreground rounded-lg border',
        className
      )}
    >
      {/* Persistent status region: stays mounted so its text-content changes are
          announced. An unmounting live region announces nothing on the way out,
          so completion (the row count) would otherwise be silent. */}
      <span className="sr-only" role="status">
        {loading
          ? loadingLabel
          : rowCount === 0
            ? 'No rows'
            : `${rowCount} rows`}
      </span>
      <Table aria-busy={loading ? 'true' : undefined}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const numeric = header.column.columnDef.meta?.numeric
                return (
                  <TableHead
                    key={header.id}
                    align={numeric ? 'right' : undefined}
                    // Only a column that DECLARED sizing gets an inline width;
                    // everything else keeps the auto table layout it has today.
                    style={readPreferredColumnSize(header.column)}
                    className={cn(
                      LABEL_VOICE_CLASS,
                      headDensityClass,
                      header.column.id === SELECTION_COLUMN_ID && 'w-10',
                      headClassName
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <TableRow
                key={`skeleton-${rowIndex}`}
                className="hover:bg-transparent"
              >
                {Array.from({ length: colCount }).map((__, cellIndex) => (
                  <TableCell
                    key={`skeleton-${rowIndex}-${cellIndex}`}
                    className={cellDensityClass}
                  >
                    <Skeleton className="h-4 w-full max-w-[160px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rowCount === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colCount} className="p-0">
                <EmptyState
                  title={empty?.title ?? 'Nothing here yet'}
                  description={empty?.description}
                  icon={empty?.icon}
                  action={empty?.action}
                  // The DataTable renders the ledger register grammar, so its
                  // empty surface reads as a ruled page rather than a centered
                  // void. Callers can still override via `empty.ruled = false`.
                  ruled={empty?.ruled ?? true}
                />
              </TableCell>
            </TableRow>
          ) : (
            dataRows.map((row, rowIndex) => (
              <TableRow
                key={row.id}
                ref={
                  keyboardNav
                    ? (el) => {
                        if (el) rowRefs.current.set(rowIndex, el)
                        else rowRefs.current.delete(rowIndex)
                      }
                    : undefined
                }
                tabIndex={
                  keyboardNav ? (rowIndex === anchorIndex ? 0 : -1) : undefined
                }
                onFocus={
                  keyboardNav
                    ? () => {
                        focusWithinRef.current = true
                        setFocusedIndex(rowIndex)
                      }
                    : undefined
                }
                onBlur={keyboardNav ? handleRowBlur : undefined}
                onKeyDown={
                  keyboardNav
                    ? (event) => handleRowKeyDown(event, row, rowIndex)
                    : undefined
                }
                className={keyboardNav ? ROW_FOCUS_CLASS : undefined}
                data-state={
                  enableRowSelection && row.getIsSelected()
                    ? 'selected'
                    : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={readPreferredColumnSize(cell.column)}
                    className={cn(
                      cell.column.columnDef.meta?.numeric && NUMERIC_CELL_CLASS,
                      cellDensityClass,
                      cell.column.id === SELECTION_COLUMN_ID && 'w-10'
                    )}
                    onClick={
                      cell.column.id === SELECTION_COLUMN_ID
                        ? stopPropagation
                        : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
        {footer ? <TableFooter>{footer}</TableFooter> : null}
      </Table>
    </div>
  )
}
