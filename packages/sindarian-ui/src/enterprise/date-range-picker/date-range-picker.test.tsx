import { fireEvent, render, screen } from '@testing-library/react'
import { DateRangePicker, type DateRangeValue } from '.'

function setup(value: DateRangeValue, onValueChange = jest.fn()) {
  const { container } = render(
    <DateRangePicker
      value={value}
      onValueChange={onValueChange}
      fromId="date-from"
      toId="date-to"
      fromLabel="From"
      toLabel="To"
    />
  )
  return { container, onValueChange }
}

describe('DateRangePicker', () => {
  it('renders two labelled triggers showing the current values', () => {
    setup({ from: '2026-01-05', to: '2026-01-20' })

    expect(screen.getByLabelText('From')).toHaveAttribute('id', 'date-from')
    expect(screen.getByLabelText('To')).toHaveAttribute('id', 'date-to')
    expect(screen.getByText('2026-01-05')).toBeInTheDocument()
    expect(screen.getByText('2026-01-20')).toBeInTheDocument()
  })

  it('shows the placeholder on both triggers when unset', () => {
    setup({ from: '', to: '' })
    expect(screen.getAllByText('Any date')).toHaveLength(2)
  })

  it('wires aria-invalid and aria-describedby only while invalid', () => {
    const { rerender } = render(
      <DateRangePicker
        value={{ from: '', to: '' }}
        onValueChange={jest.fn()}
        fromId="f"
        toId="t"
        fromLabel="From"
        toLabel="To"
      />
    )
    expect(screen.getByLabelText('From')).not.toHaveAttribute('aria-invalid')

    rerender(
      <DateRangePicker
        value={{ from: '', to: '' }}
        onValueChange={jest.fn()}
        fromId="f"
        toId="t"
        fromLabel="From"
        toLabel="To"
        invalid
        errorId="range-error"
      />
    )
    const from = screen.getByLabelText('From')
    expect(from).toHaveAttribute('aria-invalid', 'true')
    expect(from).toHaveAttribute('aria-describedby', 'range-error')
  })

  it('opens the calendar popover from a trigger', () => {
    setup({ from: '', to: '' })

    expect(screen.getByLabelText('From')).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    fireEvent.click(screen.getByLabelText('From'))
    expect(screen.getByLabelText('From')).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('clears both ends through the clear control', () => {
    const { onValueChange } = setup({ from: '2026-01-05', to: '2026-01-20' })

    fireEvent.click(screen.getByLabelText('From'))
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(onValueChange).toHaveBeenCalledWith({ from: '', to: '' })
  })

  it('disables the clear control when nothing is selected', () => {
    setup({ from: '', to: '' })

    fireEvent.click(screen.getByLabelText('From'))
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()
  })

  it('emits the picked day as a local-time YYYY-MM-DD string', () => {
    const { container, onValueChange } = setup({ from: '2026-03-10', to: '' })

    fireEvent.click(screen.getByLabelText('From'))
    // The calendar opens on the `from` month, so the 12th is on screen. The
    // day cell carries data-day; its inner button is the click target.
    const cell = document.querySelector('[data-day="2026-03-12"] button')
    expect(cell).toBeTruthy()
    fireEvent.click(cell as HTMLElement)

    expect(onValueChange).toHaveBeenCalledTimes(1)
    const emitted = onValueChange.mock.calls[0][0] as DateRangeValue
    // The local-time round trip must not shift the day (the toISOString trap).
    expect(emitted.from).toBe('2026-03-10')
    expect(emitted.to).toBe('2026-03-12')
    expect(container).toBeTruthy()
  })

  it('renders raw text for an unparseable or impossible day without crashing', () => {
    setup({ from: 'not-a-date', to: '2026-02-31' })

    expect(screen.queryAllByText('Any date')).toHaveLength(0)
    // The raw strings still render on the triggers; only the calendar
    // selection drops them.
    expect(screen.getByText('not-a-date')).toBeInTheDocument()
    expect(screen.getByText('2026-02-31')).toBeInTheDocument()
  })
})
