import * as React from 'react'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { Input, type InputRef } from '.'
import { Form, FormControl, FormField, FormItem, FormLabel } from '../form'

/**
 * Regression coverage for standalone use.
 *
 * `Input` is a primitive with two callers: `InputField`, which wraps it in
 * `FormField`/`FormItem`, and plain standalone use such as a search box. It
 * used to call `useFormField`, which destructures `useFormContext()` — null
 * with no provider above — so every standalone `<Input />` threw "Cannot
 * destructure property 'getFieldState' of useFormContext(...) as it is null".
 *
 * It now reads no form context at all: a local `useId` covers the standalone
 * case, and inside a form `FormControl`'s Slot injects the real id as a prop.
 */
describe('Input outside a form', () => {
  it('renders with no react-hook-form provider', () => {
    render(<Input placeholder="Search permissions by name..." />)

    expect(
      screen.getByPlaceholderText('Search permissions by name...')
    ).toBeInTheDocument()
  })

  it('still gets an id so a label can be associated with it', () => {
    render(<Input aria-label="Search" />)

    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveAttribute(
      'id'
    )
  })

  it('keeps value/onChange behaviour intact', () => {
    const onChange = jest.fn()
    render(<Input value="abc" onChange={onChange} aria-label="Search" />)

    const input = screen.getByRole('textbox', { name: 'Search' })
    expect(input).toHaveValue('abc')

    fireEvent.change(input, { target: { value: 'abcd' } })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: input })
    )
  })
})

function FormHarness() {
  const form = useForm({ defaultValues: { email: 'ada@example.com' } })

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>E-mail</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />
    </Form>
  )
}

describe('Input inside a form', () => {
  it('is still wired to its FormItem id, so the label points at it', () => {
    render(<FormHarness />)

    const input = screen.getByLabelText('E-mail')
    expect(input).toHaveValue('ada@example.com')
    // The id must come from FormItem's context, not the standalone fallback.
    expect(input.getAttribute('id')).toMatch(/-form-item$/)
  })
})

/**
 * The imperative handle used to be built with a double arrow —
 * `focus: () => () => { ... }` — so calling `ref.current.focus()` RETURNED
 * the focusing function instead of running it. TypeScript never noticed: a
 * returned function still satisfies `() => void`. Every keyboard shortcut
 * that focused a sindarian-ui Input through a ref was a silent no-op (lender
 * lost its "/" hotkey on all seven registers).
 *
 * Asserting the return value is undefined is the part that actually pins the
 * bug: a handle that returns a closure would otherwise focus nothing and
 * still look plausible.
 */
describe('Input imperative handle', () => {
  function renderWithHandle() {
    // `InputProps` intersects its own `ref?: Ref<InputRef>` with the one
    // `ComponentProps<'input'>` already carries, so the ref object has to
    // satisfy both sides. Only the InputRef half is exercised here.
    const handle = React.createRef<InputRef & HTMLInputElement>()
    render(<Input ref={handle} aria-label="Search" />)
    return { handle, input: screen.getByLabelText('Search') }
  }

  it('focuses the input and returns nothing', () => {
    const { handle, input } = renderWithHandle()

    let returned: unknown = 'not called'
    act(() => {
      returned = handle.current?.focus()
    })

    expect(returned).toBeUndefined()
    expect(document.activeElement).toBe(input)
    expect(input.closest('[data-slot="input-wrapper"]')).toHaveAttribute(
      'data-focus',
      'true'
    )
  })

  it('blurs the input and returns nothing', () => {
    const { handle, input } = renderWithHandle()

    act(() => {
      handle.current?.focus()
    })
    expect(document.activeElement).toBe(input)

    let returned: unknown = 'not called'
    act(() => {
      returned = handle.current?.blur()
    })

    expect(returned).toBeUndefined()
    expect(document.activeElement).not.toBe(input)
    expect(input.closest('[data-slot="input-wrapper"]')).toHaveAttribute(
      'data-focus',
      'false'
    )
  })
})

/**
 * A flex item never shrinks below its automatic minimum size, and with no
 * declared width that minimum falls back to the control's own intrinsic size.
 * `.input-base` is `flex-1` and declared none, so the `<input>` was floored at
 * its default `size=20` width. Dropped into a 200px flex row beside a select,
 * it overflowed the row, painted outside its own `.input-wrapper`, and left
 * the select a sliver — product-console's transaction screen at a 390px
 * viewport, amount input over asset selector.
 *
 * `w-0` is the fix, and it does not fight `flex-1` (`flex: 1 1 0%`): the flex
 * base size comes from the basis, so the input still grows back to fill its
 * wrapper, while the declared width gives the algorithm a specified size to
 * floor at instead of the intrinsic one.
 *
 * `min-w-0` was measured and is NOT sufficient — it lowers the input's own
 * floor but not its min-content contribution, so a consumer's `flex-1` column
 * around the field still refused to shrink. A positive min-width floor was
 * measured and rejected too: a hand-written call site carrying its own
 * `min-w-0` outranks this rule set, so the floor never reaches the sites that
 * want it, while narrow rows regress.
 *
 * Every sibling primitive escapes the original bug by declaring `w-full`,
 * which supplies that specified size already: `.select-trigger`, `Textarea`,
 * `AutosizeTextarea` and `CommandInput` all shrink in the same row, so the fix
 * belongs in this rule set and nowhere else.
 *
 * Asserted against the stylesheet rather than the rendered element because the
 * rule is declared in `.input-base`, not applied as a utility class on the
 * `<input>`; jsdom computes no layout, so there is nothing to measure here.
 * The geometry itself is pinned by `scripts/measure-input-shrink.mjs`, which
 * drives these shapes through a real browser.
 */
describe('.input-base', () => {
  /** Brace-balanced body of a rule set in this component's stylesheet. */
  function ruleBody(selector: string): string {
    const css = readFileSync(resolve(__dirname, 'styles.css'), 'utf8')
    const opener = `${selector} {`
    const start = css.indexOf(opener)
    if (start === -1) throw new Error(`rule not found: ${selector}`)

    let depth = 0
    for (let i = start + opener.length - 1; i < css.length; i++) {
      if (css[i] === '{') depth++
      else if (css[i] === '}' && --depth === 0)
        return css.slice(start + opener.length, i)
    }
    throw new Error(`unbalanced rule: ${selector}`)
  }

  it('lets the input shrink below its intrinsic width in a flex row', () => {
    expect(ruleBody('.input-base')).toMatch(/\bw-0\b/)
  })

  it('still grows back to fill the row it sits in', () => {
    expect(ruleBody('.input-base')).toMatch(/\bflex-1\b/)
  })

  it('declares no min-width floor, which a call site would outrank anyway', () => {
    expect(ruleBody('.input-base')).not.toMatch(/@apply[^;]*\bmin-w-(?!0\b)/)
  })
})
