import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { PasswordField, PasswordFieldProps } from '.'

/**
 * THE EYE BUTTON HAD NO NAME.
 *
 * `IconButton` renders an `Eye` / `EyeOff` glyph and nothing else, so the only
 * control on the field besides the input itself announced as "button" — SC
 * 4.1.2. Every console form that takes a credential carries one: user creation,
 * the Correios BCB credentials, the webhook secret, the delivery-profile
 * password.
 *
 * `aria-pressed` carries the state (is the password showing) and the name
 * carries the action (what pressing it will do), so a reader gets both without
 * having to infer either from the glyph.
 */
type Credentials = { password: string }

const Subject = (
  props: Partial<PasswordFieldProps<Credentials, 'password'>>
) => {
  const form = useForm<Credentials>({ defaultValues: { password: '' } })

  return (
    <Form {...form}>
      <PasswordField
        name="password"
        label="Password"
        control={form.control}
        {...props}
      />
    </Form>
  )
}

const toggle = () => screen.getByRole('button')

describe('PasswordField visibility toggle', () => {
  it('names itself in English with no props', () => {
    render(<Subject />)

    expect(
      screen.getByRole('button', { name: 'Show password' })
    ).toBeInTheDocument()
  })

  it('names the action for the state it is in', async () => {
    render(<Subject />)
    await userEvent.click(toggle())

    expect(
      screen.getByRole('button', { name: 'Hide password' })
    ).toBeInTheDocument()
  })

  it('takes translated labels for both states', async () => {
    render(
      <Subject
        showPasswordLabel="Mostrar senha"
        hidePasswordLabel="Ocultar senha"
      />
    )

    expect(
      screen.getByRole('button', { name: 'Mostrar senha' })
    ).toBeInTheDocument()

    await userEvent.click(toggle())
    expect(
      screen.getByRole('button', { name: 'Ocultar senha' })
    ).toBeInTheDocument()
  })

  it('reports whether the password is showing through aria-pressed', async () => {
    render(<Subject />)

    expect(toggle()).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(toggle())
    expect(toggle()).toHaveAttribute('aria-pressed', 'true')
  })

  it('is a plain button, so it never submits the form around it', () => {
    render(<Subject />)

    expect(toggle()).toHaveAttribute('type', 'button')
  })

  it('still flips the input between password and text', async () => {
    const { container } = render(<Subject />)
    const input = () => container.querySelector('input')

    expect(input()).toHaveAttribute('type', 'password')

    await userEvent.click(toggle())
    expect(input()).toHaveAttribute('type', 'text')
  })
})
