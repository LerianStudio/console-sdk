import '@testing-library/jest-dom'
import React from 'react'
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

/**
 * ⛔ TWO FIFTHS OF A PHONE IS NOT A PANEL.
 *
 * `w-2/5` and `p-12` were unconditional. At a 390px viewport that is a 156px
 * panel with 59px of usable width, and a form field inside it measures 9px of
 * text; at 320px the panel is 128px and the field has nothing at all, its own
 * padding being wider than its box. Measured in Chromium, both arms, in
 * `scripts/measure-phone-shapes.mjs`.
 *
 * These are token assertions: jsdom evaluates no media query, so what is
 * guarded here is which classes survive `cn`, and the geometry is the
 * harness's to prove. Which classes survive IS the mechanism, though — the
 * phone values carry `max-sm:` and the desktop ones do not, precisely so that
 * tailwind-merge leaves the phone step standing when a caller replaces the
 * desktop width. The fifteen product-console sheets that declare a pixel width
 * of their own, and the two that declare `w-full`, all keep it and all fill a
 * phone; none had to change.
 */
const panelOf = (ui: React.ReactElement) => {
  const { baseElement } = render(ui)
  return baseElement.querySelector('[data-slot="sheet-content"]')!
}

describe('SheetContent on a phone', () => {
  it('fills the screen and drops its side padding below sm', () => {
    const panel = panelOf(
      <Sheet open>
        <SheetContent side="right" aria-describedby={undefined}>
          <SheetTitle>Filters</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    expect(panel).toHaveClass('max-sm:w-full', 'max-sm:px-4')
  })

  it('keeps the desktop panel exactly as it was', () => {
    const panel = panelOf(
      <Sheet open>
        <SheetContent side="right" aria-describedby={undefined}>
          <SheetTitle>Filters</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    expect(panel).toHaveClass('w-2/5', 'p-12')
  })

  /**
   * THE REASON THE MODIFIER SITS ON THE PHONE HALF. tailwind-merge drops a
   * conflicting class only when the modifiers match, so a bare `w-[594px]`
   * reaches `w-2/5` and cannot reach `max-sm:w-full`. Written the other way
   * round — `w-full sm:w-2/5` — this caller would have been overruled at every
   * desktop width instead, which is the same bug pointing outward.
   */
  it('lets a caller keep its own desktop width and still fill a phone', () => {
    const panel = panelOf(
      <Sheet open>
        <SheetContent
          side="right"
          className="flex w-[594px] flex-col"
          aria-describedby={undefined}
        >
          <SheetTitle>Providers</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    expect(panel).toHaveClass('w-[594px]', 'max-sm:w-full')
    expect(panel).not.toHaveClass('w-2/5')
  })

  /**
   * ⛔ THE SAME MECHANISM, FELT AS A COST. A bare `p-0` drops `p-12` and
   * cannot reach `max-sm:px-4`, so a panel that asked for no padding gets 16px
   * a side below 40rem. Deliberate — it is what carries the phone step to the
   * call sites that need it — and identical to what product-console's own
   * unlayered rule already did to its five `p-0` sheets. Pinned because it is
   * a real behaviour change from 2.0.0-beta.11 for any other consumer, and the
   * case below is the way out.
   */
  it('still gives a phone its side padding when a caller passes a bare p-0', () => {
    const panel = panelOf(
      <Sheet open>
        <SheetContent
          side="right"
          className="flex flex-col p-0"
          aria-describedby={undefined}
        >
          <SheetTitle>Templates</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    expect(panel).toHaveClass('p-0', 'max-sm:px-4')
    expect(panel).not.toHaveClass('p-12')
  })

  /**
   * The escape hatch, which product-console's unlayered rule did not have: a
   * caller that genuinely wants its own phone width says so with the same
   * modifier, and that one wins.
   */
  it('yields the phone width to a caller that states one', () => {
    const panel = panelOf(
      <Sheet open>
        <SheetContent
          side="right"
          className="max-sm:w-[320px] max-sm:p-0"
          aria-describedby={undefined}
        >
          <SheetTitle>Narrow</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    expect(panel).toHaveClass('max-sm:w-[320px]', 'max-sm:p-0')
    expect(panel).not.toHaveClass('max-sm:w-full')
    expect(panel).not.toHaveClass('max-sm:px-4')
  })

  /**
   * A top or bottom sheet is already full width through `inset-x-0`, so it
   * declares no width and takes only the padding step — 48px a side is a
   * quarter of a 390px screen whichever edge the panel came from.
   */
  it('gives a top sheet the padding step and no width', () => {
    const panel = panelOf(
      <Sheet open>
        <SheetContent side="top" aria-describedby={undefined}>
          <SheetTitle>Banner</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    expect(panel).toHaveClass('inset-x-0', 'max-sm:px-4')
    expect(panel).not.toHaveClass('max-sm:w-full')
  })
})

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
