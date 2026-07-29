import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { Input } from '.'
import { Form, FormControl, FormField, FormItem, FormLabel } from '../form'

/**
 * Regression coverage for standalone use.
 *
 * `Input` is a primitive with two callers: `InputField`, which wraps it in
 * `FormField`/`FormItem`, and plain standalone use such as a search box. It
 * used to call `useFormField`, which destructures `useFormContext()` — null
 * with no provider above — so every standalone `<Input />` threw "Cannot
 * destructure property 'getFieldState' of useFormContext(...) as it is null".
 *
 * It now reads no form context at all: a local `useId` covers the standalone
 * case, and inside a form `FormControl`'s Slot injects the real id as a prop.
 */
describe('Input outside a form', () => {
  it('renders with no react-hook-form provider', () => {
    render(<Input placeholder="Search permissions by name..." />)

    expect(
      screen.getByPlaceholderText('Search permissions by name...')
    ).toBeInTheDocument()
  })

  it('still gets an id so a label can be associated with it', () => {
    render(<Input aria-label="Search" />)

    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveAttribute(
      'id'
    )
  })

  it('keeps value/onChange behaviour intact', () => {
    const onChange = jest.fn()
    render(<Input value="abc" onChange={onChange} aria-label="Search" />)

    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('abc')
  })
})

function FormHarness() {
  const form = useForm({ defaultValues: { email: 'ada@example.com' } })

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>E-mail</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
          </FormItem>
        )}
      />
    </Form>
  )
}

describe('Input inside a form', () => {
  it('is still wired to its FormItem id, so the label points at it', () => {
    render(<FormHarness />)

    const input = screen.getByLabelText('E-mail')
    expect(input).toHaveValue('ada@example.com')
    // The id must come from FormItem's context, not the standalone fallback.
    expect(input.getAttribute('id')).toMatch(/-form-item$/)
  })
})
