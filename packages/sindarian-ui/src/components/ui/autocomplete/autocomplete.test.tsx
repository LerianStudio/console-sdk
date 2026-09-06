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
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteItem,
  AutocompleteMultipleValue,
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

/**
 * THE CLEAR CONTROLS WERE MOUSE-ONLY AND ANONYMOUS.
 *
 * Both of them put `onClick` on the `<X>` svg inside the `<button>` rather
 * than on the button itself, and neither carried a name. An svg takes no
 * focus, so Enter and Space landed on the button and reached no handler: the
 * only way to clear a selection was a mouse (SC 2.1.1). And a button whose
 * whole content is a decorative glyph has no accessible name for a screen
 * reader to announce (SC 4.1.2).
 *
 * See LerianStudio/console-sdk#152.
 */

const Clearable = ({
  onValueChange,
  clearLabel
}: {
  onValueChange?: (values: string | string[]) => void
  clearLabel?: string
}) => (
  <Autocomplete defaultValue="next" onValueChange={onValueChange}>
    <AutocompleteTrigger clearLabel={clearLabel}>
      <AutocompleteValue placeholder="Select a framework" />
    </AutocompleteTrigger>
    <AutocompleteContent>
      <AutocompleteGroup>
        {FRAMEWORKS.map((framework) => (
          <AutocompleteItem key={framework.value} value={framework.value}>
            {framework.label}
          </AutocompleteItem>
        ))}
      </AutocompleteGroup>
    </AutocompleteContent>
  </Autocomplete>
)

describe('the clear button', () => {
  it('has an accessible name', () => {
    render(<Clearable />)

    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
  })

  it('takes the name a consumer passes', () => {
    render(<Clearable clearLabel="Limpar" />)

    expect(screen.getByRole('button', { name: 'Limpar' })).toBeInTheDocument()
  })

  it.each(['{Enter}', ' '])('clears the selection on %s', async (key) => {
    const onValueChange = jest.fn()
    const user = userEvent.setup()
    render(<Clearable onValueChange={onValueChange} />)

    screen.getByRole('button', { name: 'Clear' }).focus()
    await user.keyboard(key)

    expect(onValueChange).toHaveBeenCalledWith('')
  })

  it('still clears on a click', async () => {
    const onValueChange = jest.fn()
    const user = userEvent.setup()
    render(<Clearable onValueChange={onValueChange} />)

    await user.click(screen.getByRole('button', { name: 'Clear' }))

    expect(onValueChange).toHaveBeenCalledWith('')
  })
})

const Chips = ({
  onValueChange
}: {
  onValueChange?: (values: string | string[]) => void
}) => (
  // No `showValue`, which is the DEFAULT path and the one a consumer takes: the
  // chip has to render the option's LABEL, which it can only reach through the
  // option registry `AutocompleteContent` builds. And `defaultValue` takes the
  // array with no cast, which is the API this component documents.
  <Autocomplete multiple defaultValue={['next']} onValueChange={onValueChange}>
    <AutocompleteTrigger>
      <AutocompleteMultipleValue placeholder="Select frameworks" />
    </AutocompleteTrigger>
    <AutocompleteContent>
      <AutocompleteGroup>
        {FRAMEWORKS.map((framework) => (
          <AutocompleteItem key={framework.value} value={framework.value}>
            {framework.label}
          </AutocompleteItem>
        ))}
      </AutocompleteGroup>
    </AutocompleteContent>
  </Autocomplete>
)

describe("a chip's remove button", () => {
  it('names the value it removes', async () => {
    render(<Chips />)

    // The label resolves through the option map the content registers on
    // mount, so it says which chip goes rather than a bare "Clear".
    expect(
      await screen.findByRole('button', { name: 'Clear Next.js' })
    ).toBeInTheDocument()
  })

  it('removes that value on Enter', async () => {
    const onValueChange = jest.fn()
    const user = userEvent.setup()
    render(<Chips onValueChange={onValueChange} />)

    const remove = await screen.findByRole('button', { name: 'Clear Next.js' })
    remove.focus()
    await user.keyboard('{Enter}')

    expect(onValueChange).toHaveBeenCalledWith([])
  })
})

