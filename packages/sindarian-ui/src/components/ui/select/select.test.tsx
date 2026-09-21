import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

import { Select, SelectTrigger, SelectValue } from '.'

/**
 * `.select-trigger` is a fixed-height `flex w-full items-center justify-between`
 * box, and a flex item never shrinks below its own min-content width. With
 * nothing constraining the value slot a long selected value wrapped to a second
 * line and overflowed the trigger instead of truncating — measured on a
 * 39-character context name. The constraint belongs in the primitive: it is
 * true of every Select in the kit, not of one screen.
 *
 * It rides the TRIGGER as a descendant-scoped variant because Radix strips
 * `className` off `Select.Value` before rendering the span. DESCENDANT, not
 * `>`: a trigger carrying a leading glyph groups the glyph and the value into
 * one flex child (`SelectField`'s `leadingIcon`), and a direct-child selector
 * stopped truncating the moment a consumer did that — silently, and on the
 * trigger with the least room left.
 */
const MIN_W_0 = '[&_[data-slot=select-value]]:min-w-0'
const TRUNCATE = '[&_[data-slot=select-value]]:truncate'

function renderSelect(className?: string, wrapValue = false) {
  const value = (
    <SelectValue>A settlement context with a very long name</SelectValue>
  )

  const { container } = render(
    <Select defaultValue="ctx">
      <SelectTrigger className={className}>
        {wrapValue ? <span className="flex min-w-0">{value}</span> : value}
      </SelectTrigger>
    </Select>
  )

  return {
    trigger: container.querySelector('[data-slot="select-trigger"]'),
    value: container.querySelector('[data-slot="select-value"]')
  }
}

describe('SelectTrigger value overflow', () => {
  it('lets the value slot shrink below its own min-content width', () => {
    expect(renderSelect().trigger).toHaveClass(MIN_W_0)
  })

  it('truncates the value slot instead of wrapping it out of the box', () => {
    expect(renderSelect().trigger).toHaveClass(TRUNCATE)
  })

  it('reaches the value slot through a wrapper a consumer put around it', () => {
    const { trigger, value } = renderSelect(undefined, true)

    // The selector is what has to survive the wrapper; jsdom computes no
    // styles, so the pin is that the trigger still carries a variant whose
    // combinator is a descendant one, and that the value really is nested.
    expect(value).not.toBeNull()
    expect(value?.parentElement).not.toBe(trigger)
    expect(trigger).toContainElement(value as HTMLElement)
    expect(trigger).toHaveClass(MIN_W_0, TRUNCATE)
  })

  it('keeps a consumer className alongside the truncation', () => {
    const { trigger } = renderSelect('w-64')

    expect(trigger).toHaveClass('w-64', MIN_W_0, TRUNCATE)
  })
})
