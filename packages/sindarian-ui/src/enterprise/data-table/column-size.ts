import type { Column } from '@tanstack/react-table'

/**
 * The sizing a column DECLARED, in px. Only keys the ColumnDef actually carried
 * are present, so an undeclared column reads back as `undefined` and keeps
 * whatever width its layout gives it.
 */
export type DeclaredColumnSize = {
  width?: number
  minWidth?: number
  maxWidth?: number
}

/**
 * The column sizing a ColumnDef actually DECLARED, or `undefined` when it
 * declared none. This is VirtualizedTable's reading: flex rows honour all
 * three, so `size`, `minSize` and `maxSize` all PIN. DataTable's `<th>`/`<td>`
 * path reads the same declaration through {@link readPreferredColumnSize},
 * which drops the ceiling CSS auto table layout cannot enforce.
 *
 * Reading the raw `columnDef` is only honest because both tables pass
 * `defaultColumn: { size: undefined, minSize: undefined, maxSize: undefined }`
 * to `useReactTable`. TanStack builds every columnDef as
 * `{ ...featureDefaults, ...table.options.defaultColumn, ...userDef }`, so
 * those three overrides blank out the `defaultColumnSizing` the ColumnSizing
 * feature would otherwise stamp on every column (150 / 20 / MAX_SAFE_INTEGER).
 * Without them a column asking for nothing reports `size: 150` and a column
 * asking for exactly 150 is indistinguishable from it. `column.getSize()` is
 * unaffected: it falls back to `defaultColumnSizing` with `??`, so column
 * offsets and the table's total size are byte-identical either way.
 *
 * Width comes from `getSize()` rather than the raw `size` so it lands already
 * clamped by the column's own min/max.
 */
export function readDeclaredColumnSize<TData>(
  column: Column<TData, unknown>
): DeclaredColumnSize | undefined {
  const { size, minSize, maxSize } = column.columnDef

  const width = size === undefined ? undefined : column.getSize()

  if (width === undefined && minSize === undefined && maxSize === undefined) {
    return undefined
  }

  return { width, minWidth: minSize, maxWidth: maxSize }
}

/**
 * A GROUP header cell is exactly as wide as the leaf columns it spans, so it
 * can only be pinned when every one of them is: a group whose leaves are
 * partly sized has no honest fixed width, and keeps its colSpan flex share so
 * the header rule still tracks the cells beneath it. Reading the group's own
 * ColumnDef instead would size the header against a declaration its body cells
 * never see.
 *
 * Every dimension the leaves agree on carries up, CEILING INCLUDED. This is
 * VirtualizedTable's path, where flex rows honour `maxSize` on a leaf — so a
 * group of capped leaves whose header carried no `maxWidth` was free to grow
 * past every column it names, which is the same header-vs-cells drift the
 * width sum exists to prevent. Each dimension is decided on its own: a group
 * can be uncapped and still have a floor.
 */
export function readDeclaredGroupSize<TData>(
  leaves: Column<TData, unknown>[]
): DeclaredColumnSize | undefined {
  if (leaves.length === 0) return undefined

  const sizes = leaves.map(readDeclaredColumnSize)

  const width = sum(sizes, 'width')
  const minWidth = sum(sizes, 'minWidth')
  const maxWidth = sum(sizes, 'maxWidth')

  if (width === undefined && minWidth === undefined && maxWidth === undefined) {
    return undefined
  }

  return { width, minWidth, maxWidth }
}

/**
 * The total of one dimension, or `undefined` unless EVERY leaf declared it. One
 * leaf short and the group has no honest total: an unsized leaf flexes, an
 * unfloored one can shrink, and an uncapped one grows without limit.
 */
function sum(
  sizes: (DeclaredColumnSize | undefined)[],
  key: keyof DeclaredColumnSize
): number | undefined {
  let total = 0

  for (const size of sizes) {
    const value = size?.[key]
    if (value === undefined) return undefined
    total += value
  }

  return total
}

/**
 * The same declaration as {@link readDeclaredColumnSize}, minus `maxWidth`.
 *
 * DataTable renders real `<th>`/`<td>` under CSS AUTO table layout, where
 * Chrome and Firefox ignore `max-width` on a cell. Emitting it would advertise
 * a ceiling that never holds, so this path keeps only what the layout obeys:
 * `size` as a PREFERRED width and `minSize` as a floor. A column that must not
 * grow past a width belongs in VirtualizedTable.
 */
export function readPreferredColumnSize<TData>(
  column: Column<TData, unknown>
): DeclaredColumnSize | undefined {
  const { width, minWidth } = readDeclaredColumnSize(column) ?? {}

  if (width === undefined && minWidth === undefined) {
    return undefined
  }

  return { width, minWidth }
}

/**
 * Blanks out the `defaultColumnSizing` TanStack stamps onto every ColumnDef, so
 * `columnDef.size` / `minSize` / `maxSize` mean "the consumer asked for this"
 * and nothing else. Both tables pass it to `useReactTable`.
 */
export const UNSIZED_DEFAULT_COLUMN = {
  size: undefined,
  minSize: undefined,
  maxSize: undefined
}
