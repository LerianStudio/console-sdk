import { Meta, StoryObj } from '@storybook/nextjs'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { IdTableCell } from './id-table-cell'

/**
 * The id column of a data table: a truncated id, the whole one on hover, and a
 * click that copies the whole one.
 *
 * ⛔ THE TRUNCATION IS IN THE MIDDLE. Taken from the start — which is what this
 * cell used to do — a run of ledger ids sharing a prefix all render as the same
 * string, and the reader has to hover each row in turn to find the one they
 * want. `head` and `tail` tune how much of each end survives.
 */
const meta: Meta<typeof IdTableCell> = {
  title: 'Components/Table/IdTableCell',
  component: IdTableCell
}

export default meta

const IDS = [
  '00000000-0000-0000-0000-000000000123',
  '00000000-0000-0000-0000-000000000456',
  '00000000-0000-0000-0000-000000000789'
]

const Rows = (props: Partial<React.ComponentProps<typeof IdTableCell>>) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>ID</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {IDS.map((id) => (
        <TableRow key={id}>
          <IdTableCell id={id} {...props} />
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

/** Three ids sharing a 32-character prefix, told apart by their tails. */
export const Primary: StoryObj<typeof IdTableCell> = {
  render: () => <Rows />
}

/** A longer tail, for ids whose distinguishing part is not the last four. */
export const LongerTail: StoryObj<typeof IdTableCell> = {
  render: () => <Rows head={4} tail={12} />
}

/** Short enough to render whole: no ellipsis, nothing hidden. */
export const ShortId: StoryObj<typeof IdTableCell> = {
  render: () => (
    <Table>
      <TableBody>
        <TableRow>
          <IdTableCell id="abc123" />
        </TableRow>
      </TableBody>
    </Table>
  )
}
