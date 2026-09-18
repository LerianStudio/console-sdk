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
 * The name carries the action — what pressing it will do — which is also the
 * only state a reader needs, and it is the ONLY thing the button exposes: a
 * flipping name plus `aria-pressed` announces "Hide password, pressed" while
 * the password is visible, which reads as the opposite of the truth.
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

  /**
   * ⛔ A NAME THAT FLIPS AND A PRESSED STATE ARE TWO DIFFERENT CONTROLS, AND
   * SHIPPING BOTH SAID THE OPPOSITE OF WHAT IT MEANT.
   *
   * WAI-ARIA APG, Button Pattern: a toggle whose label changes must not also
   * expose `aria-pressed`, because assistive technology announces name THEN
   * state. With the password visible the button announced "Hide password,
   * pressed" — which reads as "hiding is on", i.e. the password is hidden,
   * the exact opposite of the truth. The name already carries the state, by
   * carrying the action that is available from it.
   */
  it('exposes no aria-pressed, because the flipping name already carries the state', async () => {
    render(<Subject />)

    expect(toggle()).not.toHaveAttribute('aria-pressed')

    await userEvent.click(toggle())
    expect(toggle()).not.toHaveAttribute('aria-pressed')
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
