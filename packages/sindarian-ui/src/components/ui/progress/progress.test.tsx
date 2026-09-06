import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { Progress } from '.'

/**
 * `value` was destructured out of the props and spent only on a CSS translate,
 * so it never reached the Radix root. The bar moved, but the root reported
 * nothing: no `aria-valuenow`, and `data-state` stuck on `indeterminate` at
 * every value including a finished 100. `max` reached the root but not the
 * translate, so any scale other than 0 to 100 drew a bar that disagreed with
 * the number the root announced. A consumer hand-rolled its own progress
 * component to get the reported state back.
 *
 * The pairing is the point of these tests: whatever the root announces, the bar
 * has to draw.
 */
function indicator(): HTMLElement {
  const element = screen
    .getByRole('progressbar')
    .querySelector<HTMLElement>('[data-slot="progress-indicator"]')

  if (!element) {
    throw new Error('progress indicator did not render')
  }

  return element
}

describe('Progress reported state', () => {
  it('reports the value it was given', () => {
    render(<Progress value={40} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '40'
    )
  })

  it('defaults the reported scale to 100', () => {
    render(<Progress value={40} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuemax',
      '100'
    )
  })

  it('reports the max it was given', () => {
    render(<Progress value={40} max={200} />)

    const bar = screen.getByRole('progressbar')

    expect(bar).toHaveAttribute('aria-valuemax', '200')
    expect(bar).toHaveAttribute('aria-valuenow', '40')
  })

  it('reads as loading below the max', () => {
    render(<Progress value={40} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'data-state',
      'loading'
    )
  })

  it('reads as complete at the default max', () => {
    render(<Progress value={100} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'data-state',
      'complete'
    )
  })

  it('reads as complete at a custom max', () => {
    render(<Progress value={200} max={200} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'data-state',
      'complete'
    )
  })

  it('reads as indeterminate with no value', () => {
    render(<Progress />)

    const bar = screen.getByRole('progressbar')

    expect(bar).toHaveAttribute('data-state', 'indeterminate')
    expect(bar).not.toHaveAttribute('aria-valuenow')
  })

  it('reads as indeterminate for an explicit null value', () => {
    render(<Progress value={null} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'data-state',
      'indeterminate'
    )
  })
})

describe('Progress bar geometry', () => {
  it('draws the fraction of the default scale', () => {
    render(<Progress value={40} />)

    expect(indicator().style.transform).toBe('translateX(-60%)')
  })

  it('draws against a custom max instead of assuming 100', () => {
    render(<Progress value={50} max={200} />)

    expect(indicator().style.transform).toBe('translateX(-75%)')
  })

  it('draws a full bar at a custom max', () => {
    render(<Progress value={200} max={200} />)

    expect(indicator().style.transform).toBe('translateX(-0%)')
  })

  it('draws an empty bar when indeterminate', () => {
    render(<Progress />)

    expect(indicator().style.transform).toBe('translateX(-100%)')
  })

  it('falls back to the default scale when max is not positive', () => {
    // Radix rejects a non-positive max and reports against 100 instead. The bar
    // has to make the same substitution, or a max of 0 divides by zero and
    // emits a transform the browser silently drops, leaving a full bar under an
    // `aria-valuenow` of 40. The substitution happens before the root sees the
    // number, so Radix is handed a max it accepts and never logs.
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    render(<Progress value={40} max={0} />)

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuemax',
      '100'
    )
    expect(indicator().style.transform).toBe('translateX(-60%)')
    expect(consoleError).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })
})

/**
 * Out of range was the one case where the two halves still disagreed. Radix
 * accepts a value only inside `[0, max]`: outside it the root dropped
 * `aria-valuenow` entirely, stuck `data-state` on `indeterminate` and logged an
 * error, while the indicator below went on drawing the clamped bar. A screen
 * reader was told "no value" over a bar reading 100%.
 *
 * Bounding both numbers before the root sees them makes the pair agree again,
 * and takes the console noise with it.
 */
describe('Progress out of range', () => {
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('reports and draws the max for a value above it', () => {
    render(<Progress value={150} max={100} />)

    const bar = screen.getByRole('progressbar')

    expect(bar).toHaveAttribute('aria-valuenow', '100')
    expect(bar).toHaveAttribute('data-state', 'complete')
    expect(indicator().style.transform).toBe('translateX(-0%)')
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('reports and draws zero for a negative value', () => {
    render(<Progress value={-5} />)

    const bar = screen.getByRole('progressbar')

    expect(bar).toHaveAttribute('aria-valuenow', '0')
    expect(bar).toHaveAttribute('data-state', 'loading')
    expect(indicator().style.transform).toBe('translateX(-100%)')
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('falls back to the default scale for a negative max', () => {
    render(<Progress value={40} max={-1} />)

    const bar = screen.getByRole('progressbar')

    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-valuenow', '40')
    expect(indicator().style.transform).toBe('translateX(-60%)')
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('bounds the value against the substituted scale, not the rejected one', () => {
    // `max` of 0 becomes 100, so a value of 150 is clamped to 100 rather than
    // to the max the caller wrote. Clamping to 0 would report a finished bar as
    // empty.
    render(<Progress value={150} max={0} />)

    const bar = screen.getByRole('progressbar')

    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-valuenow', '100')
    expect(indicator().style.transform).toBe('translateX(-0%)')
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('leaves the indeterminate state alone', () => {
    render(<Progress value={null} max={-1} />)

    const bar = screen.getByRole('progressbar')

    expect(bar).toHaveAttribute('data-state', 'indeterminate')
    expect(bar).not.toHaveAttribute('aria-valuenow')
    expect(indicator().style.transform).toBe('translateX(-100%)')
    expect(consoleError).not.toHaveBeenCalled()
  })

  it('treats a non-finite value as indeterminate without invalid geometry', () => {
    render(<Progress value={Number.NaN} />)

    const bar = screen.getByRole('progressbar')

    expect(bar).toHaveAttribute('data-state', 'indeterminate')
    expect(bar).not.toHaveAttribute('aria-valuenow')
    expect(indicator().style.transform).toBe('translateX(-100%)')
  })

  it('falls back to the default scale for a non-finite max', () => {
    render(<Progress value={40} max={Number.POSITIVE_INFINITY} />)

    const bar = screen.getByRole('progressbar')

    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-valuenow', '40')
    expect(indicator().style.transform).toBe('translateX(-60%)')
  })
})
