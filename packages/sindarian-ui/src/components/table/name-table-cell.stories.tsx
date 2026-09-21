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

const Rows = (props: Partial<React.ComponentProps<typeof NameTableCell>>) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {NAMES.map((name) => (
        <TableRow key={name}>
          <NameTableCell name={name} {...props} />
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
