import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Table, TableBody, TableRow } from '@/components/ui/table'
import { IdTableCell } from './id-table-cell'

/**
 * AN ID CELL TRUNCATED FROM THE START, WHICH IS WHERE IDS ARE THE SAME.
 *
 * `truncate(id, { length: 16 })` keeps the first 13 characters and drops the
 * rest. Every id this cell renders is a UUID, and the ledger seeds a great many
 * of them from a shared prefix — `00000000-0000-0000-0000-00000000000{1,2,3}` —
 * so a column of them rendered as identical strings. The one part that told two
 * rows apart was the part that was thrown away, and the reader had to hover
 * each row in turn to find the one they wanted.
 *
 * Middle truncation keeps both ends: the prefix that says what family the id
 * belongs to, and the tail that says which one it is.
 */
const LONG = '00000000-0000-0000-0000-000000000123'
const SIBLING = '00000000-0000-0000-0000-000000000456'

const row = (ui: React.ReactNode) =>
  render(
    <Table>
      <TableBody>
        <TableRow>{ui}</TableRow>
      </TableBody>
    </Table>
  )

describe('IdTableCell truncation', () => {
  it('keeps the tail that tells two ids apart', () => {
    row(<IdTableCell id={LONG} />)

    expect(screen.getByText(/0123$/)).toBeInTheDocument()
  })

  it('renders two ids sharing a prefix as different strings', () => {
    const { container } = row(
      <>
        <IdTableCell id={LONG} />
        <IdTableCell id={SIBLING} />
      </>
    )

    const shown = Array.from(container.querySelectorAll('td')).map(
      (cell) => cell.textContent
    )
    expect(shown[0]).not.toBe(shown[1])
  })

  it('keeps the head so the id family is still readable', () => {
    row(<IdTableCell id={LONG} />)

    expect(screen.getByText(/^00000000/)).toBeInTheDocument()
  })

  it('marks the gap with an ellipsis', () => {
    row(<IdTableCell id={LONG} />)

    expect(screen.getByText('00000000…0123')).toBeInTheDocument()
  })

  it('renders a short id whole, with no ellipsis', () => {
    row(<IdTableCell id="abc123" />)

    expect(screen.getByText('abc123')).toBeInTheDocument()
    expect(screen.queryByText(/…/)).toBeNull()
  })

  it('takes head and tail lengths from props', () => {
    row(<IdTableCell id={LONG} head={4} tail={8} />)

    expect(screen.getByText('0000…00000123')).toBeInTheDocument()
  })

  it('carries the full id in the cell title', () => {
    const { container } = row(<IdTableCell id={LONG} />)

    expect(container.querySelector('td')).toHaveAttribute('title', LONG)
  })

  it('copies the whole id, not the truncation', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    row(<IdTableCell id={LONG} />)
    await userEvent.click(screen.getByText('00000000…0123'))

    expect(writeText).toHaveBeenCalledWith(LONG)
  })

  /**
   * ⛔ A BAD LENGTH MUST NOT TAKE THE TABLE DOWN, AND MUST NOT LENGTHEN THE ID.
   *
   * `head` and `tail` reach this from a consumer's props, so they arrive as
   * whatever the caller computed — and this runs in a render path, where
   * throwing unmounts the whole table rather than one cell. `String.slice`
   * reads a negative number as an offset from the END, so a negative `head`
   * silently kept nearly the entire id and put an ellipsis in the middle of
   * it; `NaN` read as 0 and dropped the head, which is the failure middle
   * truncation exists to prevent. Both ends are clamped to a non-negative
   * whole number, and anything that is not a finite number falls back to the
   * default.
   */
  it.each([
    ['negative', -5, -3],
    ['fractional', 8.7, 4.2],
    ['NaN', NaN, NaN],
    ['Infinity', Infinity, -Infinity]
  ])('renders a sane truncation for %s lengths', (_label, head, tail) => {
    row(<IdTableCell id={LONG} head={head} tail={tail} />)

    const rendered = screen.getByText(/…|^0{8}/).textContent ?? ''
    expect(rendered.length).toBeLessThanOrEqual(LONG.length)
    expect(LONG.startsWith(rendered.split('…')[0])).toBe(true)
  })

  it('clamps a negative length to zero rather than slicing from the end', () => {
    row(<IdTableCell id={LONG} head={-5} tail={4} />)

    expect(screen.getByText('…0123')).toBeInTheDocument()
  })

  it('truncates a fractional length to a whole character count', () => {
    row(<IdTableCell id={LONG} head={8.9} tail={4.9} />)

    expect(screen.getByText('00000000…0123')).toBeInTheDocument()
  })

  it('falls back to the defaults when a length is not a finite number', () => {
    row(<IdTableCell id={LONG} head={NaN} tail={Infinity} />)

    expect(screen.getByText('00000000…0123')).toBeInTheDocument()
  })

  it('renders nothing rather than throwing when the id is absent', () => {
    const { container } = row(<IdTableCell />)

    expect(container.querySelector('td')).toBeInTheDocument()
    expect(container.querySelector('td')).not.toHaveAttribute('title')
  })
})
