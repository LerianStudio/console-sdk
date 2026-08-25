import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { TextareaField } from '.'

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

  describe.each([[null], [false], ['']])(
    'falsy label %p',
    (falsyLabel: unknown) => {
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
                // @ts-expect-error null/false are compile errors; '' is only
                // catchable at runtime. Both must still leave the control named.
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
    }
  )

  it('drops an empty aria-label instead of naming the control ""', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    function Nameless() {
      const form = useForm<{ notes: string }>({ defaultValues: { notes: '' } })
      return (
        <Form {...form}>
          {/* This COMPILES: `''` cannot be excluded from `string`, so the union
              accepts it. The runtime guard is the only thing standing here. */}
          <TextareaField
            control={form.control}
            name="notes"
            label=""
            aria-label=""
          />
        </Form>
      )
    }
    const { container } = render(<Nameless />)

    // An empty aria-label is worse than none — it must not reach the DOM.
    expect(container.querySelector('textarea')).not.toHaveAttribute(
      'aria-label'
    )
    // ...and the developer gets told, since the type cannot catch label="".
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
