import { Meta, StoryObj } from '@storybook/nextjs'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { NameTableCell } from './name-table-cell'

/**
 * The name column of a data table: how an operator opens a record from a list.
 *
 * ⛔ THE CLICK IS A BUTTON. The cell used to offer no click prop at all, so a
 * consumer put `onClick` on the `<td>` through the spread props — a pointer
 * affordance with no control under it, and no route to the record for anyone
 * who does not use a mouse. Tab into the table to reach the name.
 *
 * ⛔ NO HANDLER, NO POINTER. A cell that leads nowhere renders plain text.
 */
const meta: Meta<typeof NameTableCell> = {
  title: 'Components/Table/NameTableCell',
  component: NameTableCell
}

export default meta

const NAMES = ['Corporate Checking', 'Payroll Settlement', 'FX Clearing']

// One handler, passed by name rather than spread: the props are a union now,
// and a spread of `Partial<union>` matches no arm of it — which is the point,
// since that spread is exactly how a caller would smuggle in an interactive
// cell carrying no accessible name.
const Rows = ({
  onClick
}: {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
}) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {NAMES.map((name) => (
        <TableRow key={name}>
          <NameTableCell name={name} onClick={onClick} />
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

/** Each name is a focusable button that opens its record. */
export const Primary: StoryObj<typeof NameTableCell> = {
  render: () => <Rows onClick={() => console.info('open record')} />
}

/** No handler: plain text, and no cursor promising a click that never comes. */
export const WithoutHandler: StoryObj<typeof NameTableCell> = {
  render: () => <Rows />
}

/**
 * A name built from markup rather than text — here a code and a badge, which is
 * what the Console's schema and provider tables render.
 *
 * ⛔ THIS ARM REQUIRES `buttonLabel`. Whatever `name` renders IS the button's
 * accessible name, so markup that carries no readable text announces as a bare
 * "button" and the row's only route to its record becomes anonymous. A text
 * `name` needs nothing; anything else does not compile without the label.
 */
export const NonTextualName: StoryObj<typeof NameTableCell> = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <NameTableCell
            name={
              <span className="flex items-center gap-2">
                <span className="font-mono text-sm">PIX-IN-V2</span>
                <span className="bg-muted rounded px-1.5 py-0.5 text-xs">
                  v3
                </span>
              </span>
            }
            buttonLabel="Open schema PIX-IN-V2, version 3"
            onClick={() => console.info('open record')}
          />
        </TableRow>
      </TableBody>
    </Table>
  )
}
