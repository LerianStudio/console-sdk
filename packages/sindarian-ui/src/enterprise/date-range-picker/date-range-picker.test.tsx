import { fireEvent, render, screen } from '@testing-library/react'
import {
  DateRangePicker,
  type DateRangePickerProps,
  type DateRangeValue
} from '.'

function setup(
  value: DateRangeValue,
  onValueChange = jest.fn(),
  extra: Partial<DateRangePickerProps> = {}
) {
  const { container } = render(
    <DateRangePicker
      value={value}
      onValueChange={onValueChange}
      fromId="date-from"
      toId="date-to"
      fromLabel="From"
      toLabel="To"
      {...extra}
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
    // Query the day by the role and the name a screen-reader user would hear,
    // so the test fails if the calendar ever stops announcing its days. The
    // name resolves to exactly one node now that the day button no longer
    // carries a duplicate gridcell role alongside its own <td>.
    fireEvent.click(
      screen.getByRole('button', { name: 'Thursday, March 12th, 2026' })
    )

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

/**
 * Both segment labels were painted with the kit's quiet-label voice
 * (`text-[11px] uppercase tracking-[0.08em]`), which OVERRODE the console's own
 * `Label` voice on the very primitive that defines it: these are field labels
 * pointing at a control, not ledger column heads. Passing no className lets the
 * `Label` primitive's `text-sm font-medium` through, so the picker's labels
 * match every other labelled field in the console and the picker stops
 * depending on the shared label constant at all.
 */
describe('DateRangePicker label voice', () => {
  const labels = () => [screen.getByText('From'), screen.getByText('To')]

  it('speaks the console field-label voice on both segments', () => {
    setup({ from: '', to: '' })

    for (const label of labels()) {
      expect(label).toHaveClass('text-sm', 'font-medium')
    }
  })

  it('no longer shouts the ledger column-head voice', () => {
    setup({ from: '', to: '' })

    for (const label of labels()) {
      expect(label).not.toHaveClass('uppercase')
      expect(label).not.toHaveClass('tracking-[0.08em]')
      expect(label).not.toHaveClass('text-[11px]')
    }
  })
})

/**
 * The trigger sat on `border-input`, a SURFACE token that is white in the light
 * theme, so the control had no visible edge while the `Input` and `Select` next
 * to it did. It also printed the dates in the code face, which no other figure
 * in the console uses. The border now matches what `Input`, `Select` and
 * `DatePickerField` already resolve to (`--color-shadcn-400`), and the dates
 * render in the body face with tabular figures, the same shape the `Figure`
 * domain component is pinned to.
 */
describe('DateRangePicker trigger', () => {
  const triggers = () => [
    screen.getByLabelText('From'),
    screen.getByLabelText('To')
  ]

  it('draws a visible border in both themes', () => {
    setup({ from: '2026-01-05', to: '2026-01-20' })

    for (const trigger of triggers()) {
      expect(trigger).toHaveClass('border-shadcn-400')
      expect(trigger).not.toHaveClass('border-input')
    }
  })

  it('prints the dates in the body face with tabular figures', () => {
    setup({ from: '2026-01-05', to: '2026-01-20' })

    for (const trigger of triggers()) {
      expect(trigger).toHaveClass('font-sans', 'text-sm', 'tabular-nums')
      expect(trigger).not.toHaveClass('font-mono')
    }
  })

  it('still turns the border destructive while invalid', () => {
    setup({ from: '', to: '' }, jest.fn(), { invalid: true })

    for (const trigger of triggers()) {
      expect(trigger).toHaveClass('border-destructive')
    }
  })
})

/**
 * A mandatory window could not announce itself. The marker is the library's
 * own: the literal ' *' appended to the label text, exactly as `FormLabel`
 * renders it, so a required range reads the same as every required form field
 * in the console. It deliberately does NOT become `aria-required` on the
 * triggers: ARIA does not allow that attribute on `role="button"`, and axe
 * `aria-allowed-attr` flags it.
 */
describe('DateRangePicker required', () => {
  const labelFor = (container: HTMLElement, id: string) =>
    container.querySelector(`label[for="${id}"]`)

  it('appends the library required marker to both labels', () => {
    const { container } = setup({ from: '', to: '' }, jest.fn(), {
      required: true
    })

    expect(labelFor(container, 'date-from')?.textContent).toBe('From *')
    expect(labelFor(container, 'date-to')?.textContent).toBe('To *')
  })

  it('leaves both labels unmarked without required', () => {
    const { container } = setup({ from: '', to: '' })

    expect(labelFor(container, 'date-from')?.textContent).toBe('From')
    expect(labelFor(container, 'date-to')?.textContent).toBe('To')
  })

  it('puts no aria-required on the triggers', () => {
    setup({ from: '', to: '' }, jest.fn(), { required: true })

    for (const name of ['From *', 'To *']) {
      expect(screen.getByLabelText(name)).not.toHaveAttribute('aria-required')
    }
  })
})

/**
 * A surface that suspends its own date window (Matcher's unmatched workbench in
 * "show all" mode) had no way to say so through the library and wrapped the
 * picker in a native disabled `<fieldset>` instead. `disabled` is the seam. It
 * is the native attribute on both triggers, not `aria-disabled`: that is what
 * takes them out of the tab order and, because `PopoverContent` is portaled to
 * `document.body`, a shut popover is the only thing keeping the calendar's
 * Clear button out of reach.
 */
describe('DateRangePicker disabled', () => {
  const triggers = () => [
    screen.getByLabelText('From'),
    screen.getByLabelText('To')
  ]

  it('disables both trigger segments natively', () => {
    setup({ from: '2026-01-05', to: '2026-01-20' }, jest.fn(), {
      disabled: true
    })

    for (const trigger of triggers()) {
      expect(trigger).toBeDisabled()
      // aria-disabled would leave the trigger focusable and clickable, so the
      // popover (and the Clear button inside it) would stay reachable.
      expect(trigger).not.toHaveAttribute('aria-disabled')
    }
  })

  it('opens nothing when a disabled trigger is clicked', () => {
    setup({ from: '', to: '' }, jest.fn(), { disabled: true })

    fireEvent.click(screen.getByLabelText('From'))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('From')).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('leaves the triggers untouched when the prop is absent', () => {
    setup({ from: '2026-01-05', to: '2026-01-20' })

    for (const trigger of triggers()) {
      expect(trigger).not.toHaveAttribute('disabled')
      expect(trigger).toBeEnabled()
      expect(trigger).not.toHaveClass('cursor-not-allowed')
      expect(trigger).not.toHaveClass('opacity-50')
    }
  })

  it('still opens the calendar with the prop absent', () => {
    setup({ from: '', to: '' })

    fireEvent.click(screen.getByLabelText('From'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not reopen the calendar when disabled is lifted again', () => {
    // The open segment used to survive the suspension: `disabled` only gated
    // the `open` prop, so lifting it re-satisfied the same condition and the
    // portaled calendar came back with no user gesture, taking focus with it.
    const view = (disabled: boolean) => (
      <DateRangePicker
        value={{ from: '', to: '' }}
        onValueChange={jest.fn()}
        fromId="date-from"
        toId="date-to"
        fromLabel="From"
        toLabel="To"
        disabled={disabled}
      />
    )

    const { rerender } = render(view(false))
    fireEvent.click(screen.getByLabelText('From'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    rerender(view(true))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    rerender(view(false))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    for (const trigger of triggers()) {
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    }
  })
})
