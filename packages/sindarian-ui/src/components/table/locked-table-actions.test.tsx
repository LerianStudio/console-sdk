import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LockedTableActions } from './locked-table-actions'

/**
 * WHERE A ROW'S ACTION MENU WOULD BE, on a record the ledger will not let
 * anyone change. The trigger used to be a `<div>`, so the only explanation of
 * why the menu is missing lived in a tooltip that a keyboard could not open
 * and a screen reader had nothing to attach to: the row simply had one control
 * fewer, unexplained, on every immutable record in the list.
 *
 * The reason has to reach someone who never touches a mouse, which is what
 * these pin — with a real Tab, not by reading attributes off the DOM.
 */
describe('LockedTableActions', () => {
  const reason = 'External accounts are managed by the ledger'

  it('is reachable by keyboard', async () => {
    render(
      <>
        <button type="button">before</button>
        <LockedTableActions message={reason} />
      </>
    )

    screen.getByRole('button', { name: 'before' }).focus()
    await userEvent.tab()

    expect(screen.getByRole('button', { name: reason })).toHaveFocus()
  })

  /**
   * `aria-disabled`, not the `disabled` attribute. A truly disabled button
   * takes no focus and fires no pointer events, so it would announce as
   * unavailable and then refuse to open the tooltip saying WHY — the same dead
   * end in a different shape.
   */
  it('announces itself as unavailable without becoming unreachable', () => {
    render(<LockedTableActions message={reason} />)

    const trigger = screen.getByRole('button', { name: reason })

    expect(trigger).toHaveAttribute('aria-disabled', 'true')
    expect(trigger).not.toBeDisabled()
  })

  it('states the reason as its own name', () => {
    render(<LockedTableActions message={reason} />)

    expect(screen.getByRole('button', { name: reason })).toBeInTheDocument()
  })

  /**
   * Keyboard focus has to be VISIBLE, or reachable is only half the fix: a
   * `border` over a `bg-muted` can swallow the browser's default outline
   * entirely, and the other two cells in this table carry a ring.
   */
  it('shows where the keyboard is', () => {
    render(<LockedTableActions message={reason} />)

    expect(screen.getByRole('button', { name: reason }).className).toMatch(
      /focus-visible:ring/
    )
  })
})

/**
 * ⛔ `aria-disabled` IS NOT `disabled`. The control stays focusable so the
 * tooltip can open, which means a press really does dispatch a click, and a
 * click bubbles. Consumers put this cell in a row that opens the record, so
 * without a handler of its own the one control that says "you cannot change
 * this" would open the record it refuses to change — from a mouse and, because
 * a button turns Enter and Space into clicks, from a keyboard too.
 */
describe('LockedTableActions inside a clickable row', () => {
  const inRow = (onRowClick: jest.Mock) =>
    render(
      <table>
        <tbody>
          <tr onClick={onRowClick}>
            <td>
              <LockedTableActions message={reasonInRow} />
            </td>
          </tr>
        </tbody>
      </table>
    )

  const reasonInRow = 'External accounts are managed by the ledger'

  it('does not open the record when pressed with a pointer', async () => {
    const onRowClick = jest.fn()
    inRow(onRowClick)

    await userEvent.click(screen.getByRole('button', { name: reasonInRow }))

    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('does not open the record when pressed from the keyboard', async () => {
    const onRowClick = jest.fn()
    inRow(onRowClick)

    screen.getByRole('button', { name: reasonInRow }).focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')

    expect(onRowClick).not.toHaveBeenCalled()
  })
})
