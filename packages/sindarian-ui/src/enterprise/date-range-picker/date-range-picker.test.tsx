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

  // The dialog attributes Radix puts on a trigger (aria-haspopup,
  // aria-expanded, aria-controls) are only legal on an element with a role that
  // allows them. Wrapping the whole two-button row in one `PopoverTrigger
  // asChild` stamped them onto a plain, non-focusable <div> — an
  // aria-allowed-attr violation, and focus Radix could drop on document.body
  // when the popover closed. Each segment is its own real button trigger now.
  it.each([
    ['From', 'date-from'],
    ['To', 'date-to']
  ])('makes the %s segment a focusable button trigger', (label, id) => {
    setup({ from: '', to: '' })
    const trigger = screen.getByLabelText(label)

    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger).toHaveAttribute('id', id)
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    trigger.focus()
    expect(trigger).toHaveFocus()
  })

  it('carries no dialog attributes on a non-interactive wrapper', () => {
    const { container } = setup({ from: '', to: '' })

    // Every element advertising a popup must itself be a button; a div holding
    // aria-expanded is exactly the violation this replaced.
    for (const el of container.querySelectorAll(
      '[aria-expanded], [aria-haspopup], [aria-controls]'
    )) {
      expect(el.tagName).toBe('BUTTON')
    }
  })

  it('expands only the segment that was clicked', () => {
    setup({ from: '', to: '' })

    fireEvent.click(screen.getByLabelText('To'))
    expect(screen.getByLabelText('To')).toHaveAttribute('aria-expanded', 'true')
    // The other segment must not claim to be expanded: one shared open state
    // across two triggers had both reporting the same value.
    expect(screen.getByLabelText('From')).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })

  it('opens the same range calendar from either segment', () => {
    const { onValueChange } = setup({ from: '2026-03-10', to: '' })

    // Opened from the "to" segment, the calendar still edits the one shared
    // range — the segment picks the anchor, never a separate selection.
    fireEvent.click(screen.getByLabelText('To'))
    fireEvent.click(screen.getByLabelText('Thursday, March 12th, 2026'))

    expect(onValueChange).toHaveBeenCalledWith({
      from: '2026-03-10',
      to: '2026-03-12'
    })
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

  it('disables the clear control only when both ends are empty', () => {
    setup({ from: '', to: '' })

    fireEvent.click(screen.getByLabelText('From'))
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled()
  })

  it('can clear a value the calendar cannot parse', () => {
    // Clear is gated on the raw strings, not the parsed dates — otherwise an
    // unparseable value strands the field with text the user cannot remove.
    const { onValueChange } = setup({ from: 'not-a-date', to: '' })

    fireEvent.click(screen.getByLabelText('From'))
    const clear = screen.getByRole('button', { name: 'Clear' })
    expect(clear).toBeEnabled()

    fireEvent.click(clear)
    expect(onValueChange).toHaveBeenCalledWith({ from: '', to: '' })
  })

  it('emits the picked day as a local-time YYYY-MM-DD string', () => {
    const { onValueChange } = setup({ from: '2026-03-10', to: '' })

    fireEvent.click(screen.getByLabelText('From'))
    // Query the day by the name a screen-reader user would hear, so the test
    // fails if the calendar ever stops announcing its days. (By label, not by
    // role+name: the day's <td> inherits the same name from this button.)
    fireEvent.click(screen.getByLabelText('Thursday, March 12th, 2026'))

    expect(onValueChange).toHaveBeenCalledTimes(1)
    const emitted = onValueChange.mock.calls[0][0] as DateRangeValue
    // The local-time round trip must not shift the day (the toISOString trap).
    expect(emitted.from).toBe('2026-03-10')
    expect(emitted.to).toBe('2026-03-12')
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
