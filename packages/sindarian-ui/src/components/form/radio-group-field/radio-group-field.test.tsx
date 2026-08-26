import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createPortal } from 'react-dom'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { RadioGroupField } from '.'

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

  it('names the group with its visible label', () => {
    // `FormLabel` names its control through `htmlFor`, which cannot reach the
    // Radix radiogroup root (a plain div) — so the visible label was decoration
    // and the group reached a screen reader nameless. It now points back at the
    // label with aria-labelledby.
    render(<Harness />)

    expect(screen.getByRole('radiogroup', { name: 'Rail' })).toBeInTheDocument()
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
  ])('treats a portal label as absent (%s)', (_kind, aria) => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    function WithPortal() {
      const form = useForm<{ rail: string }>({ defaultValues: { rail: '' } })
      return (
        <Form {...form}>
          <RadioGroupField
            control={form.control}
            name="rail"
            label={createPortal('Rail', document.body)}
            aria-label={aria}
            options={[{ value: 'pix', label: 'Pix' }]}
          />
        </Form>
      )
    }

    // Must still not crash: a portal is not an element and Children.toArray
    // hands it straight back, so a missing base case overflows the stack.
    expect(() => render(<WithPortal />)).not.toThrow()
    const warned = spy.mock.calls.some((call) =>
      String(call[0]).includes('no accessible name')
    )
    spy.mockRestore()
    // The portal renders its text into document.body — OUTSIDE the label — so
    // the label element is empty and names nothing. It looks labelled on screen
    // and is silent to a screen reader, which is the whole point of the guard.
    // Only the aria-label rescues it.
    expect(warned).toBe(aria === undefined)
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
