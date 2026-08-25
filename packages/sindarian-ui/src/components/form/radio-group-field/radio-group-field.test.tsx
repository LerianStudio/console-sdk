import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useForm, type UseFormReturn } from 'react-hook-form'
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
