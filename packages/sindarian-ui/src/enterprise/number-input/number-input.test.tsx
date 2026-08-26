import { fireEvent, render, screen } from '@testing-library/react'
import { isTransientPartial, NumberInput, parseRaw } from '.'

describe('parseRaw', () => {
  it.each([
    ['en-US', '1,234.56', 1234.56],
    ['en-US', '-9,876.5', -9876.5],
    ['pt-BR', '1.234,56', 1234.56],
    ['pt-BR', '-9.876,5', -9876.5]
  ] as const)('parses %s numeric input %s', (locale, raw, expected) => {
    expect(parseRaw(raw, locale)).toBe(expected)
  })

  it('rejects an invalid draft and maps an empty draft to null', () => {
    expect(parseRaw('not-a-number', 'en-US')).toBeNull()
    expect(parseRaw('', 'en-US')).toBeNull()
    expect(parseRaw('   ', 'pt-BR')).toBeNull()
  })
})

describe('isTransientPartial', () => {
  it.each([
    ['', false],
    ['-', true],
    ['+', false],
    ['.', true],
    [',', false],
    ['1.', true],
    ['1,', false],
    ['12', false],
    ['12.5', false]
  ] as const)('classifies transient draft %j', (draft, expected) => {
    expect(isTransientPartial(draft, 'en-US')).toBe(expected)
  })

  it('follows the locale decimal mark', () => {
    expect(isTransientPartial('1,', 'pt-BR')).toBe(true)
    expect(isTransientPartial('1.', 'pt-BR')).toBe(false)
  })
})

