import { Search } from 'lucide-react'
import { TableCell, TableCellWrapper, TableCellAction } from '../ui/table'

export type NameTableCellProps = Omit<
  React.ComponentProps<typeof TableCell>,
  'onClick'
> & {
  /**
   * The record's name. Whatever this renders IS the button's accessible name,
   * so a `ReactNode` carrying no text ships an unnamed control — the caller's
   * contract to keep.
   */
  name?: string | React.ReactNode
  /** Opens the record. Lands on a real button, never on the `<td>`. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}

/**
 * The name column, which is how an operator opens a record from a list.
 *
 * ⛔ THE CLICK IS A BUTTON, NEVER THE `<td>`. The cell had no click prop at
 * all, so a consumer wanting a clickable name put `onClick` on the `<td>`
 * through the spread props: a pointer user saw an affordance under a
 * `<p class="cursor-pointer">`, and a keyboard or screen-reader user got a
 * table cell with no control in it — the row's only route to the record was
 * unreachable. `onClick` is now `Omit`ed from the inherited cell props, so the
 * `<td>` handler is unrepresentable and the compiler says so at the call site.
 *
 * And with no handler there is no pointer cursor: text that says it is
 * clickable and is not is worse than plain text.
 */
export const NameTableCell = ({
  name,
  onClick,
  ...props
}: NameTableCellProps) => {
  return (
    <TableCell {...props}>
      <TableCellWrapper>
        {onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="focus-visible:ring-ring cursor-pointer rounded-sm text-left focus-visible:ring-2 focus-visible:outline-none"
          >
            {name}
          </button>
        ) : (
          <p>{name}</p>
        )}
        <TableCellAction>
          <Search className="size-3.5" />
        </TableCellAction>
      </TableCellWrapper>
    </TableCell>
  )
}
