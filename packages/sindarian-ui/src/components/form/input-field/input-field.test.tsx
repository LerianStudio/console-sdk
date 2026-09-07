import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import type { InputRef } from '@/components/ui/input'
import { InputField } from '.'

function FormHarness({
  onSubmit,
  defaultValue,
  textArea,
  onChange
}: {
  onSubmit?: (values: { note: string }) => void
  defaultValue?: string
  textArea?: boolean
  onChange?: (e: React.ChangeEvent<HTMLElement>) => void
}) {
  // No `defaultValues` on purpose: this is the shape that handed the control
  // `value: undefined` and made React mount it uncontrolled.
  const form = useForm<{ note: string }>()

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit?.(values))}>
        <InputField
          control={form.control}
          name="note"
          label="Note"
          defaultValue={defaultValue}
          textArea={textArea}
          onChange={onChange}
        />
        <button type="submit">Submit</button>
      </form>
    </Form>
  )
}

describe('InputField with react-hook-form', () => {
  it('mounts controlled even when the form declares no default', () => {
    // An input handed `value: undefined` is uncontrolled; react-hook-form then
    // supplies a value on the first keystroke and React flips it to controlled,
    // dropping that first character and logging a warning.
    const warn = jest.spyOn(console, 'error').mockImplementation(() => {})
    render(<FormHarness />)

    const input = screen.getByRole('textbox')
    // `value` present from mount is what "controlled" means to React; the
    // buggy version emitted no `value` attribute at all.
    expect(input).toHaveAttribute('value', '')

    fireEvent.change(input, { target: { value: 'a' } })
    expect(input).toHaveValue('a')

    const complaints = warn.mock.calls
      .flat()
      .filter((arg) => typeof arg === 'string' && arg.includes('uncontrolled'))
    warn.mockRestore()

    expect(complaints).toEqual([])
  })

  it('honours defaultValue on the single-line branch', () => {
    render(<FormHarness defaultValue="PIX-0042" />)
    expect(screen.getByRole('textbox')).toHaveValue('PIX-0042')
  })

  it('honours defaultValue on the textarea branch', () => {
    render(<FormHarness defaultValue="multi line" textArea />)
    expect(screen.getByRole('textbox')).toHaveValue('multi line')
  })

  it('seeds the FORM from defaultValue, not just the box', async () => {
    // A seed the user never retypes has to reach react-hook-form's own state.
    // Painting it on the DOM only makes the field LOOK filled while the form
    // still submits nothing for that name.
    const onSubmit = jest.fn()
    render(<FormHarness onSubmit={onSubmit} defaultValue="PIX-0042" />)

    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ note: 'PIX-0042' })
    )
  })

  it('seeds the FORM from defaultValue on the textarea branch too', async () => {
    const onSubmit = jest.fn()
    render(
      <FormHarness onSubmit={onSubmit} defaultValue="multi line" textArea />
    )

    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ note: 'multi line' })
    )
  })

  it("lets the form's own default win over the component-level seed", async () => {
    // Precedence, now that the seed reaches form state: `useForm`'s
    // `defaultValues` is the form's declaration and outranks a per-field seed.
    const onSubmit = jest.fn()
    const warn = jest.spyOn(console, 'error').mockImplementation(() => {})

    function Declared() {
      const form = useForm<{ note: string }>({
        defaultValues: { note: 'from-form' }
      })

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => onSubmit(values))}>
            <InputField
              control={form.control}
              name="note"
              label="Note"
              defaultValue="from-prop"
            />
            <button type="submit">Submit</button>
          </form>
        </Form>
      )
    }

    render(<Declared />)
    expect(screen.getByRole('textbox')).toHaveValue('from-form')

    fireEvent.click(screen.getByText('Submit'))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ note: 'from-form' })
    )

    const complaints = warn.mock.calls
      .flat()
      .filter((arg) => typeof arg === 'string' && arg.includes('uncontrolled'))
    warn.mockRestore()
    expect(complaints).toEqual([])
  })

  it('calls the caller onChange on the single-line branch', () => {
    const onChange = jest.fn()
    render(<FormHarness onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('still submits the typed value through react-hook-form', async () => {
    const onSubmit = jest.fn()
    render(<FormHarness onSubmit={onSubmit} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ted' } })
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ note: 'ted' }))
  })
})

