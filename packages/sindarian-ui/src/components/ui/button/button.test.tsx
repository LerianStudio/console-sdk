import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { Button } from '.'

/**
 * Regression coverage for `asChild`.
 *
 * Button always renders three children (the two icon slots evaluate to `false`
 * when no `icon` is given). Without a `Slottable` marking the real child, Radix
 * Slot >=1.3.0 cannot tell which of the three to merge onto and throws
 * "Slot failed to slot onto its children" — which broke `<Button asChild>` for
 * every consumer, icon or not.
 */
describe('Button asChild', () => {
  it('renders the child element instead of a button, with no icon', () => {
    render(
      <Button asChild variant="link">
        <a href="/somewhere">Go somewhere</a>
      </Button>
    )

    const link = screen.getByRole('link', { name: 'Go somewhere' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/somewhere')
    // asChild must NOT leave a wrapping <button> around the anchor.
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('merges the button classes onto the child element', () => {
    render(
      <Button asChild variant="link" size="small" className="custom-class">
        <a href="/x">Styled</a>
      </Button>
    )

    const link = screen.getByRole('link', { name: 'Styled' })
    expect(link).toHaveClass('custom-class')
    expect(link).toHaveAttribute('data-slot', 'button')
  })

  it('keeps a start icon alongside the slotted child', () => {
    render(
      <Button asChild icon={<span data-testid="icon">*</span>}>
        <a href="/x">With icon</a>
      </Button>
    )

    const link = screen.getByRole('link', { name: /With icon/ })
    expect(link).toBeInTheDocument()
    // The icon renders inside the slotted element, not as a sibling of it.
    expect(link).toContainElement(screen.getByTestId('icon'))
  })

  it('keeps an end icon alongside the slotted child', () => {
    render(
      <Button
        asChild
        icon={<span data-testid="icon">*</span>}
        iconPlacement="end"
      >
        <a href="/x">Trailing</a>
      </Button>
    )

    expect(screen.getByRole('link', { name: /Trailing/ })).toContainElement(
      screen.getByTestId('icon')
    )
  })

  it('accepts a child whose own content is multiple nodes', () => {
    render(
      <Button asChild variant="link">
        <a href="/x">
          <span aria-hidden="true">↩</span>
          Back to list
        </a>
      </Button>
    )

    expect(
      screen.getByRole('link', { name: 'Back to list' })
    ).toBeInTheDocument()
  })
})

describe('Button without asChild', () => {
  it('still renders a native button (the Slottable path must be transparent)', () => {
    render(<Button variant="primary">Click me</Button>)

    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveAttribute('data-slot', 'button')
  })

  it('still renders its icon', () => {
    render(
      <Button icon={<span data-testid="icon">*</span>}>Has an icon</Button>
    )

    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Has an icon/ })
    ).toBeInTheDocument()
  })

  it('suppresses onClick when readOnly', () => {
    const onClick = jest.fn()

    render(
      <Button readOnly onClick={onClick}>
        Read only
      </Button>
    )

    screen.getByRole('button', { name: 'Read only' }).click()
    expect(onClick).not.toHaveBeenCalled()
  })
})
