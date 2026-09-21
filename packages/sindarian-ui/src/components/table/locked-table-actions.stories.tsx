import { Meta, StoryObj } from '@storybook/nextjs'
import { MoreVertical } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { LockedTableActions } from './locked-table-actions'

/**
 * Where a row's action menu would be, on a record the ledger will not let
 * anyone change — an external account, in double-entry terms.
 *
 * ⛔ THE TRIGGER IS A BUTTON. It used to be a `<div>`, so the only explanation
 * of why the menu is gone lived in a tooltip a keyboard could not open and a
 * screen reader had nothing to attach to. Tab through the rows below: the
 * locked one takes focus and announces its reason as its own name.
 *
 * `aria-disabled`, never `disabled`: a truly disabled button takes no focus and
 * fires no pointer events, so it would announce as unavailable and then refuse
 * to open the tooltip saying WHY.
 */
const meta: Meta<typeof LockedTableActions> = {
  title: 'Components/Table/LockedTableActions',
  component: LockedTableActions
}

export default meta

const REASON = 'External accounts are managed by the ledger'

/** One locked row between two that a menu can still act on. */
export const InATable: StoryObj<typeof LockedTableActions> = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[
          { name: 'Corporate Checking', locked: false },
          { name: '@external/BRL', locked: true },
          { name: 'Payroll Settlement', locked: false }
        ].map(({ name, locked }) => (
          <TableRow key={name}>
            <TableCell>{name}</TableCell>
            <TableCell>
              {locked ? (
                <LockedTableActions message={REASON} />
              ) : (
                <button
                  type="button"
                  aria-label={`Actions for ${name}`}
                  className="border-border flex size-9 items-center justify-center rounded-md border"
                >
                  <MoreVertical size={14} />
                </button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** The trigger on its own: focus it or hover it, the reason says itself. */
export const Primary: StoryObj<typeof LockedTableActions> = {
  args: { message: REASON }
}
