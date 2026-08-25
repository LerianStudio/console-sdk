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
