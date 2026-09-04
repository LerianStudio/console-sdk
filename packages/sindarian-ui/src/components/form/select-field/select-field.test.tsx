import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { MultipleSelectItem } from '@/components/ui/multiple-select'
import { SelectItem } from '@/components/ui/select'
import { SelectField } from '.'

/** jsdom implements none of these, and Radix Select reaches for all three the
 *  moment its list opens. Without them the list never mounts, and a test that
 *  "picks an option" silently asserts nothing. */
Element.prototype.hasPointerCapture = function hasPointerCapture(): boolean {
  return false
}
Element.prototype.releasePointerCapture =
  function releasePointerCapture(): void {}
Element.prototype.scrollIntoView = function scrollIntoView(): void {}

function FormHarness({
  onSubmit
}: {
  onSubmit?: (values: { rail: string }) => void
}) {
  const form = useForm<{ rail: string }>({ defaultValues: { rail: '' } })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit?.(values))}>
        <SelectField
          control={form.control}
          name="rail"
          label="Rail"
          placeholder="Pick a rail"
        >
          <SelectItem value="pix">Pix</SelectItem>
          <SelectItem value="ted">TED</SelectItem>
        </SelectField>
        <button type="submit">Submit</button>
      </form>
    </Form>
  )
}

/**
 * Open the select and choose an option by its visible label.
 *
 * A test that only asserts the form's starting value passes whether or not the
 * component can be picked from at all — the point of a select. Driving the real
 * Radix interaction is what makes these assertions load-bearing.
 */
async function pick(label: string) {
  const trigger = screen.getByRole('combobox')

  fireEvent.keyDown(trigger, { key: 'ArrowDown' })

  const option = await screen.findByRole('option', { name: label })
  // jsdom ships no PointerEvent, so Radix's item never sees `pointerType:
  // 'mouse'` and stays on its touch branch — where `click` is the gesture that
  // commits the pick. `pointerUp` is the mouse-branch twin and is inert here.
  fireEvent.click(option)

  await waitFor(() =>
    expect(
      screen.queryByRole('option', { name: label })
    ).not.toBeInTheDocument()
  )
}

describe('SelectField with react-hook-form', () => {
  it('renders the label and the placeholder', () => {
    render(<FormHarness />)

    expect(screen.getByText('Rail')).toBeInTheDocument()
    expect(screen.getByText('Pick a rail')).toBeInTheDocument()
  })

  it('submits the picked value', async () => {
    const onSubmit = jest.fn()
    render(<FormHarness onSubmit={onSubmit} />)

    await pick('TED')

    fireEvent.click(screen.getByText('Submit'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ rail: 'ted' }))
  })
})

describe('SelectField without react-hook-form', () => {
  function StateHarness({ onChange }: { onChange?: (value: string) => void }) {
    const [rail, setRail] = useState('pix')

    return (
      <>
        <SelectField
          name="rail"
          label="Rail"
          value={rail}
          onChange={(value) => {
            setRail(value)
            onChange?.(value)
          }}
        >
          <SelectItem value="pix">Pix</SelectItem>
          <SelectItem value="ted">TED</SelectItem>
        </SelectField>
        <output>{rail}</output>
      </>
    )
  }

  it('drives a useState filter bar with no control prop', () => {
    render(<StateHarness />)

    expect(screen.getByText('Rail')).toBeInTheDocument()
    // The trigger prints the value the caller holds in state.
    expect(screen.getByRole('combobox')).toHaveTextContent('Pix')
  })

  it('reports the picked value through onChange with no control prop', async () => {
    const onChange = jest.fn()
    render(<StateHarness onChange={onChange} />)

    await pick('TED')

    expect(onChange).toHaveBeenCalledWith('ted')
    // The caller's state won the round trip, so the trigger reads back the pick.
    expect(screen.getByRole('combobox')).toHaveTextContent('TED')
    expect(screen.getByText('ted')).toBeInTheDocument()
  })

  it('renders its description with no control prop', () => {
    render(
      <SelectField name="rail" label="Rail" description="Scopes the blotter">
        <SelectItem value="pix">Pix</SelectItem>
      </SelectField>
    )

    expect(screen.getByText('Scopes the blotter')).toBeInTheDocument()
  })
})

/**
 * `multi` used to be an ordinary boolean beside `value?: string | string[]` and
 * a union `onChange`, so `multi` with `value="pix"` compiled and the multi
 * implementation quietly turned it into `[]` — a selection the caller asked for
 * and never got. `multi` is the discriminant now: the array shape is the only
 * one it accepts, and a multi consumer's `onChange` receives `string[]` with no
 * cast at the call site.
 */
describe('SelectField in multi mode', () => {
  function MultiHarness({
    onChange
  }: {
    onChange?: (value: string[]) => void
  }) {
    const [rails, setRails] = useState<string[]>(['pix'])

    return (
      <>
        <SelectField
          name="rails"
          label="Rails"
          multi
          value={rails}
          onChange={(value) => {
            setRails(value)
            onChange?.(value)
          }}
        >
          <MultipleSelectItem value="pix">Pix</MultipleSelectItem>
          <MultipleSelectItem value="ted">TED</MultipleSelectItem>
        </SelectField>
        <output>{rails.join(',')}</output>
      </>
    )
  }

  it('renders the controlled array value with no casts at the call site', () => {
    render(<MultiHarness />)

    expect(screen.getByText('Rails')).toBeInTheDocument()
    expect(screen.getByText('pix')).toBeInTheDocument()
  })

  it('reports the picked values as an array', async () => {
    const onChange = jest.fn()
    render(<MultiHarness onChange={onChange} />)

    // Clicking the trigger opens the list; cmdk commits the pick on click.
    fireEvent.click(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByRole('option', { name: 'TED' }))

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(['pix', 'ted']))
    // The caller's state won the round trip, so both chips are on the trigger.
    expect(screen.getByText('pix,ted')).toBeInTheDocument()
  })
})
