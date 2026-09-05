import { fireEvent, render, screen } from '@testing-library/react'
import { ptBR } from 'react-day-picker/locale'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { DateRangeField, type DateRangeFieldProps } from '.'

type Values = { window: { from: Date; to: Date } }

function Harness({
  locale
}: {
  locale?: DateRangeFieldProps<Values>['locale']
}) {
  const form = useForm<Values>({
    defaultValues: {
      window: { from: new Date(2026, 2, 12), to: new Date(2026, 2, 18) }
    }
  })

  return (
    <Form {...form}>
      <DateRangeField
        control={form.control}
        name="window"
        label="Window"
        numberOfMonths={1}
        data-testid="window"
        locale={locale}
      />
    </Form>
  )
}

function openCalendar() {
  fireEvent.click(screen.getByTestId('window'))
}

describe('DateRangeField locale', () => {
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
