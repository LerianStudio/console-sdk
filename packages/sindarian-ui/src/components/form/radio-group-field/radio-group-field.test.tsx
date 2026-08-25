import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { RadioGroupField } from '.'

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
})
