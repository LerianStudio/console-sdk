import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { TextareaField } from '.'

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

function Harness({
  onSubmit,
  error
}: {
  onSubmit?: (values: { notes: string }) => void
  error?: string
}) {
  const form = useForm<{ notes: string }>({ defaultValues: { notes: '' } })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit?.(values))}>
        <TextareaField
          control={form.control}
          name="notes"
          label="Notes"
          description="Free-form context"
          placeholder="Type..."
          required
        />
        <button type="submit">Submit</button>
        <button
          type="button"
          onClick={() => form.setError('notes', { message: error })}
        >
          Fail
        </button>
      </form>
    </Form>
  )
}

describe('TextareaField', () => {
  it('renders the label, description and control, and submits the typed value', async () => {
    const onSubmit = jest.fn()
    render(<Harness onSubmit={onSubmit} />)

    expect(screen.getByText('Notes *')).toBeInTheDocument()
    expect(screen.getByText('Free-form context')).toBeInTheDocument()

    const textarea = screen.getByPlaceholderText('Type...')
    fireEvent.change(textarea, { target: { value: 'settled late' } })
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ notes: 'settled late' })
    )
  })

  it('renders the validation message through FormMessage', async () => {
    render(<Harness error="Notes are required" />)

    fireEvent.click(screen.getByText('Fail'))

    expect(await screen.findByText('Notes are required')).toBeInTheDocument()
  })

  it('names the control via aria-label when there is no visible label', () => {
    function LabelFree() {
      const form = useForm<{ notes: string }>({ defaultValues: { notes: '' } })
      return (
        <Form {...form}>
          <TextareaField
            control={form.control}
            name="notes"
            aria-label="Operator notes"
          />
        </Form>
      )
    }
    render(<LabelFree />)

    expect(
      screen.getByRole('textbox', { name: 'Operator notes' })
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
    it('renders no stray label element and still names the control via aria-label', () => {
      function FalsyLabel() {
        const form = useForm<{ notes: string }>({
          defaultValues: { notes: '' }
        })
        return (
          <Form {...form}>
            <TextareaField
              control={form.control}
              name="notes"
              // @ts-expect-error null/false are compile errors; blank and
              // whitespace-only strings are only catchable at runtime. Every
              // one of them must still leave the control named.
              label={falsyLabel}
              aria-label="Operator notes"
            />
          </Form>
        )
      }
      const { container } = render(<FalsyLabel />)

      expect(container.querySelector('label')).toBeNull()
      expect(
        screen.getByRole('textbox', { name: 'Operator notes' })
      ).toBeInTheDocument()
    })
  })

  it.each([
    ['empty', ''],
    ['whitespace-only', '   ']
  ])(
    'drops a %s aria-label instead of naming the control ""',
    (_kind, blank) => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
      function Nameless() {
        const form = useForm<{ notes: string }>({
          defaultValues: { notes: '' }
        })
        return (
          <Form {...form}>
            {/* This COMPILES: a blank string cannot be excluded from `string`,
                so the union accepts it. The runtime guard is all that stands
                between this and a nameless control. */}
            <TextareaField
              control={form.control}
              name="notes"
              label={blank}
              aria-label={blank}
            />
          </Form>
        )
      }
      const { container } = render(<Nameless />)

      // A blank aria-label is worse than none — it must not reach the DOM.
      expect(container.querySelector('textarea')).not.toHaveAttribute(
        'aria-label'
      )
      // ...and the developer gets told, since the type cannot catch a blank string.
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('TextareaField "notes" has no accessible name')
      )
      spy.mockRestore()
    }
  )

  it.each([
    ['without aria-label', undefined],
    ['with aria-label', 'Operator notes']
  ])('renders a portal label %s without recursing forever', (_kind, aria) => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    function WithPortal() {
      const form = useForm<{ notes: string }>({ defaultValues: { notes: '' } })
      return (
        <Form {...form}>
          <TextareaField
            control={form.control}
            name="notes"
            label={portalLabel('Notes')}
            aria-label={aria}
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

  it('warns when an empty collection label leaves the control nameless', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    function Nameless() {
      const form = useForm<{ notes: string }>({ defaultValues: { notes: '' } })
      return (
        <Form {...form}>
          {/* Compiles: an empty array is a valid ReactNode, so the union accepts
              it with no aria-label. Only the runtime guard catches this. */}
          <TextareaField control={form.control} name="notes" label={[]} />
        </Form>
      )
    }
    const { container } = render(<Nameless />)

    expect(container.querySelector('label')).toBeNull()
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('TextareaField "notes" has no accessible name')
    )
    spy.mockRestore()
  })

  it('keeps a disabled field out of the submitted values even when populated', async () => {
    const onSubmit = jest.fn()
    function DisabledHarness() {
      const form = useForm<{ notes: string; rail: string }>({
        defaultValues: { notes: 'pre-filled', rail: 'pix' }
      })
      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <TextareaField
              control={form.control}
              name="notes"
              label="Notes"
              disabled
            />
            <button type="submit">Submit</button>
          </form>
        </Form>
      )
    }
    render(<DisabledHarness />)

    // Disabled at the controller, not just on the element: react-hook-form
    // drops the value from the payload rather than submitting stale text.
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeDisabled()

    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toEqual({
      notes: undefined,
      rail: 'pix'
    })
  })
})
