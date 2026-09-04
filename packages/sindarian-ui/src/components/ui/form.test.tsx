import '@testing-library/jest-dom'
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
