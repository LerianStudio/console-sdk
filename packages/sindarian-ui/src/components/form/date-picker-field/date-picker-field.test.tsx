import { fireEvent, render, screen } from '@testing-library/react'
import { ptBR } from 'react-day-picker/locale'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { DatePickerField, type DatePickerFieldProps } from '.'

/** Thursday, March 12th, 2026: a fixed day so the calendar never drifts. */
const MARCH_12 = new Date(2026, 2, 12)

type DayForm = { day: Date | undefined }

function Harness({
  defaultValue,
  locale,
  required
}: {
  defaultValue?: Date
  locale?: DatePickerFieldProps<DayForm>['locale']
  required?: boolean
}) {
  const form = useForm<DayForm>({ defaultValues: { day: defaultValue } })
  const day = form.watch('day')

  return (
    <Form {...form}>
      <DatePickerField<DayForm>
        control={form.control}
        name="day"
        label="Day"
        placeholder="Pick a day"
        locale={locale}
        required={required}
        data-testid="day-trigger"
      />
      {/* Read the form value back the way a consumer would, so the assertion
          fails when the field writes something the caller never asked for. */}
      <output data-testid="day-value">
        {day
          ? `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`
          : 'unset'}
      </output>
    </Form>
  )
}

describe('DatePickerField selection', () => {
  it('still selects a different day', () => {
    render(<Harness defaultValue={MARCH_12} />)

    fireEvent.click(screen.getByTestId('day-trigger'))
    fireEvent.click(screen.getByLabelText(/March 20th, 2026/))

    expect(screen.getByTestId('day-value')).toHaveTextContent('2026-3-20')
  })
})

/**
 * Clicking the already-selected day is react-day-picker's clear gesture in
 * single mode, and this field carries no clear button of its own, so it is the
 * only way an optional field can ever be emptied. The calendar therefore takes
 * the field's OWN `required`: a mandatory field is not emptied by a stray
 * second click, an optional one keeps the gesture.
 */
describe('DatePickerField re-click on the selected day', () => {
  /**
   * The optional case starts from an EMPTY field and picks a day first, which
   * is both the real gesture and the only honest way to watch the trigger fall
   * back to its placeholder: react-hook-form re-reads a field set to
   * `undefined` through its own defaultValues, so a harness that seeds
   * `day: someDate` sees the seeded date reappear in the trigger even though
   * the form value is undefined. Today's cell is used because a calendar with
   * no value opens on the current month.
   */
  it('clears an optional field, the only clear gesture it has', () => {
    // react-day-picker stamps the ISO day on the <td>; the button inside it is
    // the interactive target. Built from local getters so the runner's ICU
    // locale plays no part.
    // Captured once, so a midnight between the two clicks cannot move the
    // target to the next day.
    const todayIso = (() => {
      const now = new Date()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      return `${now.getFullYear()}-${mm}-${dd}`
    })()
    const todayCell = () =>
      document.querySelector<HTMLElement>(`td[data-day="${todayIso}"] button`)!

    render(<Harness />)
    fireEvent.click(screen.getByTestId('day-trigger'))

    fireEvent.click(todayCell())
    expect(screen.getByTestId('day-value')).not.toHaveTextContent('unset')

    fireEvent.click(todayCell())
    expect(screen.getByTestId('day-value')).toHaveTextContent('unset')
    expect(screen.getByTestId('day-trigger')).toHaveTextContent('Pick a day')
  })

  it('keeps the value on a required field', () => {
    render(<Harness defaultValue={MARCH_12} required />)

    fireEvent.click(screen.getByTestId('day-trigger'))
    fireEvent.click(screen.getByLabelText(/March 12th, 2026/))

    expect(screen.getByTestId('day-value')).toHaveTextContent('2026-3-12')
  })
})

describe('DatePickerField locale', () => {
  it('falls back to en-US when no locale is given', () => {
    render(<Harness defaultValue={MARCH_12} />)

    fireEvent.click(screen.getByTestId('day-trigger'))

    expect(screen.getByText('March 2026')).toBeInTheDocument()
  })

  it('renders month names in the locale it is given', () => {
    render(<Harness defaultValue={MARCH_12} locale={ptBR} />)

    fireEvent.click(screen.getByTestId('day-trigger'))

    expect(screen.getByText(/março/i)).toBeInTheDocument()
    expect(screen.queryByText('March 2026')).not.toBeInTheDocument()
  })
})
