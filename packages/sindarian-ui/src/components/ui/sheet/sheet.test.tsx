import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { Sheet, SheetContent, SheetTitle } from '.'

/**
 * THE CLOSE CONTROL WAS INVISIBLE TO A KEYBOARD.
 *
 * `SheetPrimitive.Close` carried `focus:outline-hidden` and no ring, so it
 * removed the user agent's own focus indicator and put nothing in its place:
 * a reader tabbing through an open sheet had no way to see where they were
 * (SC 2.4.7). The kit has no global `focus-visible` rule, so nothing supplied
 * one from outside either.
 *
 * It was survivable while a sheet was a form panel someone had deliberately
 * opened. The sidebar drawer made this control part of the NAVIGATION path on
 * every phone, which is what moved it from a latent defect to a live one.
 *
 * The ring is the idiom `.button-base` (`ui/button/styles.css:33`), `Checkbox`
 * and `Textarea` already ship — `ring-ring` at 2px with a 2px offset against
 * `ring-offset-background`. No new colour, no new token.
 */
const Subject = () => (
  <Sheet open>
    <SheetContent aria-describedby={undefined}>
      <SheetTitle>Filters</SheetTitle>
    </SheetContent>
  </Sheet>
)

describe('SheetContent close button', () => {
  const close = () => screen.getByRole('button', { name: 'Close' })

  it('shows a focus ring when reached by keyboard', () => {
    render(<Subject />)

    expect(close()).toHaveClass(
      'focus-visible:ring-ring',
      'focus-visible:ring-2',
      'focus-visible:ring-offset-2'
    )
  })

  it('anchors the ring offset to the surface behind it', () => {
    render(<Subject />)

    expect(close()).toHaveClass('ring-offset-background')
  })

  /**
   * The old class removed the user agent's outline unconditionally, including
   * for keyboard focus. Only the `focus-visible` form may suppress it, and only
   * because the ring above replaces it.
   */
  it('no longer suppresses the outline on every focus', () => {
    render(<Subject />)

    expect(close()).not.toHaveClass('focus:outline-hidden')
  })
})
