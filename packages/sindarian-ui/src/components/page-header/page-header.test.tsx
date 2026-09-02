import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { PageHeader, PageHeaderInfoTitle } from '.'

/**
 * PageHeader forced `mt-12` on its root and `mb-12` on the info-title wrapper
 * with no way to reach either: `className` routes to the inner Collapsible and
 * to the `h1` respectively. Consumers that needed tighter page chrome had to
 * carry an unlayered CSS override. `rootClassName` and `containerClassName` are
 * the seams; both merge AFTER the hard-coded margin so consumer utilities win
 * through tailwind-merge.
 */
describe('PageHeader root seam', () => {
  const root = (container: HTMLElement) =>
    container.querySelector('[data-slot="page-header"]')

  it('keeps the default top margin when no seam is passed', () => {
    const { container } = render(
      <PageHeader>
        <div>content</div>
      </PageHeader>
    )

    expect(root(container)).toHaveClass('mt-12')
  })

  it('has no bottom margin while collapsed', () => {
    const { container } = render(
      <PageHeader>
        <div>content</div>
      </PageHeader>
    )

    expect(root(container)).not.toHaveClass('mb-12')
  })

  it('lets rootClassName override the default top margin', () => {
    const { container } = render(
      <PageHeader rootClassName="mt-0">
        <div>content</div>
      </PageHeader>
    )

    const el = root(container)
    expect(el).toHaveClass('mt-0')
    expect(el).not.toHaveClass('mt-12')
  })

  it('still routes className to the inner collapsible, not the root', () => {
    const { container } = render(
      <PageHeader className="collapsible-target">
        <div>content</div>
      </PageHeader>
    )

    expect(root(container)).not.toHaveClass('collapsible-target')
    expect(container.querySelector('.collapsible-target')).toBeInTheDocument()
  })
})

describe('PageHeaderInfoTitle container seam', () => {
  const wrapper = (container: HTMLElement) =>
    container.querySelector('[data-slot="page-header-info-title"]')

  it('keeps the default bottom margin when no seam is passed', () => {
    const { container } = render(<PageHeaderInfoTitle title="Ledgers" />)

    expect(wrapper(container)).toHaveClass('mb-12', 'flex', 'flex-col', 'gap-4')
  })

  it('lets containerClassName override the default bottom margin', () => {
    const { container } = render(
      <PageHeaderInfoTitle title="Ledgers" containerClassName="mb-0" />
    )

    const el = wrapper(container)
    expect(el).toHaveClass('mb-0')
    expect(el).not.toHaveClass('mb-12')
  })

  it('still routes className to the heading, not the container', () => {
    const { container } = render(
      <PageHeaderInfoTitle title="Ledgers" className="heading-target" />
    )

    expect(wrapper(container)).not.toHaveClass('heading-target')
    expect(screen.getByTestId('title')).toHaveClass('heading-target')
  })
})
