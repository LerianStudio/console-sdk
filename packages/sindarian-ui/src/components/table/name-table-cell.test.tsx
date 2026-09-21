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
