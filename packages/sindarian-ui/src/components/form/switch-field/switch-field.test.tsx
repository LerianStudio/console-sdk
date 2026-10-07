import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { SwitchField, SwitchFieldProps } from '.'

function FormHarness(
  props: Pick<SwitchFieldProps, 'disabled' | 'disabledTooltip'>
) {
  const form = useForm<{ businessDays: boolean }>({
    defaultValues: { businessDays: false }
  })

  return (
    <Form {...form}>
      <SwitchField
        control={form.control}
        name="businessDays"
        label="Business days"
        data-testid="business-days"
        {...props}
      />
    </Form>
  )
}

describe('SwitchField', () => {
  it.each([
    ['enabled', {}],
    ['disabled', { disabled: true }],
    ['disabled with a tooltip', { disabled: true, disabledTooltip: 'Gated' }]
  ])('names the switch by its label when %s', (_state, props) => {
    render(<FormHarness {...props} />)

    expect(
      screen.getByRole('switch', { name: 'Business days' })
    ).toHaveAttribute('data-testid', 'business-days')
  })
})
