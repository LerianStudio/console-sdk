import dayjs from 'dayjs'
import { fireEvent, render, screen } from '@testing-library/react'
import { ptBR } from 'react-day-picker/locale'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { DateTimePickerField, type DateTimePickerFieldProps } from '.'

/** jsdom implements no layout, so it ships no scrollIntoView. The TimePicker
 *  column scrolls its selected item into view the moment the popover mounts,
 *  and without this the whole open gesture throws before the calendar renders. */
Element.prototype.scrollIntoView = function scrollIntoView(): void {}

type Values = { at: string }

const SELECTED = dayjs(new Date(2026, 2, 12, 9, 30)).toISOString()

function Harness({
  locale
}: {
  locale?: DateTimePickerFieldProps<Values>['locale']
}) {
  const form = useForm<Values>({ defaultValues: { at: SELECTED } })

  return (
    <Form {...form}>
      <DateTimePickerField
        control={form.control}
        name="at"
        label="Cutoff"
        data-testid="cutoff"
        locale={locale}
      />
      <output data-testid="value">{form.watch('at')}</output>
    </Form>
  )
}

function openCalendar() {
  fireEvent.click(screen.getByTestId('cutoff'))
}

describe('DateTimePickerField locale', () => {
  it('renders the calendar in English by default', () => {
    render(<Harness />)
    openCalendar()

    expect(screen.getByText(/March 2026/i)).toBeInTheDocument()
  })

  it('renders the calendar in the given locale', () => {
    render(<Harness locale={ptBR} />)
    openCalendar()

    expect(screen.getByText(/março 2026/i)).toBeInTheDocument()
    expect(screen.queryByText(/March 2026/i)).not.toBeInTheDocument()
  })
})

describe('DateTimePickerField re-click', () => {
  /**
   * Pre-existing behaviour, pinned here as a regression: a single-mode calendar
   * offers deselection by firing onSelect with `undefined` when the
   * already-selected day is clicked again, and this handler returns early on
   * that `undefined`, so the day and the time it carries both stay. Clearing is
   * the clear control's job, which this field has and the sibling
   * DatePickerField does not.
   *
   * react-day-picker appends ", selected" to the day's accessible name once it
   * is the current selection, hence the regex rather than the exact string the
   * sibling DateRangePicker test uses on an unselected day.
   */
  it('keeps the value when the selected day is clicked again', () => {
    render(<Harness />)
    openCalendar()

    fireEvent.click(screen.getByLabelText(/Thursday, March 12th, 2026/))

    expect(screen.getByTestId('value')).toHaveTextContent(SELECTED)
  })
})
