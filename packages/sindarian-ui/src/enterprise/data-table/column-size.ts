import type { CSSProperties } from 'react'
import { defaultColumnSizing, type Column } from '@tanstack/react-table'

/**
 * The column sizing a ColumnDef actually DECLARED, or `undefined` when it
 * declared none. This is VirtualizedTable's reading: flex rows honour all
 * three, so `size`, `minSize` and `maxSize` all PIN. DataTable's `<th>`/`<td>`
 * path reads the same declaration through {@link readPreferredColumnSize},
 * which drops the ceiling CSS auto table layout cannot enforce.
 *
 * "Declared" cannot be read off `column.getSize()`: TanStack merges
 * `defaultColumnSizing` into every columnDef, so a column that asked for
 * nothing still reports `size: 150`, `minSize: 20`,
 * `maxSize: Number.MAX_SAFE_INTEGER`. Rendering those would pin every existing
 * table to 150px columns. A value equal to the library's own default therefore
 * counts as "not declared", and the column keeps whatever the layout gives it.
 *
 * Width comes from `getSize()` rather than the raw `size` so it lands already
 * clamped by the column's own min/max.
 *
 * ponytail: a column declaring EXACTLY the library default (`size: 150`) is
 * indistinguishable from one declaring nothing, and stays auto-width. Telling
 * them apart means re-deriving TanStack's column-id rules over the raw
 * `columns` prop; not worth it until someone actually wants 150px.
 */
export function readDeclaredColumnSize<TData>(
  column: Column<TData, unknown>
): CSSProperties | undefined {
  const { size, minSize, maxSize } = column.columnDef

  const declaredWidth = size !== undefined && size !== defaultColumnSizing.size
  const width = declaredWidth ? column.getSize() : undefined
  const minWidth = minSize === defaultColumnSizing.minSize ? undefined : minSize
  const maxWidth = maxSize === defaultColumnSizing.maxSize ? undefined : maxSize

  if (width === undefined && minWidth === undefined && maxWidth === undefined) {
    return undefined
  }

  return { width, minWidth, maxWidth }
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
): CSSProperties | undefined {
  const { width, minWidth } = readDeclaredColumnSize(column) ?? {}

  if (width === undefined && minWidth === undefined) {
    return undefined
  }

  return { width, minWidth }
}
