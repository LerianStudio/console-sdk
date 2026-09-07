import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { ToggleGroup, ToggleGroupItem } from '.'

describe('ToggleGroup', () => {
  it('turns the clicked item on and reports the value', () => {
    const onValueChange = jest.fn()
    render(
      <ToggleGroup type="single" onValueChange={onValueChange}>
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
      </ToggleGroup>
    )

    const week = screen.getByRole('radio', { name: 'Week' })
    expect(week).toHaveAttribute('data-state', 'off')

    fireEvent.click(week)

    expect(onValueChange).toHaveBeenCalledWith('week')
    expect(week).toHaveAttribute('data-state', 'on')
  })

  it('keeps a caller style alongside the internal gap variable', () => {
    const { container } = render(
      <ToggleGroup
        type="single"
        spacing={2}
        style={{ backgroundColor: 'rgb(1, 2, 3)' }}
      >
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
      </ToggleGroup>
    )

    const group = container.querySelector<HTMLElement>(
      '[data-slot="toggle-group"]'
    )!
    expect(group.style.backgroundColor).toBe('rgb(1, 2, 3)')
    expect(group.style.getPropertyValue('--gap')).toBe('2')
  })

  it('passes the group variant and size down to its items', () => {
    render(
      <ToggleGroup type="single" variant="outline" size="sm">
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
      </ToggleGroup>
    )

    const item = screen.getByRole('radio', { name: 'Day' })
    expect(item).toHaveAttribute('data-variant', 'outline')
    expect(item).toHaveAttribute('data-size', 'sm')
  })
})

/**
 * `type="single"` puts the group on the ARIA radio pattern: the root is a
 * `radiogroup`, every item a `radio` carrying `aria-checked`. That pattern is
 * selection-follows-focus — an arrow key moves focus AND checks the item it
 * lands on. Without it a screen-reader operator arrows across "radio, not
 * checked, 2 of 3" and nothing is ever selected, because the roving focus that
 * Radix installs only MOVES focus.
 *
 * `type="multiple"` is a `toolbar` of `aria-pressed` buttons, where moving
 * focus without pressing is the correct behavior. It must stay untouched.
 *
 * RovingFocusGroup defers its focus move to a `setTimeout`
 * (`react-roving-focus`: `setTimeout(() => focusFirst(candidateNodes))`), so
 * every arrow-key assertion here has to flush pending timers before reading
 * the result.
 */
describe('ToggleGroup selection follows focus', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  /** Focus moves the roving tab stop, which is React state. */
  function focus(element: HTMLElement) {
    act(() => {
      element.focus()
    })
  }

  /** One arrow keystroke, plus the deferred focus move it schedules. */
  function pressArrow(from: HTMLElement, key: string) {
    fireEvent.keyDown(from, { key })
    act(() => {
      jest.runOnlyPendingTimers()
    })
  }

  it('checks the item an arrow key moves to in a single-select group', () => {
    const onValueChange = jest.fn()
    render(
      <ToggleGroup
        type="single"
        defaultValue="day"
        onValueChange={onValueChange}
      >
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
        <ToggleGroupItem value="month">Month</ToggleGroupItem>
      </ToggleGroup>
    )

    const day = screen.getByRole('radio', { name: 'Day' })
    const week = screen.getByRole('radio', { name: 'Week' })

    focus(day)
    pressArrow(day, 'ArrowRight')

    expect(week).toHaveFocus()
    expect(week).toHaveAttribute('aria-checked', 'true')
    expect(day).toHaveAttribute('aria-checked', 'false')
    expect(onValueChange).toHaveBeenLastCalledWith('week')
  })

  it('checks the item arrowing backwards lands on', () => {
    const onValueChange = jest.fn()
    render(
      <ToggleGroup
        type="single"
        defaultValue="week"
        onValueChange={onValueChange}
      >
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
      </ToggleGroup>
    )

    const day = screen.getByRole('radio', { name: 'Day' })
    const week = screen.getByRole('radio', { name: 'Week' })

    focus(week)
    pressArrow(week, 'ArrowLeft')

    expect(day).toHaveFocus()
    expect(day).toHaveAttribute('aria-checked', 'true')
    expect(onValueChange).toHaveBeenLastCalledWith('day')
  })

  it('only moves focus in a multi-select group', () => {
    const onValueChange = jest.fn()
    render(
      <ToggleGroup
        type="multiple"
        defaultValue={['day']}
        onValueChange={onValueChange}
      >
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
      </ToggleGroup>
    )

    const day = screen.getByRole('button', { name: 'Day' })
    const week = screen.getByRole('button', { name: 'Week' })

    focus(day)
    pressArrow(day, 'ArrowRight')

    expect(week).toHaveFocus()
    expect(week).toHaveAttribute('aria-pressed', 'false')
    expect(onValueChange).not.toHaveBeenCalled()
  })

  // Guard, not a repair: in a real browser mousedown focuses BEFORE the click
  // lands, so selecting on every focus would turn one click into
  // select-then-deselect and kill mouse selection outright.
  it('leaves the mouse path alone, deselect included', () => {
    const onValueChange = jest.fn()
    render(
      <ToggleGroup type="single" onValueChange={onValueChange}>
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
      </ToggleGroup>
    )

    const week = screen.getByRole('radio', { name: 'Week' })

    focus(week)
    expect(onValueChange).not.toHaveBeenCalled()

    fireEvent.click(week)
    expect(onValueChange).toHaveBeenLastCalledWith('week')
    expect(week).toHaveAttribute('aria-checked', 'true')

    fireEvent.click(week)
    expect(onValueChange).toHaveBeenLastCalledWith('')
    expect(week).toHaveAttribute('aria-checked', 'false')
  })

  it('still calls a caller onFocus on the item it selects', () => {
    const onFocus = jest.fn()
    render(
      <ToggleGroup type="single" defaultValue="day">
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week" onFocus={onFocus}>
          Week
        </ToggleGroupItem>
      </ToggleGroup>
    )

    const day = screen.getByRole('radio', { name: 'Day' })
    const week = screen.getByRole('radio', { name: 'Week' })

    focus(day)
    pressArrow(day, 'ArrowRight')

    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(week).toHaveAttribute('aria-checked', 'true')
  })

  it('does not select on a focus that no arrow key caused', () => {
    const onValueChange = jest.fn()
    render(
      <ToggleGroup type="single" onValueChange={onValueChange}>
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
      </ToggleGroup>
    )

    // Tabbing in, or a programmatic focus, must leave the group untouched:
    // the radio pattern follows arrow navigation, not arrival.
    focus(screen.getByRole('radio', { name: 'Day' }))
    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('clears arrow-key state when the window loses focus', () => {
    const onValueChange = jest.fn()
    render(
      <ToggleGroup type="single" onValueChange={onValueChange}>
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
      </ToggleGroup>
    )

    const day = screen.getByRole('radio', { name: 'Day' })
    const week = screen.getByRole('radio', { name: 'Week' })

    focus(day)
    fireEvent.keyDown(day, { key: 'ArrowRight' })
    fireEvent.blur(window)
    focus(week)

    expect(onValueChange).not.toHaveBeenCalled()
  })
})
