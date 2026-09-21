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
 * named button that copies the whole one.
 *
 * ⛔ THE COPY CONTROL IS A BUTTON. It used to be a handler on the `<td>` with a
 * bare glyph for an affordance — no role, no tab stop, no name — so nobody
 * could copy an id without a pointer. Tab into the table to reach it;
 * `copyLabel` renames it for a localized console.
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

/**
 * The copy control, held visible by the story's own `[&_button]:opacity-100`
 * so the glyph and its focus ring are legible in the docs frame — in a real
 * table it fades in on hover, on focus, and permanently on a device with no
 * pointer to hover with. Tab through the table: each row offers the id itself
 * (the tooltip trigger, which reveals the whole value) and then the copy
 * button.
 */
export const CopyButton: StoryObj<typeof IdTableCell> = {
  render: () => (
    <Rows
      className="[&_button]:opacity-100"
      copyLabel="Copy account id"
      onCopy={(id) => console.info('copied', id)}
    />
  )
}

/** No id, no copy control: the cell renders empty rather than copying "undefined". */
export const WithoutId: StoryObj<typeof IdTableCell> = {
  render: () => (
    <Table>
      <TableBody>
        <TableRow>
          <IdTableCell />
        </TableRow>
      </TableBody>
    </Table>
  )
}
