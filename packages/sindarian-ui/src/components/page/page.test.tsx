import { render, screen } from '@testing-library/react'
import { PageContent } from '.'

/**
 * A PHONE PAID 128px BEFORE THE PAGE DREW ANYTHING.
 *
 * `PageContent` hard-codes `p-16`, which is 64px a side. On a 390px phone that
 * is a third of the screen spent on nothing, and Product Console kept a wrapper
 * of its own solely to add `max-sm:p-4`: measured at 390 on ten screens across
 * Midaz, Pix, Payments, Reporter, Tracer, Flowker and Settings, every one had
 * 262px of content left, and the pages adding their own `px-24` inside it were
 * down to 70px — which is where a transaction receipt's amount ran off its
 * card.
 *
 * `padding="compact"` is that wrapper, in the kit. What is at risk is not the
 * rule but the MERGE ORDER around it, and each consequence below is a class
 * attribute rather than an opinion, because `cn` is tailwind-merge: it resolves
 * a conflict per variant group and keeps the last writer.
 *
 *   * the phone rule is ADDED to the kit's padding, never in place of it, so
 *     nothing renders differently from 640px up;
 *   * a caller's own `max-sm:` padding REPLACES it rather than stacking with
 *     it, which is how a full-bleed page stays full-bleed on a phone;
 *   * a caller's plain `p-*` still beats `p-16` at desktop;
 *   * and a consumer that never asks for compact gets today's render, class for
 *     class — the case Product Console's own test cannot cover, because its
 *     wrapper always opts in.
 */
const classesOf = () =>
  (screen.getByTestId('page').getAttribute('class') ?? '').split(/\s+/)

describe('PageContent padding="compact"', () => {
  it('adds the phone padding and leaves the desktop padding alone', () => {
    render(
      <PageContent padding="compact" data-testid="page">
        content
      </PageContent>
    )

    const classes = classesOf()
    expect(classes).toContain('max-sm:p-4')
    expect(classes).toContain('p-16')
  })

  it('lets a full-bleed page replace the phone padding rather than stack it', () => {
    render(
      <PageContent
        padding="compact"
        className="p-0 max-sm:p-0"
        data-testid="page"
      >
        content
      </PageContent>
    )

    const classes = classesOf()
    expect(classes).toContain('p-0')
    expect(classes).toContain('max-sm:p-0')
    // Both of the component's own rules are gone, not merely outweighed: a
    // surviving `max-sm:p-4` would put a 16px frame back on a page that asked
    // to draw edge to edge, and it would win, being the later rule.
    expect(classes).not.toContain('max-sm:p-4')
    expect(classes).not.toContain('p-16')
  })

  it("keeps a caller's own padding at desktop", () => {
    render(
      <PageContent padding="compact" className="p-6" data-testid="page">
        content
      </PageContent>
    )

    const classes = classesOf()
    expect(classes).toContain('p-6')
    expect(classes).not.toContain('p-16')
    // Below 640px the phone rule still wins, which is the deal: 24px is a
    // desktop choice and this container's job is that a phone never pays it.
    expect(classes).toContain('max-sm:p-4')
  })
})

describe('PageContent without compact padding', () => {
  it.each([
    ['omitted', undefined],
    ['explicitly default', 'default' as const]
  ])('emits no phone rule at all when padding is %s', (_case, padding) => {
    render(
      <PageContent padding={padding} data-testid="page">
        content
      </PageContent>
    )

    expect(classesOf()).toContain('p-16')
    expect(classesOf().filter((name) => name.startsWith('max-sm:'))).toEqual([])
  })
})
