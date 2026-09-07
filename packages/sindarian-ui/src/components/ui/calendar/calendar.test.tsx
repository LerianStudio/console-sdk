import type { ComponentProps } from 'react'

import { render, screen } from '@testing-library/react'
import { defaultLocale } from 'react-day-picker'
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

/**
 * The month-dropdown label came from `Date.toLocaleString('default', …)`, and
 * 'default' is the RUNTIME locale. So a calendar correctly given a locale
 * rendered its weekdays and its caption in that language and its month
 * dropdown in whatever language the machine happened to be set to. On a CI
 * runner set to en-US that reads "Oct" inside a pt-BR console writing "out."
 *
 * The locale below is react-day-picker's own, with only the month names
 * replaced by a marker that reports the width and the context it was asked
 * for. That proves the label was routed through the configured locale, and
 * proves which token produced it, without asserting one particular
 * translation and without this package taking a date-fns dependency for a
 * single test. Everything else in the render path keeps working because
 * everything else in the locale is real.
 */
describe('Calendar month dropdown locale', () => {
  const markerLocale = {
    ...defaultLocale,
    code: 'xx-TEST',
    localize: {
      ...defaultLocale.localize,
      month: (index: number, opts: { width: string; context: string }) =>
        `M${index}/${opts.width}/${opts.context}`
    }
  } as unknown as ComponentProps<typeof Calendar>['locale']

  const optionLabels = (container: HTMLElement) =>
    Array.from(container.querySelectorAll('option')).map(
      (option) => option.textContent
    )

  it('labels the months through the locale it was given', () => {
    const { container } = render(
      <Calendar
        mode="single"
        captionLayout="dropdown"
        defaultMonth={new Date(2026, 9, 1)}
        startMonth={new Date(2026, 0, 1)}
        endMonth={new Date(2026, 11, 31)}
        locale={markerLocale}
      />
    )

    expect(optionLabels(container)).toContain('M9/abbreviated/standalone')
  })

  it('keeps the label short rather than reverting to the full month name', () => {
    const { container } = render(
      <Calendar
        mode="single"
        captionLayout="dropdown"
        defaultMonth={new Date(2026, 9, 1)}
        startMonth={new Date(2026, 0, 1)}
        endMonth={new Date(2026, 11, 31)}
        locale={markerLocale}
      />
    )

    expect(optionLabels(container)).not.toContain('M9/wide/standalone')
  })

  it('still lets a consumer override the formatter outright', () => {
    const { container } = render(
      <Calendar
        mode="single"
        captionLayout="dropdown"
        defaultMonth={new Date(2026, 9, 1)}
        startMonth={new Date(2026, 0, 1)}
        endMonth={new Date(2026, 11, 31)}
        locale={markerLocale}
        formatters={{ formatMonthDropdown: () => 'OVERRIDE' }}
      />
    )

    const labels = optionLabels(container)
    expect(labels).toContain('OVERRIDE')
    expect(labels).not.toContain('M9/abbreviated/standalone')
  })
})
