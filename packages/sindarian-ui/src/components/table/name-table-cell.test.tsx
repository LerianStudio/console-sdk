import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Table, TableBody, TableRow } from '@/components/ui/table'
import { NameTableCell } from './name-table-cell'

/**
 * A ROW WHOSE ONLY ROUTE TO ITS RECORD NEEDED A MOUSE.
 *
 * The cell rendered `<p class="cursor-pointer">` and nothing else, so a
 * consumer wanting a clickable name had to hang `onClick` on the `<td>` through
 * the spread props. A pointer user saw an affordance; a keyboard or
 * screen-reader user got a table cell with no control in it at all, and the
 * name column is how an operator opens a record from a list.
 *
 * And when nobody passed a handler, the `cursor-pointer` was worse than
 * useless: text that says it is clickable and is not.
 */
const NAME = 'Corporate Checking'

const row = (ui: React.ReactNode) =>
  render(
    <Table>
      <TableBody>
        <TableRow>{ui}</TableRow>
      </TableBody>
    </Table>
  )

const glyph = (container: HTMLElement) =>
  container.querySelector('[data-slot="data-table-cell-action"] svg')

describe('NameTableCell with a handler', () => {
  it('opens the record from a named button', () => {
    row(<NameTableCell name={NAME} onClick={jest.fn()} />)

    expect(screen.getByRole('button', { name: NAME })).toHaveAttribute(
      'type',
      'button'
    )
  })

  it('is reachable from the keyboard', async () => {
    render(
      <>
        <button type="button">before</button>
        <Table>
          <TableBody>
            <TableRow>
              <NameTableCell name={NAME} onClick={jest.fn()} />
            </TableRow>
          </TableBody>
        </Table>
      </>
    )

    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'before' })).toHaveFocus()

    await userEvent.tab()
    expect(screen.getByRole('button', { name: NAME })).toHaveFocus()
  })

  it('calls the handler exactly once per click', async () => {
    const onClick = jest.fn()
    row(<NameTableCell name={NAME} onClick={onClick} />)

    await userEvent.click(screen.getByRole('button', { name: NAME }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('keeps the search glyph', () => {
    const { container } = row(<NameTableCell name={NAME} onClick={jest.fn()} />)

    expect(glyph(container)).toBeInTheDocument()
  })
})

describe('NameTableCell without a handler', () => {
  it('renders no control at all', () => {
    row(<NameTableCell name={NAME} />)

    expect(screen.queryByRole('button')).toBeNull()
  })

  it('stops painting a pointer over text that does nothing', () => {
    row(<NameTableCell name={NAME} />)

    expect(screen.getByText(NAME)).not.toHaveClass('cursor-pointer')
  })

  it('keeps the search glyph', () => {
    const { container } = row(<NameTableCell name={NAME} />)

    expect(glyph(container)).toBeInTheDocument()
  })
})

/**
 * ⛔ AN INTERACTIVE CELL WITH NO ACCESSIBLE NAME IS AN UNREACHABLE RECORD.
 *
 * `name` renders inside the button, so whatever it renders IS the button's
 * name — and a `ReactNode` is free to render a badge, an icon or an italic
 * placeholder and no text at all. A screen reader then announces "button", and
 * the row's only route to its record is as anonymous as the `<td>` handler this
 * component exists to replace. Leaving it to the caller's discipline is what a
 * comment does; this is what the compiler does.
 *
 * A cell with no handler is exempt, and stays exempt: it is text in a table,
 * with no control in it to name.
 */
describe('NameTableCell naming the button', () => {
  const nameless = <span aria-hidden="true">•</span>

  it('names the button from buttonLabel when the name renders no text', () => {
    row(
      <NameTableCell
        name={nameless}
        buttonLabel="Open Corporate Checking"
        onClick={jest.fn()}
      />
    )

    expect(
      screen.getByRole('button', { name: 'Open Corporate Checking' })
    ).toBeInTheDocument()
  })

  it('keeps a text name as the button name with no extra prop', () => {
    row(<NameTableCell name={NAME} onClick={jest.fn()} />)

    expect(screen.getByRole('button', { name: NAME })).toBeInTheDocument()
  })

  /**
   * The compiler is the gate, so these are type assertions, not renders: an
   * unused `@ts-expect-error` is itself an error, which is what makes the two
   * below fail the moment the union stops requiring a label.
   */
  it('refuses an interactive cell that can carry no accessible name', () => {
    const openRecord = jest.fn()

    const missingName = (
      // @ts-expect-error an interactive cell needs a name or a buttonLabel
      <NameTableCell onClick={openRecord} />
    )
    const nonTextualName = (
      // @ts-expect-error a non-textual name needs an explicit buttonLabel
      <NameTableCell name={nameless} onClick={openRecord} />
    )

    expect([missingName, nonTextualName]).toHaveLength(2)
  })
})

/**
 * ⛔ THE TYPE CANNOT RULE OUT THE EMPTY STRING. `name=""` satisfies the text
 * arm and `buttonLabel="   "` satisfies the labelled one, so both compile and
 * both would render a button announcing "" — the very defect the union exists
 * to stop, arriving through the hole every string type has.
 *
 * The cell drops the handler rather than ship an unnamed control: an anonymous
 * button is invisible to the developer and fatal to a screen-reader user, while
 * a missing click shows itself on the first render. The dev-only `console.error`
 * is the signal, matching what the form fields in this package already do for a
 * blank `label`.
 */
describe('NameTableCell with a name that is only whitespace', () => {
  const nameless = <span aria-hidden="true">•</span>

  it('drops the handler and names the empty prop when name is blank', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    row(<NameTableCell name="" onClick={jest.fn()} />)

    const complained = spy.mock.calls.some((call) =>
      String(call[0]).includes('NameTableCell')
    )
    const namedTheProp = spy.mock.calls.some((call) =>
      String(call[0]).includes('`name`')
    )
    spy.mockRestore()

    expect(screen.queryByRole('button')).toBeNull()
    expect(complained).toBe(true)
    expect(namedTheProp).toBe(true)
  })

  it('drops the handler and names the empty prop when buttonLabel is blank', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    row(<NameTableCell name={nameless} buttonLabel="   " onClick={jest.fn()} />)

    const complained = spy.mock.calls.some((call) =>
      String(call[0]).includes('NameTableCell')
    )
    const namedTheProp = spy.mock.calls.some((call) =>
      String(call[0]).includes('`buttonLabel`')
    )
    spy.mockRestore()

    expect(screen.queryByRole('button')).toBeNull()
    expect(complained).toBe(true)
    expect(namedTheProp).toBe(true)
  })

  /**
   * A blank `buttonLabel` beside a real text name is not nameless: the text
   * inside the button still names it. The blank attribute is dropped rather
   * than shipped, which is what would name the control "".
   */
  it('keeps the button when a text name survives a blank buttonLabel', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    row(<NameTableCell name={NAME} buttonLabel="  " onClick={jest.fn()} />)

    spy.mockRestore()

    const button = screen.getByRole('button', { name: NAME })
    expect(button).not.toHaveAttribute('aria-label')
  })

  it('says nothing when there is no handler to drop', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    row(<NameTableCell name="" />)

    const complained = spy.mock.calls.some((call) =>
      String(call[0]).includes('NameTableCell')
    )
    spy.mockRestore()

    expect(complained).toBe(false)
  })
})
