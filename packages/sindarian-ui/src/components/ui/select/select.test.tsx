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
 * It rides the TRIGGER as a child-scoped variant because Radix strips
 * `className` off `Select.Value` before rendering the span.
 */
const MIN_W_0 = '[&>[data-slot=select-value]]:min-w-0'
const TRUNCATE = '[&>[data-slot=select-value]]:truncate'

function renderSelect(className?: string) {
  const { container } = render(
    <Select defaultValue="ctx">
      <SelectTrigger className={className}>
        <SelectValue>A settlement context with a very long name</SelectValue>
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

  it('keeps the value slot the direct child the truncation selector needs', () => {
    const { trigger, value } = renderSelect()

    expect(value).not.toBeNull()
    expect(value?.parentElement).toBe(trigger)
  })

  it('keeps a consumer className alongside the truncation', () => {
    const { trigger } = renderSelect('w-64')

    expect(trigger).toHaveClass('w-64', MIN_W_0, TRUNCATE)
  })
})
