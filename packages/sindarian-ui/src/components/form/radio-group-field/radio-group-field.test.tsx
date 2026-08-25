import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { RadioGroupField } from '.'

/**
 * A React portal node, built by hand: `@types/react-dom` is not installed in
 * this workspace, so `createPortal` cannot be imported type-safely here.
 *
 * Shape-identical to the real thing, and verified as such: `Symbol.for` returns
 * the very symbol `createPortal` stamps, `isValidElement` is false for it, and
 * `Children.toArray` hands the same object straight back — which is precisely
 * what makes the recursion guard necessary.
 */
function portalLabel(
  text: string
): Exclude<ReactNode, null | undefined | boolean> {
  return {
    $$typeof: Symbol.for('react.portal'),
    key: null,
    children: text,
    containerInfo: document.body,
    implementation: null
  } as unknown as Exclude<ReactNode, null | undefined | boolean>
}

// Radix measures the indicator with ResizeObserver, which jsdom does not ship.
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

function Harness({
  onSubmit,
  error
}: {
  onSubmit?: (values: { rail: string }) => void
  error?: string
}) {
  const form = useForm<{ rail: string }>({ defaultValues: { rail: '' } })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit?.(values))}>
        <RadioGroupField
          control={form.control}
          name="rail"
          label="Rail"
          description="Where the money moves"
          options={[
            { value: 'pix', label: 'Pix' },
            { value: 'ted', label: 'TED' },
            { value: 'siloc', label: 'SILOC', disabled: true }
          ]}
        />
        <button type="submit">Submit</button>
        <button
          type="button"
          onClick={() => form.setError('rail', { message: error })}
        >
          Fail
        </button>
      </form>
    </Form>
  )
}

describe('RadioGroupField', () => {
  it('renders one labelled option per entry and submits the picked value', async () => {
    const onSubmit = jest.fn()
    render(<Harness onSubmit={onSubmit} />)

    expect(screen.getByText('Rail')).toBeInTheDocument()
    expect(screen.getByText('Where the money moves')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByRole('radio', { name: 'SILOC' })).toBeDisabled()

    fireEvent.click(screen.getByRole('radio', { name: 'TED' }))
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ rail: 'ted' }))
  })

  it('renders the validation message through FormMessage', async () => {
    render(<Harness error="Pick a rail" />)

    fireEvent.click(screen.getByText('Fail'))

    expect(await screen.findByText('Pick a rail')).toBeInTheDocument()
  })

  it('names the group via aria-label when there is no visible label', () => {
    function LabelFree() {
      const form = useForm<{ rail: string }>({ defaultValues: { rail: '' } })
      return (
        <Form {...form}>
          <RadioGroupField
            control={form.control}
            name="rail"
            aria-label="Settlement rail"
            options={[
              { value: 'pix', label: 'Pix' },
              { value: 'ted', label: 'TED' }
            ]}
          />
        </Form>
      )
    }
    render(<LabelFree />)

    expect(
      screen.getByRole('radiogroup', { name: 'Settlement rail' })
    ).toBeInTheDocument()
  })

  describe.each([
    [null],
    [false],
    [''],
    ['   '],
    ['\t\n'],
    [[]],
    [<></>],
    [['', '  ']]
  ])('unrenderable label %p', (falsyLabel: unknown) => {
    it('renders no stray group label and still names the group via aria-label', () => {
      function FalsyLabel() {
        const form = useForm<{ rail: string }>({
          defaultValues: { rail: '' }
        })
        return (
          <Form {...form}>
            <RadioGroupField
              control={form.control}
              name="rail"
              // @ts-expect-error null/false are compile errors; blank and
              // whitespace-only strings are only catchable at runtime. Every
              // one of them must still leave the group named.
              label={falsyLabel}
              aria-label="Settlement rail"
              options={[{ value: 'pix', label: 'Pix' }]}
            />
          </Form>
        )
      }
      render(<FalsyLabel />)

      expect(
        screen.getByRole('radiogroup', { name: 'Settlement rail' })
      ).toBeInTheDocument()
      // The only <label> left is the option's own, never an empty group label.
      expect(screen.getAllByText('Pix')).toHaveLength(1)
    })
  })

  it.each([
    ['empty', ''],
    ['whitespace-only', '   ']
  ])('drops a %s aria-label instead of naming the group ""', (_kind, blank) => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    function Nameless() {
      const form = useForm<{ rail: string }>({ defaultValues: { rail: '' } })
      return (
        <Form {...form}>
          {/* This COMPILES: a blank string cannot be excluded from `string`, so
              the union accepts it. The runtime guard is all that stands between
              this and a nameless control. */}
          <RadioGroupField
            control={form.control}
            name="rail"
            label={blank}
            aria-label={blank}
            options={[{ value: 'pix', label: 'Pix' }]}
          />
        </Form>
      )
    }
    render(<Nameless />)

    expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-label')
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('RadioGroupField "rail" has no accessible name')
    )
    spy.mockRestore()
  })

  it.each([
    ['without aria-label', undefined],
    ['with aria-label', 'Settlement rail']
  ])('renders a portal label %s without recursing forever', (_kind, aria) => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    function WithPortal() {
      const form = useForm<{ rail: string }>({ defaultValues: { rail: '' } })
      return (
        <Form {...form}>
          <RadioGroupField
            control={form.control}
            name="rail"
            label={portalLabel('Rail')}
            aria-label={aria}
            options={[{ value: 'pix', label: 'Pix' }]}
          />
        </Form>
      )
    }

    // A portal is not an element and Children.toArray cannot decompose it, so
    // without a base case this overflows the stack instead of rendering.
    expect(() => render(<WithPortal />)).not.toThrow()
    const warned = spy.mock.calls.some((call) =>
      String(call[0]).includes('no accessible name')
    )
    spy.mockRestore()
    // A portal renders something, so it counts as a label — no warning.
    expect(warned).toBe(false)
  })

  it('warns when an empty fragment label leaves the group nameless', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    function Nameless() {
      const form = useForm<{ rail: string }>({ defaultValues: { rail: '' } })
      return (
        <Form {...form}>
          {/* Compiles: an empty fragment is a valid ReactNode, so the union
              accepts it with no aria-label. Only the runtime guard catches it. */}
          <RadioGroupField
            control={form.control}
            name="rail"
            label={<></>}
            options={[{ value: 'pix', label: 'Pix' }]}
          />
        </Form>
      )
    }
    render(<Nameless />)

    expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-label')
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('RadioGroupField "rail" has no accessible name')
    )
    spy.mockRestore()
  })

  it('setFocus lands on the first selectable option, skipping disabled ones', async () => {
    let form!: UseFormReturn<{ rail: string }>
    function FocusHarness() {
      form = useForm<{ rail: string }>({ defaultValues: { rail: '' } })
      return (
        <Form {...form}>
          <RadioGroupField
            control={form.control}
            name="rail"
            label="Rail"
            options={[
              { value: 'siloc', label: 'SILOC', disabled: true },
              { value: 'pix', label: 'Pix' },
              { value: 'ted', label: 'TED' }
            ]}
          />
        </Form>
      )
    }
    render(<FocusHarness />)

    // The RadioGroup root is a div; without the ref on a real radio,
    // setFocus/focus-on-error would have nothing focusable to land on.
    // react-hook-form defers the actual .focus() into a timer, so let it run.
    await act(async () => {
      form.setFocus('rail')
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(screen.getByRole('radio', { name: 'Pix' })).toHaveFocus()
  })
})
