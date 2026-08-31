/**
 * THE ARIA THE INPUT ADVERTISES WHILE THE PANEL IS CLOSED.
 *
 * cmdk puts `role="combobox"` and `aria-controls={listId}` on the
 * `Command.Input` that `AutocompleteValue` renders, and `id={listId}` on the
 * list. `AutocompleteContent` returned `null` while closed, so the element
 * `aria-controls` named was not in the DOM — which axe-core reports as a
 * CRITICAL `aria-valid-attr-value` violation on every screen using the
 * component, measured as 10 failing cases across five forms in a consumer. A
 * screen reader following the reference resolved it to nothing.
 *
 * ⛔ IT IS NOT FIXABLE AT THE CALL SITE. cmdk spreads the caller's props BEFORE
 * its own attributes (`createElement(Primitive.input, { ref, ...u, …,
 * "aria-controls":R.listId, … })`), so anything a consumer passes is silently
 * dropped. This is the primitive's own wiring, and this file is where it is
 * pinned.
 *
 * See LerianStudio/console-sdk#150.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteItem,
  AutocompleteTrigger,
  AutocompleteValue
} from './index'

/** jsdom implements neither, and Radix/cmdk touch both on mount. */
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
global.ResizeObserver =
  ResizeObserverStub as unknown as typeof global.ResizeObserver
Element.prototype.scrollIntoView = function scrollIntoView(): void {}

const FRAMEWORKS = [
  { value: 'next', label: 'Next.js' },
  { value: 'remix', label: 'Remix' }
]

const Subject = ({
  onOpenChange
}: {
  onOpenChange?: (open: boolean) => void
}) => (
  <div>
    <button type="button">outside</button>
    <Autocomplete onOpenChange={onOpenChange}>
      <AutocompleteTrigger>
        <AutocompleteValue placeholder="Select a framework" />
      </AutocompleteTrigger>
      <AutocompleteContent>
        <AutocompleteEmpty>
          <p>No frameworks found</p>
        </AutocompleteEmpty>
        <AutocompleteGroup>
          {FRAMEWORKS.map((framework) => (
            <AutocompleteItem key={framework.value} value={framework.value}>
              {framework.label}
            </AutocompleteItem>
          ))}
        </AutocompleteGroup>
      </AutocompleteContent>
    </Autocomplete>
  </div>
)

const combobox = () => screen.getByRole('combobox')

describe('a closed autocomplete', () => {
  it('names a listbox that is present in the DOM', () => {
    render(<Subject />)

    const controls = combobox().getAttribute('aria-controls')
    expect(controls).toBeTruthy()

    // ⛔ THE CRITICAL VIOLATION. A screen reader following `aria-controls`
    // resolved it to nothing, because the panel unmounted while the attribute
    // stayed. `getElementById` is the same lookup axe-core performs.
    expect(document.getElementById(controls as string)).not.toBeNull()
  })

  it('does not put its options in the DOM', () => {
    render(<Subject />)

    // ⛔ THE COST CONTROL, AND IT IS THE REASON THE FIX IS NOT "MOUNT
    // EVERYTHING". A consumer puts up to ten of these on one form, each holding
    // a page of up to a hundred options — roughly a thousand permanently
    // present nodes. Only the LIST needs to exist while closed: it is the
    // element carrying the id.
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.queryByText('Next.js')).not.toBeInTheDocument()
  })

  it('ignores a click elsewhere on the page', async () => {
    // ⛔ `useClickAway` USED TO BE INERT WHILE CLOSED because its ref pointed at
    // nothing. With the list mounted the handler becomes live, and without a
    // guard every click anywhere would call `setOpen(false)` and blur the input
    // — ten handlers per click on that same consumer form.
    const onOpenChange = jest.fn()
    const user = userEvent.setup()
    render(<Subject onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole('button', { name: 'outside' }))

    expect(onOpenChange).not.toHaveBeenCalled()
  })
})

describe('an open autocomplete', () => {
  it('shows its options and still resolves aria-controls', async () => {
    const user = userEvent.setup()
    render(<Subject />)

    await user.click(combobox())

    expect(await screen.findByText('Next.js')).toBeVisible()
    expect(screen.getAllByRole('option')).toHaveLength(FRAMEWORKS.length)

    const controls = combobox().getAttribute('aria-controls')
    expect(document.getElementById(controls as string)).not.toBeNull()
  })

  it('closes on a click outside, as before', async () => {
    const onOpenChange = jest.fn()
    const user = userEvent.setup()
    render(<Subject onOpenChange={onOpenChange} />)

    await user.click(combobox())
    await screen.findByText('Next.js')
    onOpenChange.mockClear()

    await user.click(screen.getByRole('button', { name: 'outside' }))

    // The guard must not cost the behaviour it guards: an OPEN panel still
    // closes on an outside click.
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
