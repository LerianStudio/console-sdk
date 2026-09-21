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

/**
 * `data-range-start`, `data-range-middle` and `data-range-end` are the only
 * hook the range styling has: the day button's class list paints the first and
 * the last day of a selected range in the accent colour, rounds their outer
 * corners and leaves the days between them in the muted fill. Nothing else in
 * the component reads them, so a refactor of `CalendarDayButton` that dropped
 * one would cost every date-range surface its selected span — the enterprise
 * `DateRangePicker` and the console's date-range filters included — while the
 * calendar still rendered and no test went red. Plan
 * 2026-09-21-console-simplification C9 freezes the three attributes; this is
 * what makes the freeze bite.
 */
describe('Calendar selected range attributes', () => {
  // A span well inside March 2026, so no day in the grid is "today" (which
  // would prefix its accessible name) and no day belongs to another month.
  const TUESDAY_10 = 'Tuesday, March 10th, 2026, selected'
  const WEDNESDAY_11 = 'Wednesday, March 11th, 2026, selected'
  const THURSDAY_12 = 'Thursday, March 12th, 2026, selected'
  const FRIDAY_13 = 'Friday, March 13th, 2026, selected'

  const renderRange = (from: Date, to: Date) =>
    render(
      <Calendar
        mode="range"
        defaultMonth={new Date(2026, 2, 1)}
        selected={{ from, to }}
      />
    )

  const day = (name: string) => screen.getByRole('button', { name })

  const daysWith = (container: HTMLElement, attribute: string) =>
    Array.from(container.querySelectorAll(`button[${attribute}="true"]`))

  it('marks only the first day of the range as its start', () => {
    const { container } = renderRange(
      new Date(2026, 2, 10),
      new Date(2026, 2, 13)
    )
    const starts = daysWith(container, 'data-range-start')

    expect(starts).toHaveLength(1)
    expect(starts[0]).toBe(day(TUESDAY_10))
  })

  it('marks only the last day of the range as its end', () => {
    const { container } = renderRange(
      new Date(2026, 2, 10),
      new Date(2026, 2, 13)
    )
    const ends = daysWith(container, 'data-range-end')

    expect(ends).toHaveLength(1)
    expect(ends[0]).toBe(day(FRIDAY_13))
  })

  it('marks every day strictly between the ends as the middle', () => {
    const { container } = renderRange(
      new Date(2026, 2, 10),
      new Date(2026, 2, 13)
    )
    const middles = daysWith(container, 'data-range-middle')

    expect(middles).toHaveLength(2)
    expect(middles[0]).toBe(day(WEDNESDAY_11))
    expect(middles[1]).toBe(day(THURSDAY_12))
  })

  it('marks a one-day range as both its own start and its own end', () => {
    const { container } = renderRange(
      new Date(2026, 2, 12),
      new Date(2026, 2, 12)
    )
    const only = day(THURSDAY_12)

    expect(daysWith(container, 'data-range-start')).toEqual([only])
    expect(daysWith(container, 'data-range-end')).toEqual([only])
    expect(daysWith(container, 'data-range-middle')).toHaveLength(0)
  })

  it('leaves no day in the middle when the two ends are adjacent', () => {
    const { container } = renderRange(
      new Date(2026, 2, 10),
      new Date(2026, 2, 11)
    )

    expect(daysWith(container, 'data-range-start')).toEqual([day(TUESDAY_10)])
    expect(daysWith(container, 'data-range-end')).toEqual([day(WEDNESDAY_11)])
    expect(daysWith(container, 'data-range-middle')).toHaveLength(0)
  })
})