describe('InputField without react-hook-form', () => {
  function StateHarness() {
    const [query, setQuery] = useState('')

    return (
      <>
        <InputField
          name="query"
          label="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <output>{query}</output>
      </>
    )
  }

  it('drives a useState filter bar with no control prop', () => {
    render(<StateHarness />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('')

    fireEvent.change(input, { target: { value: 'unmatched' } })
    expect(input).toHaveValue('unmatched')
    expect(screen.getByText('unmatched')).toBeInTheDocument()
  })

  it('renders its label and description with no control prop', () => {
    render(
      <InputField
        name="query"
        label="Search"
        description="Filters the blotter"
      />
    )

    expect(screen.getByText('Search')).toBeInTheDocument()
    expect(screen.getByText('Filters the blotter')).toBeInTheDocument()
  })

  it('stays uncontrolled when given only a defaultValue', () => {
    render(<InputField name="query" label="Search" defaultValue="seed" />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('seed')

    fireEvent.change(input, { target: { value: 'typed' } })
    expect(input).toHaveValue('typed')
  })
})

/**
 * L5 — the four things the uncontrolled branch dropped. Measured before the
 * fix: `min`, `max`, `step`, `maxLength` and `ref` were not on the props type
 * at all ("Property 'min' does not exist on type InputFieldProps"), and
 * `aria-invalid` type-checked only because TypeScript exempts hyphenated JSX
 * attributes from excess-property checking — it was accepted and then silently
 * dropped, which is why a console shipped seven hand-rolled FormItem
 * compositions to get these back.
 *
 * Every assertion is on the real DOM node, not on props handed to a child.
 */
function realInput(container: HTMLElement): HTMLInputElement {
  const node = container.querySelector<HTMLInputElement>('input')
  if (!node) throw new Error('no input rendered')
  return node
}

describe('InputField forwards ARIA, bounds, maxLength and ref', () => {
  it('lands all four on the DOM node with no control prop', () => {
    const ref = { current: null } as React.RefObject<InputRef | null>
    const { container } = render(
      <InputField
        name="amount"
        label="Amount"
        type="number"
        aria-invalid
        min={0}
        max={100}
        step={5}
        maxLength={9}
        ref={ref}
      />
    )

    const input = realInput(container)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '100')
    expect(input).toHaveAttribute('step', '5')
    expect(input).toHaveAttribute('maxlength', '9')

    // A node to focus is the whole point: react-hook-form's shouldFocusError
    // calls .focus() on whatever the ref holds.
    expect(typeof ref.current?.focus).toBe('function')
  })

  it('lands all four on the DOM node with a control prop', () => {
    const ref = { current: null } as React.RefObject<InputRef | null>

    function Harness() {
      const form = useForm<{ amount: string }>({
        defaultValues: { amount: '' }
      })
      return (
        <Form {...form}>
          <InputField
            control={form.control}
            name="amount"
            label="Amount"
            type="number"
            aria-invalid
            min={0}
            max={100}
            step={5}
            maxLength={9}
            ref={ref}
          />
        </Form>
      )
    }

    const { container } = render(<Harness />)

    const input = realInput(container)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('min', '0')
    expect(input).toHaveAttribute('max', '100')
    expect(input).toHaveAttribute('step', '5')
    expect(input).toHaveAttribute('maxlength', '9')
    expect(typeof ref.current?.focus).toBe('function')
  })

  it('still lets react-hook-form drive the field when a consumer ref is present', async () => {
    // The consumer ref must be composed with the form's, never replace it: the
    // form loses its own handle otherwise and typing stops reaching it.
    const onSubmit = jest.fn()
    const ref = { current: null } as React.RefObject<InputRef | null>

    function Harness() {
      const form = useForm<{ note: string }>({ defaultValues: { note: '' } })
      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => onSubmit(values))}>
            <InputField
              control={form.control}
              name="note"
              label="Note"
              ref={ref}
            />
            <button type="submit">Submit</button>
          </form>
        </Form>
      )
    }

    render(<Harness />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ted' } })
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ note: 'ted' }))
    expect(ref.current).not.toBeNull()
  })

  it('runs a consumer callback-ref cleanup on unmount', () => {
    const cleanups: jest.Mock[] = []
    const ref = jest.fn(() => {
      const cleanup = jest.fn()
      cleanups.push(cleanup)
      return cleanup
    })

    function Harness() {
      const form = useForm<{ note: string }>({ defaultValues: { note: '' } })
      return (
        <Form {...form}>
          <InputField
            control={form.control}
            name="note"
            label="Note"
            ref={ref}
          />
        </Form>
      )
    }

    const view = render(<Harness />)
    view.unmount()

    expect(cleanups.length).toBeGreaterThan(0)
    cleanups.forEach((cleanup) => expect(cleanup).toHaveBeenCalledTimes(1))
  })

  it('keeps the composed callback ref attached across rerenders', () => {
    const cleanup = jest.fn()
    const ref = jest.fn(() => cleanup)

    function Harness() {
      const [count, setCount] = useState(0)
      const form = useForm<{ note: string }>({ defaultValues: { note: '' } })
      return (
        <Form {...form}>
          <InputField
            control={form.control}
            name="note"
            label={`Note ${count}`}
            ref={ref}
          />
          <button type="button" onClick={() => setCount((value) => value + 1)}>
            Rerender
          </button>
        </Form>
      )
    }

    const view = render(<Harness />)
    fireEvent.click(screen.getByText('Rerender'))

    expect(cleanup).not.toHaveBeenCalled()

    view.unmount()
    expect(cleanup).toHaveBeenCalledTimes(1)
  })

  it('leaves the form-derived aria-invalid in charge when the prop is omitted', async () => {
    // Omitting the prop must not paint aria-invalid="false" over a real
    // react-hook-form error.
    function Harness() {
      const form = useForm<{ note: string }>({ defaultValues: { note: '' } })
      return (
        <Form {...form}>
          <InputField control={form.control} name="note" label="Note" />
          <button
            type="button"
            onClick={() => form.setError('note', { message: 'Required' })}
          >
            Break it
          </button>
        </Form>
      )
    }

    const { container } = render(<Harness />)
    expect(realInput(container)).toHaveAttribute('aria-invalid', 'false')

    fireEvent.click(screen.getByText('Break it'))

    await waitFor(() =>
      expect(realInput(container)).toHaveAttribute('aria-invalid', 'true')
    )
  })

  it('forwards maxLength on the textarea branch too', () => {
    const { container } = render(
      <InputField name="note" label="Note" textArea maxLength={12} />
    )

    const textarea = container.querySelector('textarea')
    expect(textarea).toHaveAttribute('maxlength', '12')
  })

  it('lands a ref on the textarea branch', () => {
    const ref = { current: null } as React.RefObject<InputRef | null>
    render(<InputField name="note" label="Note" textArea ref={ref} />)

    expect(typeof ref.current?.focus).toBe('function')
  })

  it('omits the attributes entirely when they are not passed', () => {
    // Forwarding must not start emitting empty attributes for every consumer
    // that never asked for bounds.
    const { container } = render(<InputField name="note" label="Note" />)

    const input = realInput(container)
    expect(input).not.toHaveAttribute('min')
    expect(input).not.toHaveAttribute('max')
    expect(input).not.toHaveAttribute('step')
    expect(input).not.toHaveAttribute('maxlength')
  })
})

