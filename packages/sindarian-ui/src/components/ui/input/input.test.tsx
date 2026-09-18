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
 * declared width and no `min-width` that minimum is the control's own
 * intrinsic size — 239px for a default `<input>`, from its `size=20`. That is
 * what this rule set used to leave in place: dropped into a 200px flex row
 * beside a select, the control painted outside its own `.input-wrapper` and
 * left the select a sliver, which is product-console's transaction screen at a
 * 390px viewport.
 *
 * `w-0` was the first answer and it overshot: an `<input>` does not wrap, so a
 * declared width replaces its max-content contribution along with its
 * min-content one, and any box sized BY ITS CONTENT — a search box in a filter
 * bar — was handed 0px to be as wide as. Six product-console screens rendered
 * an empty 32px chip at every viewport.
 *
 * The rule set now declares no width at all and drops the automatic minimum on
 * both boxes instead. The field keeps its natural width, it can no longer
 * paint outside its own box, and a row that must compress says so on its own
 * flex item with `min-w-0` — one token, the standard idiom, which only works
 * because the control here no longer floors at 239px.
 *
 * A positive min-width floor was measured and rejected: a hand-written call
 * site carrying its own `min-w-0` outranks this rule set, so the floor never
 * reaches the sites that want it, while narrow rows regress.
 *
 * Every sibling primitive already escaped the original bug, which is why the
 * fix belongs in this rule set and nowhere else: `.select-trigger`, `Textarea`,
 * `AutosizeTextarea` and `CommandInput` declare `w-full`, and their intrinsic
 * width comes from their own text rather than from a `size` attribute, so
 * neither half of the problem reaches them.
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

  /**
   * The rule set's `@apply` list as discrete tokens.
   *
   * Matching the raw text with a regex is not good enough here, and the reason
   * is the exact shape a future edit would take: `\bw-0\b` also matches the
   * `w-0` inside `min-w-0`, because a hyphen is a word boundary. Swapping
   * `w-0` for `min-w-0` — the revert this rule set is guarded against — would
   * have left every case green. Tokens make each assertion exact.
   */
  function applyTokens(selector: string): string[] {
    return [...ruleBody(selector).matchAll(/@apply\s+([^;]*);/g)].flatMap((m) =>
      m[1].split(/\s+/).filter(Boolean)
    )
  }

  /** `sm:min-w-16` floors just as hard as `min-w-16`. */
  const bare = (token: string) => token.slice(token.lastIndexOf(':') + 1)

  it('declares no width, so the field keeps its natural size', () => {
    const widths = applyTokens('.input-base').filter((t) => /^w-/.test(bare(t)))

    expect(widths).toEqual([])
  })

  it('lets its own box compress it, on the input and on the wrapper', () => {
    expect(applyTokens('.input-base')).toContain('min-w-0')
    expect(applyTokens('.input-wrapper')).toContain('min-w-0')
  })

  it('still grows back to fill the row it sits in', () => {
    expect(applyTokens('.input-base')).toContain('flex-1')
  })

  it('declares no min-width floor, which a call site would outrank anyway', () => {
    const floors = applyTokens('.input-base')
      .filter((t) => bare(t).startsWith('min-w-'))
      .filter((t) => bare(t) !== 'min-w-0')

    expect(floors).toEqual([])
  })
})
