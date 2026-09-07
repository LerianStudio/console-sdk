import '@testing-library/jest-dom'
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from './form'
import { Input } from '@/components/ui/input'

function Harness({ message }: { message?: string }) {
  const form = useForm<{ amount: string }>({ defaultValues: { amount: '' } })

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Amount</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage>{message}</FormMessage>
            <FormDescription>Gross settlement amount</FormDescription>
          </FormItem>
        )}
      />
    </Form>
  )
}

describe('FormMessage', () => {
  it('paints validation copy with the error TEXT token, not the fill', () => {
    // `text-destructive` is the badge/fill family: ~3.8:1 as ink, under AA.
    // Validation copy is text, so it takes the text token.
    render(<Harness message="Amount is required" />)

    const message = screen.getByText('Amount is required')
    expect(message).toHaveClass('text-system-error-h1a')
    expect(message).not.toHaveClass('text-destructive')
  })

  it('renders nothing when there is no error and no child', () => {
    const { container } = render(<Harness />)
    expect(container.querySelector('[id$="-form-item-message"]')).toBeNull()
  })
})

describe('Form primitives outside a form context', () => {
  // A filter bar driven by `useState` has no react-hook-form provider. Before
  // this, `useFormField` destructured a null `useFormContext()` and every
  // primitive threw on render, which is what forced InputField/SelectField to
  // demand a `control`.
  it('renders label, control, message and description standalone', () => {
    render(
      <FormItem required>
        <FormLabel>Search</FormLabel>
        <FormControl>
          <Input defaultValue="pix" />
        </FormControl>
        <FormMessage>Standalone note</FormMessage>
        <FormDescription>Filter the blotter</FormDescription>
      </FormItem>
    )

    // `required` appends ' *' inside the same span, so match loosely.
    expect(screen.getByText(/Search/)).toBeInTheDocument()
    expect(screen.getByText('Standalone note')).toBeInTheDocument()
    expect(screen.getByText('Filter the blotter')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('pix')
  })
})

/**
 * `aria-describedby` on the control must name only ids that exist.
 *
 * `FormControl` cannot see its siblings, so it used to point at the description
 * id unconditionally — and the *Field wrappers all render the description
 * conditionally (`{description && <FormDescription>…}`), so every field without
 * one shipped a dangling IDREF. Screen readers drop an unresolvable reference,
 * so nobody hit a barrier, but a form of thirteen such fields carries thirteen
 * broken associations and any real one is impossible to spot among them.
 *
 * The message id was the mirror defect: it was added only when react-hook-form
 * reported an `error`, so a `<FormMessage>` given plain children rendered copy
 * that the control never pointed at.
 */
function ErrorHarness({ message }: { message: string }) {
  const form = useForm<{ amount: string }>({ defaultValues: { amount: '' } })

  React.useEffect(() => {
    form.setError('amount', { type: 'manual', message })
  }, [form, message])

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="amount"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Amount</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ''} />
            </FormControl>
            <FormMessage />
            <FormDescription>Gross settlement amount</FormDescription>
          </FormItem>
        )}
      />
    </Form>
  )
}

describe('FormControl aria-describedby', () => {
  it('is absent when neither a description nor a message renders', () => {
    render(
      <FormItem>
        <FormLabel>Search</FormLabel>
        <FormControl>
          <Input />
        </FormControl>
        <FormMessage />
      </FormItem>
    )

    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby')
  })

  it('names the description when one renders', () => {
    render(
      <FormItem>
        <FormLabel>Search</FormLabel>
        <FormControl>
          <Input />
        </FormControl>
        <FormMessage />
        <FormDescription>Filter the blotter</FormDescription>
      </FormItem>
    )

    const input = screen.getByRole('textbox')
    const described = input.getAttribute('aria-describedby')

    expect(described).toBe(screen.getByText('Filter the blotter').id)
  })

  it('names a message that renders without a form error', () => {
    render(
      <FormItem>
        <FormLabel>Search</FormLabel>
        <FormControl>
          <Input />
        </FormControl>
        <FormMessage>Standalone note</FormMessage>
      </FormItem>
    )

    const input = screen.getByRole('textbox')

    expect(input.getAttribute('aria-describedby')).toBe(
      screen.getByText('Standalone note').id
    )
  })

  it('names the message and the description together', () => {
    render(<ErrorHarness message="Amount is required" />)

    const input = screen.getByRole('textbox')
    const ids = input.getAttribute('aria-describedby')!.split(' ')

    expect(ids).toContain(screen.getByText('Amount is required').id)
    expect(ids).toContain(screen.getByText('Gross settlement amount').id)
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('lets the child element keep its own describedby', () => {
    render(
      <FormItem>
        <FormControl>
          <Input aria-describedby="external-hint" />
        </FormControl>
        <FormDescription>Filter the blotter</FormDescription>
      </FormItem>
    )

    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      'external-hint'
    )
  })
})