/**
 * F1 — `aria-invalid` ORs with the form's error state, it never overrides it.
 * Suppressing a live react-hook-form error is not a capability anyone asked
 * for, and on a financial console a muted validation error is a wrong number
 * reaching a money path. Explicit `true` announces invalid; explicit `false`
 * over a real error still announces invalid.
 */
describe('InputField aria-invalid ORs with the form error', () => {
  function ErrorHarness({ ariaInvalid }: { ariaInvalid?: boolean }) {
    const form = useForm<{ note: string }>({ defaultValues: { note: '' } })
    return (
      <Form {...form}>
        <InputField
          control={form.control}
          name="note"
          label="Note"
          aria-invalid={ariaInvalid}
        />
        <button
          type="button"
          onClick={() => form.setError('note', { message: 'Required' })}
        >
          Break it
        </button>
      </Form>
    )
  }

  it('announces invalid on an explicit true with no form error', () => {
    const { container } = render(<ErrorHarness ariaInvalid />)
    expect(realInput(container)).toHaveAttribute('aria-invalid', 'true')
  })

  it('still announces invalid on an explicit FALSE over a live form error', async () => {
    const { container } = render(<ErrorHarness ariaInvalid={false} />)
    expect(realInput(container)).toHaveAttribute('aria-invalid', 'false')

    fireEvent.click(screen.getByText('Break it'))

    await waitFor(() =>
      expect(realInput(container)).toHaveAttribute('aria-invalid', 'true')
    )
  })

  it('reads valid on an explicit false with no form error', () => {
    const { container } = render(<ErrorHarness ariaInvalid={false} />)
    expect(realInput(container)).toHaveAttribute('aria-invalid', 'false')
  })

  it('keeps the no-form branch at today behaviour for both explicit values', () => {
    // No form means no error state to OR against, so the prop is the whole
    // answer and an explicit false is honoured.
    const yes = render(<InputField name="a" label="A" aria-invalid />)
    expect(realInput(yes.container)).toHaveAttribute('aria-invalid', 'true')
    yes.unmount()

    const no = render(<InputField name="a" label="A" aria-invalid={false} />)
    expect(realInput(no.container)).toHaveAttribute('aria-invalid', 'false')
  })
})