/**
 * THE OPTION REGISTRY NEVER FILLED.
 *
 * `AutocompleteContent._searchChildren` walks the children looking for
 * `child.type.displayName === 'AutocompleteItem'`, and `AutocompleteItem` is a
 * function component, which carries no displayName unless one is assigned. None
 * was. So the walk matched nothing, `options` stayed `{}` for every consumer,
 * and both readouts that resolve a value THROUGH that map rendered `undefined`:
 * a chip with an empty label, and a single-value input that blanked itself on
 * selection.
 *
 * `showValue` was the only path that rendered, because it is the branch that
 * skips the map — which is why it was the branch every test reached for.
 *
 * These two cases take the default path in each mode, so they fail on an empty
 * registry rather than routing around it.
 */
describe('the option registry', () => {
  it('gives a chip the label of its option, not the raw value', async () => {
    render(<Chips />)

    // The chip's own text, not the button's name: `options[value]` renders here
    // as the Badge's child, and an empty map printed nothing at all.
    expect(await screen.findByText('Next.js')).toBeInTheDocument()
  })

  it('puts the selected label in the input after a selection', async () => {
    const user = userEvent.setup()
    render(<Subject />)

    await user.click(combobox())
    await user.click(await screen.findByText('Next.js'))

    // `AutocompleteValue.updateSearch` resolves the selection through the same
    // map. With it empty, it set the input to `undefined`, which drops a
    // controlled input to uncontrolled and leaves the field blank — the
    // selection was made and nothing showed for it.
    await waitFor(() => expect(combobox()).toHaveValue('Next.js'))
  })
})

/**
 * NON-STRING CHILDREN WENT INTO THE REGISTRY AS THE LABEL.
 *
 * `_searchChildren` stored `child.props.children as string`, and the cast was
 * the whole defect: an item rendering markup (an icon beside the name, a bold
 * fragment, a `<span>`) registered a React ELEMENT under its value. Everything
 * downstream reads that map as text. The chip's remove button interpolates it
 * into `aria-label`, so a screen reader heard "Clear [object Object]", and
 * `AutocompleteValue` assigns it to the input's `value`, which drops a
 * controlled input to uncontrolled.
 *
 * `label` is the escape hatch: an explicit text label for an item whose
 * children are not text. Without one, a non-string child registers nothing and
 * every readout falls back to the item's own value, which is at least a real
 * string the user can act on.
 */
const RichItem = ({ label }: { label?: string }) => (
  <Autocomplete>
    <AutocompleteTrigger>
      <AutocompleteValue placeholder="Select a framework" />
    </AutocompleteTrigger>
    <AutocompleteContent>
      <AutocompleteGroup>
        <AutocompleteItem value="next" label={label}>
          <span>Next.js</span>
        </AutocompleteItem>
      </AutocompleteGroup>
    </AutocompleteContent>
  </Autocomplete>
)

const RichChip = ({ label }: { label?: string }) => (
  <Autocomplete multiple defaultValue={['next']}>
    <AutocompleteTrigger>
      <AutocompleteMultipleValue placeholder="Select frameworks" />
    </AutocompleteTrigger>
    <AutocompleteContent>
      <AutocompleteGroup>
        <AutocompleteItem value="next" label={label}>
          <span>Next.js</span>
        </AutocompleteItem>
      </AutocompleteGroup>
    </AutocompleteContent>
  </Autocomplete>
)

describe('an item whose children are not text', () => {
  it('reads its label in the chip', async () => {
    render(<RichChip label="Next.js" />)

    expect(await screen.findByText('Next.js')).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: 'Clear Next.js' })
    ).toBeInTheDocument()
  })

  it('reads its label in the input after a selection', async () => {
    const user = userEvent.setup()
    render(<RichItem label="Next.js" />)

    await user.click(combobox())
    await user.click(await screen.findByText('Next.js'))

    await waitFor(() => expect(combobox()).toHaveValue('Next.js'))
  })

  it('falls back to its value in the chip when no label is given', async () => {
    render(<RichChip />)

    // The element child still RENDERS inside the chip, which is why this shipped
    // unnoticed: only the accessible name betrayed it, as "Clear [object
    // Object]".
    const remove = await screen.findByRole('button', { name: 'Clear next' })

    expect(remove).toBeInTheDocument()
  })

  it('falls back to its value in the input when no label is given', async () => {
    const user = userEvent.setup()
    render(<RichItem />)

    await user.click(combobox())
    await user.click(await screen.findByText('Next.js'))

    await waitFor(() => expect(combobox()).toHaveValue('next'))
    expect(combobox()).not.toHaveValue('[object Object]')
  })
})
