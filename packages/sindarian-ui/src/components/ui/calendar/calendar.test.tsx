import { render, screen } from '@testing-library/react'
import { Calendar } from '.'

/**
 * react-day-picker already renders each day cell as a `<td role="gridcell">`
 * and hands the inner day button its own type, tab order, accessible name and
 * disabled state. Stamping `role="gridcell"` on that button put a gridcell
 * inside a gridcell, which is what axe `aria-required-parent` and
 * `aria-required-children` fire on, and every consumer of Calendar (the three
 * form date fields and the enterprise DateRangePicker) inherited it.
 */
describe('Calendar day grid roles', () => {
  const renderCalendar = () =>
    render(<Calendar mode="single" defaultMonth={new Date(2026, 2, 1)} />)

  it('keeps the gridcell role on the table cells only', () => {
    const { container } = renderCalendar()
    const gridcells = container.querySelectorAll('[role="gridcell"]')

    expect(gridcells.length).toBeGreaterThan(0)
    for (const cell of gridcells) {
      expect(cell.tagName).toBe('TD')
    }
  })

  it('exposes each day as exactly one button carrying the day name', () => {
    renderCalendar()
    const days = screen.getAllByRole('button', {
      name: 'Thursday, March 12th, 2026'
    })

    expect(days).toHaveLength(1)
    expect(days[0].tagName).toBe('BUTTON')
  })

  it('sets no role attribute on any button in the grid', () => {
    const { container } = renderCalendar()
    const buttons = container.querySelectorAll('button')

    expect(buttons.length).toBeGreaterThan(0)
    for (const button of buttons) {
      expect(button).not.toHaveAttribute('role')
    }
  })
})

/**
 * ARIA allows `aria-selected` only on selectable widget roles (`gridcell` and
 * its header roles, `option`, `treeitem`, `row`, `tab`), never on `button`.
 * react-day-picker already puts it on the `<td>` it owns, so a copy on the day
 * button is both redundant and an `aria-allowed-attr` violation once that
 * button is a plain button.
 */
describe('Calendar day selection state', () => {
  const renderSelected = () =>
    render(
      <Calendar
        mode="single"
        defaultMonth={new Date(2026, 2, 1)}
        selected={new Date(2026, 2, 12)}
      />
    )

  it('leaves aria-selected to the table cell', () => {
    const { container } = renderSelected()
    const buttons = container.querySelectorAll('button')

    expect(buttons.length).toBeGreaterThan(0)
    for (const button of buttons) {
      expect(button).not.toHaveAttribute('aria-selected')
    }
  })

  it('still announces the selected day on its gridcell', () => {
    const { container } = renderSelected()

    expect(container.querySelector('td[aria-selected="true"]')).not.toBeNull()
  })
})
