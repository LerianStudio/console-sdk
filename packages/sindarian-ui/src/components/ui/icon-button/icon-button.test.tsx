import '@testing-library/jest-dom'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { render, screen } from '@testing-library/react'
import { IconButton } from '.'

const styles = readFileSync(resolve(__dirname, 'styles.css'), 'utf8')

/**
 * ⛔ A ROW-ACTIONS KEBAB IS THE ONLY CONTROL IN ITS ROW, AND IT WAS 32x32.
 *
 * Every icon control in a console shell is 40x40 — `.icon-button-base` is
 * `size-10`. The listings' actions trigger is `size="small"`, so it rendered
 * 32x32: measured on the ledgers, transactions and bank-transfer listings at a
 * 390px viewport. WCAG 2.2 AA (SC 2.5.8, 24x24) was met; the shell's own bar
 * was not.
 *
 * The repair could not be a bigger button. `TableCell` is `py-4`, so a
 * `size-10` trigger takes the row from 64.5px to 72.5px and a phone shows
 * fewer rows for it — and `size="small"` has nine other call sites in this
 * package whose layouts are built around a 32px box, `CopyField`'s 40px row
 * among them. So the GLYPH stays 2rem and only the TARGET grows, through an
 * absolutely positioned pseudo-element that takes part in hit testing and in
 * no layout at all.
 *
 * jsdom computes no layout and resolves no `calc`, so these read the
 * stylesheet as text. The geometry — eight points walked around the 2.5rem
 * perimeter, and the table row measured either side of the change — is
 * `scripts/measure-phone-shapes.mjs`. What is guarded here is that the rule
 * exists, that it cannot grow the box it is attached to, and that its target
 * is the same token as the default size rather than a second number that can
 * drift.
 */
describe('IconButton size variants', () => {
  it('emits the small class for size="small"', () => {
    render(<IconButton size="small" aria-label="Row actions" />)

    expect(screen.getByRole('button', { name: 'Row actions' })).toHaveClass(
      'icon-button-small'
    )
  })

  it('leaves the default size on the base class alone', () => {
    render(<IconButton aria-label="Open navigation" />)

    const button = screen.getByRole('button', { name: 'Open navigation' })
    expect(button).toHaveClass('icon-button-base')
    expect(button).not.toHaveClass('icon-button-small')
  })
})

describe('the small icon button target', () => {
  it('grows the target with a pseudo-element rather than the box', () => {
    expect(styles).toMatch(/\.icon-button-small::after\s*\{/)
    expect(styles).toMatch(/\.icon-button-small\s*\{[^}]*?(?<![:\w-])size-8/)
  })

  /**
   * The whole point: a pseudo-element that is not out of flow would push the
   * row taller, which is the cost the bigger button was rejected for.
   */
  it('takes the target out of flow so no layout moves', () => {
    const rule = styles.match(/\.icon-button-small::after\s*\{([^}]*)\}/)![1]

    expect(rule).toMatch(/position:\s*absolute/)
    expect(rule).toMatch(/content:\s*''/)
  })

  /**
   * ⚠️ ONE NUMBER, NOT TWO. The target is `.icon-button-base`'s own size, so
   * "the small button answers the same target as every other icon control" is
   * true by construction. Restated as a literal it would go stale the first
   * time the default size moved, silently, with nothing in CI to notice.
   */
  it('states the target as the default icon button size', () => {
    const target = styles.match(
      /--spacing-icon-button-target:\s*calc\(var\(--spacing\) \* (\d+)\)/
    )![1]
    // The button's OWN size, not the `[&>*]:size-6` it gives its glyph: the
    // lookbehind drops any `size-` that a variant prefix introduced, and the
    // lazy quantifier takes the first one left.
    const base = styles.match(
      /\.icon-button-base\s*\{[^}]*?(?<![:\w-])size-(\d+)/
    )![1]

    expect(target).toBe(base)
    expect(styles).toMatch(
      /\.icon-button-small::after\s*\{[^}]*var\(--spacing-icon-button-target\)/
    )
  })

  /**
   * Centred on the button rather than inset by a constant, because a negative
   * `inset` is measured from the PADDING box: `.button-outline` carries a 1px
   * transparent border, so `-inset-1` came out 38x38 and three of the eight
   * perimeter points fell outside the target. Half of 50% resolves against
   * whatever the box actually is.
   */
  it('centres the target so a border cannot shrink it', () => {
    const rule = styles.match(/\.icon-button-small::after\s*\{([^}]*)\}/)![1]

    expect(rule).toMatch(/inset:\s*calc\(50% - /)
  })
})