/**
 * F2 — the rest of the native input surface a financial console needs. Named
 * props, not a wide spread (which collides with the props InputField owns) and
 * not a nested bag (which diverges from every sibling field). Asserted with no
 * `control`, since the uncontrolled branch is where they were dropped.
 */
describe('InputField forwards the native input attributes', () => {
  it('lands autoComplete, inputMode and pattern on the input', () => {
    const { container } = render(
      <InputField
        name="account"
        label="Account"
        autoComplete="off"
        inputMode="numeric"
        pattern="[0-9]*"
      />
    )

    const input = realInput(container)
    expect(input).toHaveAttribute('autocomplete', 'off')
    expect(input).toHaveAttribute('inputmode', 'numeric')
    expect(input).toHaveAttribute('pattern', '[0-9]*')
  })

  it('focuses the input on autoFocus', () => {
    // React never emits an `autofocus` ATTRIBUTE — it focuses the node on
    // mount — so the observable contract is where focus actually is.
    const { container } = render(
      <InputField name="query" label="Query" autoFocus />
    )
    expect(realInput(container)).toHaveFocus()
  })

  it('lands autoComplete and inputMode on the textarea branch', () => {
    const { container } = render(
      <InputField
        name="note"
        label="Note"
        textArea
        autoComplete="off"
        inputMode="text"
      />
    )

    const textarea = container.querySelector('textarea')
    expect(textarea).toHaveAttribute('autocomplete', 'off')
    expect(textarea).toHaveAttribute('inputmode', 'text')
  })

  it('focuses the textarea on autoFocus', () => {
    const { container } = render(
      <InputField name="note" label="Note" textArea autoFocus />
    )
    expect(container.querySelector('textarea')).toHaveFocus()
  })

  it('reaches the input on the react-hook-form branch too', () => {
    function Harness() {
      const form = useForm<{ account: string }>({
        defaultValues: { account: '' }
      })
      return (
        <Form {...form}>
          <InputField
            control={form.control}
            name="account"
            label="Account"
            autoComplete="off"
            inputMode="numeric"
            pattern="[0-9]*"
          />
        </Form>
      )
    }

    const { container } = render(<Harness />)
    const input = realInput(container)
    expect(input).toHaveAttribute('autocomplete', 'off')
    expect(input).toHaveAttribute('inputmode', 'numeric')
    expect(input).toHaveAttribute('pattern', '[0-9]*')
  })

  it('emits none of them when they are not passed', () => {
    const { container } = render(<InputField name="a" label="A" />)
    const input = realInput(container)
    expect(input).not.toHaveAttribute('autocomplete')
    expect(input).not.toHaveAttribute('inputmode')
    expect(input).not.toHaveAttribute('pattern')
  })
})