describe('NumberInput', () => {
  it('renders the locale-formatted value and its spinbutton range', () => {
    render(
      <NumberInput
        id="amount"
        value={1234.5}
        onValueChange={jest.fn()}
        locale="pt-BR"
        precision={2}
        min={0}
        max={2000}
        step={0.5}
        aria-label="Settlement amount"
        aria-describedby="amount-help"
      />
    )

    const input = screen.getByRole('spinbutton', { name: 'Settlement amount' })
    expect(input).toHaveValue('1.234,50')
    expect(input).toHaveAttribute('aria-valuemin', '0')
    expect(input).toHaveAttribute('aria-valuemax', '2000')
    expect(input).toHaveAttribute('aria-valuenow', '1234.5')
    expect(input).toHaveAttribute('aria-describedby', 'amount-help')
  })

  it('renders a null value as an empty field', () => {
    render(
      <NumberInput
        value={null}
        onValueChange={jest.fn()}
        placeholder="Enter amount"
      />
    )

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue('')
    expect(input).toHaveAttribute('placeholder', 'Enter amount')
    expect(input).not.toHaveAttribute('aria-valuenow')
  })

  it('disables the input and both untabbable step controls', () => {
    render(<NumberInput value={5} onValueChange={jest.fn()} disabled />)

    expect(screen.getByRole('spinbutton')).toBeDisabled()
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    buttons.forEach((button) => {
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('tabindex', '-1')
    })
  })

  it('steps by `step` and clamps to the bounds', () => {
    const onValueChange = jest.fn()
    render(
      <NumberInput
        value={9.5}
        onValueChange={onValueChange}
        step={0.5}
        min={0}
        max={10}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Increase' }))
    expect(onValueChange).toHaveBeenLastCalledWith(10)

    fireEvent.click(screen.getByRole('button', { name: 'Decrease' }))
    expect(onValueChange).toHaveBeenLastCalledWith(9)
  })

  it.each([
    [0.1, 0.2, 0.30000000000000004, 0.3],
    [0.7, 0.1, 0.7999999999999999, 0.8],
    [1.1, 2.2, 3.3000000000000003, 3.3]
  ])(
    'snaps float drift when stepping %d by %d',
    (initial, step, drifted, expected) => {
      const onValueChange = jest.fn()
      render(
        <NumberInput
          value={initial}
          onValueChange={onValueChange}
          step={step}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Increase' }))
      // Guard the premise: raw arithmetic really does drift here.
      expect(initial + step).toBe(drifted)
      expect(onValueChange).toHaveBeenLastCalledWith(expected)
    }
  )

  it('snaps to precision when precision is wider than the step', () => {
    const onValueChange = jest.fn()
    render(
      <NumberInput
        value={0.1}
        onValueChange={onValueChange}
        step={0.2}
        precision={4}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Increase' }))
    expect(onValueChange).toHaveBeenLastCalledWith(0.3)
  })

  it.each([1e-7, 1e-10, 1e-15])(
    'steps by a very fine step (%p) without snapping it away',
    (step) => {
      const onValueChange = jest.fn()
      const { rerender } = render(
        <NumberInput value={0} onValueChange={onValueChange} step={step} />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Increase' }))
      expect(onValueChange).toHaveBeenLastCalledWith(step)

      // And it keeps accumulating rather than collapsing back to zero.
      rerender(
        <NumberInput value={step} onValueChange={onValueChange} step={step} />
      )
      fireEvent.click(screen.getByRole('button', { name: 'Increase' }))
      expect(onValueChange).toHaveBeenLastCalledWith(step * 2)
    }
  )

  it('snaps drift out of a fine-step accumulation', () => {
    const onValueChange = jest.fn()
    // 2e-7 + 1e-7 drifts to 3.0000000000000004e-7 in raw float arithmetic.
    render(
      <NumberInput value={2e-7} onValueChange={onValueChange} step={1e-7} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Increase' }))
    expect(onValueChange).toHaveBeenLastCalledWith(3e-7)
  })

  it.each([
    [1e12, 0.5, 1000000000000.5],
    [1e15, 0.5, 1000000000000000.5],
    [1e15, 0.125, 1000000000000000.125]
  ])(
    'keeps a representable fractional result at magnitude %p',
    (value, step, expected) => {
      // Snapping to a fixed count of SIGNIFICANT digits would round these back
      // to the whole number and freeze the stepper; the fraction digits here
      // come from the operands, so they survive.
      const onValueChange = jest.fn()
      render(
        <NumberInput value={value} onValueChange={onValueChange} step={step} />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Increase' }))
      expect(onValueChange).toHaveBeenLastCalledWith(expected)
      expect(onValueChange).not.toHaveBeenLastCalledWith(value)
    }
  )

  it('never steps past max when snapping would round the bound up', () => {
    // 0.2 + 0.1 drifts to 0.30000000000000004; clamping to max first and
    // snapping second rounds the BOUND (0.25 -> one digit -> 0.3) and escapes
    // the maximum.
    const onValueChange = jest.fn()
    render(
      <NumberInput
        value={0.2}
        onValueChange={onValueChange}
        step={0.1}
        max={0.25}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Increase' }))
    expect(onValueChange).toHaveBeenLastCalledWith(0.25)
  })

  it('never steps below min when snapping would round the bound down', () => {
    // Mirror case: 0.3 - 0.1 drifts to 0.19999999999999998. Clamping first and
    // snapping second turned a DECREASE into 0.3 — the value never moved.
    const onValueChange = jest.fn()
    render(
      <NumberInput
        value={0.3}
        onValueChange={onValueChange}
        step={0.1}
        min={0.25}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Decrease' }))
    expect(onValueChange).toHaveBeenLastCalledWith(0.25)
  })

  it('emits a bound exactly as given, without re-snapping it', () => {
    // A bound carrying more fraction digits than the step must survive intact.
    const onValueChange = jest.fn()
    render(
      <NumberInput
        value={0.2}
        onValueChange={onValueChange}
        step={0.1}
        max={0.2500000001}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Increase' }))
    expect(onValueChange).toHaveBeenLastCalledWith(0.2500000001)
  })

  it('still snaps drift when the result is inside the bounds', () => {
    // Reordering must not cost the drift repair on the ordinary path.
    const onValueChange = jest.fn()
    render(
      <NumberInput
        value={0.1}
        onValueChange={onValueChange}
        step={0.2}
        min={0}
        max={10}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Increase' }))
    expect(onValueChange).toHaveBeenLastCalledWith(0.3)
  })

  it('disables the steppers at the bounds', () => {
    const { rerender } = render(
      <NumberInput value={0} onValueChange={jest.fn()} min={0} max={10} />
    )
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Increase' })).toBeEnabled()

    rerender(
      <NumberInput value={10} onValueChange={jest.fn()} min={0} max={10} />
    )
    expect(screen.getByRole('button', { name: 'Decrease' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled()
  })

  it('steps with ArrowUp / ArrowDown on the field', () => {
    const onValueChange = jest.fn()
    render(<NumberInput value={4} onValueChange={onValueChange} step={2} />)

    const input = screen.getByRole('spinbutton')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(onValueChange).toHaveBeenLastCalledWith(6)

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(onValueChange).toHaveBeenLastCalledWith(2)
  })

  it('commits a parsed edit and a genuine clear, but never a transient partial', () => {
    const onValueChange = jest.fn()
    render(
      <NumberInput value={1} onValueChange={onValueChange} locale="en-US" />
    )

    const input = screen.getByRole('spinbutton')
    fireEvent.focus(input)

    fireEvent.change(input, { target: { value: '-' } })
    expect(onValueChange).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: '-12.' } })
    expect(onValueChange).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: '-12.5' } })
    expect(onValueChange).toHaveBeenLastCalledWith(-12.5)

    fireEvent.change(input, { target: { value: '' } })
    expect(onValueChange).toHaveBeenLastCalledWith(null)
  })

  it('re-clamps an out-of-range committed value on blur', () => {
    const onValueChange = jest.fn()
    render(
      <NumberInput value={99} onValueChange={onValueChange} min={0} max={10} />
    )

    fireEvent.blur(screen.getByRole('spinbutton'))
    expect(onValueChange).toHaveBeenCalledWith(10)
  })

  it('shows the editable draft while focused and reformats on blur', () => {
    const { rerender } = render(
      <NumberInput
        value={1234.5}
        onValueChange={jest.fn()}
        locale="en-US"
        precision={2}
      />
    )

    const input = screen.getByRole('spinbutton')
    expect(input).toHaveValue('1,234.50')

    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '7' } })
    expect(input).toHaveValue('7')

    fireEvent.blur(input)
    rerender(
      <NumberInput
        value={7}
        onValueChange={jest.fn()}
        locale="en-US"
        precision={2}
      />
    )
    expect(input).toHaveValue('7.00')
  })
})

// --- non-finite entries and unusable steps ---------------------------------
describe('parseRaw non-finite guard', () => {
  it.each([['1e999'], ['Infinity'], ['-Infinity'], ['-1e999']])(
    'rejects %p rather than committing a non-finite number',
    (raw) => {
      // Number('1e999') is Infinity, which passed the old NaN-only check and
      // was committed straight to onValueChange.
      expect(parseRaw(raw)).toBeNull()
    }
  )

  it('still parses ordinary and exponential finite values', () => {
    expect(parseRaw('1e3')).toBe(1000)
    expect(parseRaw('-2.5')).toBe(-2.5)
  })
})

describe('NumberInput unusable step', () => {
  const bad: Array<[string, number]> = [
    ['negative', -5],
    ['zero', 0],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY]
  ]

  it.each(bad)('falls back to a step of 1 for a %s step', (_kind, step) => {
    // A negative step reversed the buttons, zero/NaN never progressed (and NaN
    // escaped into the form), and an infinite step committed Infinity with no max.
    const onValueChange = jest.fn()
    render(
      <NumberInput
        value={10}
        onValueChange={onValueChange}
        step={step}
        aria-label="Amount"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Increase Amount' }))
    expect(onValueChange).toHaveBeenLastCalledWith(11)

    fireEvent.click(screen.getByRole('button', { name: 'Decrease Amount' }))
    expect(onValueChange).toHaveBeenLastCalledWith(9)
  })

  it('still honours a valid step', () => {
    const onValueChange = jest.fn()
    render(
      <NumberInput
        value={10}
        onValueChange={onValueChange}
        step={0.25}
        aria-label="Amount"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Increase Amount' }))
    expect(onValueChange).toHaveBeenLastCalledWith(10.25)
  })
})
