import { Search } from 'lucide-react'
import { TableCell, TableCellWrapper, TableCellAction } from '../ui/table'

/** Opens the record. Lands on a real button, never on the `<td>`. */
type OpenRecord = React.MouseEventHandler<HTMLButtonElement>

export type NameTableCellProps = Omit<
  React.ComponentProps<typeof TableCell>,
  'onClick'
> &
  /**
   * Three shapes, and the only one missing is an interactive cell that can
   * carry no accessible name.
   *
   * 1. A text `name` IS the button's accessible name, so the handler is free
   *    and `buttonLabel` merely overrides what the button announces.
   * 2. Anything else rendered inside the button — a badge, an icon, an italic
   *    placeholder — may carry no text at all, so it has to name its button.
   * 3. No handler, no control: text in a table has nothing to name.
   */
  (
    | { name: string; onClick?: OpenRecord; buttonLabel?: string }
    | { name?: React.ReactNode; onClick: OpenRecord; buttonLabel: string }
    | { name?: React.ReactNode; onClick?: never; buttonLabel?: never }
  )

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
 *
 * ⛔ AN INTERACTIVE CELL CANNOT BE ANONYMOUS. `name` renders INSIDE the button,
 * so whatever it renders is the button's accessible name — and a `ReactNode` is
 * free to render no text at all, which announces as a bare "button" and leaves
 * the row's only route to its record as unreachable as the `<td>` handler
 * above. The props are a union rather than a comment: a text `name` names the
 * button by itself, anything else has to pass `buttonLabel`, and a cell with no
 * handler is exempt because it holds no control.
 *
 * `buttonLabel` and not an inherited `aria-label`, which the spread puts on the
 * `<td>` — naming the CELL, never the control inside it.
 *
 * ⛔ AND THE UNION STILL LETS THE EMPTY STRING THROUGH, because every string
 * type does. `name=""` satisfies the text arm and `buttonLabel="   "` satisfies
 * the labelled one, so the last word is the component's, below.
 */
export const NameTableCell = ({
  name,
  onClick,
  buttonLabel,
  ...props
}: NameTableCellProps) => {
  // Whitespace names nothing. An `aria-label` of "   " is worse than none: it
  // OVERRIDES the text inside the button, so a perfectly good name is replaced
  // by silence. Drop it and the text content names the control again.
  const label = buttonLabel?.trim() ? buttonLabel : undefined
  // Only a text `name` can name the button by itself. Any other node is opaque
  // here — which is why the type demands a label for it in the first place.
  const textName = typeof name === 'string' ? name.trim() : ''
  const named = Boolean(label) || textName !== ''

  // ⛔ AN UNNAMED BUTTON LOSES ITS HANDLER, IT DOES NOT SHIP. The two failures
  // are not symmetric: a button announcing "" is invisible to the developer who
  // wrote it and fatal to the operator who cannot use a mouse, while a name
  // that does not open its record shows itself on the very first render. So the
  // cell degrades to the plain text it can still display correctly, and says so
  // where a developer will see it. Never throws: one nameless row must not take
  // the whole table down.
  if (process.env.NODE_ENV !== 'production' && onClick && !named) {
    console.error(
      `NameTableCell has no accessible name: \`${
        typeof name === 'string' ? 'name' : 'buttonLabel'
      }\` is empty, so its click handler was dropped rather than render a button announcing "".`
    )
  }

  const opensRecord = onClick && named

  return (
    <TableCell {...props}>
      <TableCellWrapper>
        {opensRecord ? (
          <button
            type="button"
            onClick={onClick}
            aria-label={label}
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
