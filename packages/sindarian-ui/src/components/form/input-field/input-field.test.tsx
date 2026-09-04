import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
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
