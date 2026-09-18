import { render, screen } from '@testing-library/react'
import { Breadcrumb } from '.'

/**
 * A breadcrumb trail says two things: where this page sits, and which crumb IS
 * this page. Both were broken by the same loop.
 *
 * The separator was emitted inside the per-item fragment, so it followed EVERY
 * crumb including the last one and the trail ended in a dangling chevron — a
 * pointer to a level that does not exist. A separator is `role="presentation"`,
 * so no screen reader announced it, but every sighted reader saw it.
 *
 * The current page was only marked when the caller happened to omit `href`.
 * `getBreadcrumbPaths` has no rule that the last entry drops it, and the
 * consoles that DO pass one shipped a trail where nothing carried
 * `aria-current="page"` and the final crumb was a live link to the page the
 * reader is already on.
 */
const PATHS = [
  { name: 'Reporter', href: '/reporter' },
  { name: 'Reports', href: '/reporter/reports' },
  { name: 'Overview', href: '/reporter/reports/overview' }
]

describe('Breadcrumb', () => {
  it('puts a separator BETWEEN crumbs only', () => {
    const { container } = render(<Breadcrumb paths={PATHS} />)

    expect(
      container.querySelectorAll('[data-slot="breadcrumb-separator"]')
    ).toHaveLength(PATHS.length - 1)
  })

  it('renders no separator at all for a single crumb', () => {
    const { container } = render(<Breadcrumb paths={[PATHS[0]]} />)

    expect(
      container.querySelectorAll('[data-slot="breadcrumb-separator"]')
    ).toHaveLength(0)
  })

  it('marks the last crumb as the current page even when it carries an href', () => {
    render(<Breadcrumb paths={PATHS} />)

    const current = screen.getByText('Overview')
    expect(current).toHaveAttribute('aria-current', 'page')
  })

  it('does not leave the current page as a live link', () => {
    const { container } = render(<Breadcrumb paths={PATHS} />)

    expect(
      Array.from(container.querySelectorAll('a')).map((a) => a.textContent)
    ).toEqual(['Reporter', 'Reports'])
  })

  it('keeps ancestors as links to their own href', () => {
    render(<Breadcrumb paths={PATHS} />)

    expect(screen.getByRole('link', { name: 'Reporter' })).toHaveAttribute(
      'href',
      '/reporter'
    )
  })

  /**
   * ⛔ PLAIN TEXT MEANS NO ROLE AT ALL, NOT A SWITCHED-OFF LINK.
   *
   * `BreadcrumbPage` hard-codes `role="link" aria-disabled="true"`, which is
   * the right shape for the LAST crumb — the page you are on, a destination
   * that exists and is simply not navigable from here. An href-less ANCESTOR
   * is a grouping label ("Settings", "Reporter"): there is no page behind it,
   * so announcing "Settings, link, dimmed" tells the reader a destination is
   * unavailable to them rather than that it was never a destination. It also
   * inflates the link count of every trail that carries one.
   */
  it('renders an ancestor without an href as plain text, with no role at all', () => {
    const { container } = render(
      <Breadcrumb paths={[{ name: 'Group' }, ...PATHS]} />
    )

    expect(container.querySelector('a[href=""]')).toBeNull()

    const ancestor = screen.getByText('Group')
    expect(ancestor).not.toHaveAttribute('aria-current')
    expect(ancestor).not.toHaveAttribute('role')
    expect(ancestor).not.toHaveAttribute('aria-disabled')
    expect(
      screen.queryByRole('link', { name: 'Group' })
    ).not.toBeInTheDocument()
  })

  it('still announces the current page as a disabled link, which it is', () => {
    render(<Breadcrumb paths={PATHS} />)

    const current = screen.getByText(PATHS[PATHS.length - 1].name)
    expect(current).toHaveAttribute('role', 'link')
    expect(current).toHaveAttribute('aria-disabled', 'true')
    expect(current).toHaveAttribute('aria-current', 'page')
  })

  it('marks exactly one crumb as current', () => {
    const { container } = render(<Breadcrumb paths={PATHS} />)

    expect(container.querySelectorAll('[aria-current="page"]')).toHaveLength(1)
  })
})
