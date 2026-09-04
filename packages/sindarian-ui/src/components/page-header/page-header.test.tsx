import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import {
  PageHeader,
  PageHeaderActionButtons,
  PageHeaderCollapsibleInfo,
  PageHeaderCollapsibleInfoTrigger,
  PageHeaderInfoTitle,
  PageHeaderWrapper
} from '.'

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

/**
 * The subtitle was painted `text-shadcn-400` (#A1A1AA): 2.56:1 on the white
 * `--background` and 2.33:1 on the `--body-surface` the console actually uses —
 * both under the 4.5:1 WCAG AA floor for body text, which is why downstream apps
 * had to shim this line locally. `--muted-foreground` reads 7.73:1 / 7.03:1 in
 * light and 5.81:1 in dark.
 *
 * `PageHeaderInfoTooltip` keeps `text-shadcn-400` on purpose: its surface is
 * `bg-shadcn-600` (#27272A), fixed dark in BOTH themes, so shadcn-400 there is a
 * deliberate light-on-dark pairing at 5.81:1 — the same pairing the base Tooltip
 * primitive uses. Swapping it for `--muted-foreground` would read 1.93:1 in the
 * light theme.
 */
describe('PageHeaderInfoTitle subtitle contrast', () => {
  it('paints the subtitle with the muted-foreground token', () => {
    render(<PageHeaderInfoTitle title="Ledgers" subtitle="Ledger overview" />)

    expect(screen.getByText('Ledger overview')).toHaveClass(
      'text-muted-foreground',
      'text-sm',
      'font-medium'
    )
  })

  it('no longer paints the subtitle with the sub-AA shadcn-400 grey', () => {
    render(<PageHeaderInfoTitle title="Ledgers" subtitle="Ledger overview" />)

    expect(screen.getByText('Ledger overview')).not.toHaveClass(
      'text-shadcn-400'
    )
  })
})

/**
 * The page title is the page heading, so `h1` stays the DEFAULT. What was
 * missing is the escape hatch: a consumer nesting this block under an existing
 * `h1` (a wizard step, an embedded panel) had no way to demote it and had to
 * re-implement the whole title block locally, class for class, to keep the
 * document outline valid. `as` mirrors `EntityBoxHeaderTitle`'s seam and leaves
 * the rendered classes untouched.
 */
describe('PageHeaderInfoTitle heading level', () => {
  it('renders an h1 by default, because it is the page heading', () => {
    render(<PageHeaderInfoTitle title="Ledgers" />)

    expect(screen.getByTestId('title').tagName).toBe('H1')
  })

  it('renders the requested level with identical testid and class output', () => {
    render(<PageHeaderInfoTitle title="Ledgers" as="h2" />)

    const el = screen.getByTestId('title')
    expect(el.tagName).toBe('H2')
    expect(el.getAttribute('class')).toBe('text-foreground text-4xl font-bold')
  })

  it('accepts every heading level h1-h6', () => {
    for (const level of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const) {
      const { unmount } = render(<PageHeaderInfoTitle title="L" as={level} />)
      expect(screen.getByTestId('title').tagName).toBe(level.toUpperCase())
      unmount()
    }
  })
})

/**
 * The disclosure question was an `h1`, so every page that opened `info` served
 * TWO `h1`s — one document, two top-level headings, which is what a screen
 * reader announces as two documents' worth of structure. The question titles a
 * real region under the page title, so it stays a heading (removing it from the
 * outline would cost heading navigation) and becomes the `h2` that its position
 * under the page `h1` describes. The rendered classes do not change.
 */
describe('PageHeaderCollapsibleInfo heading level', () => {
  const QUESTION = 'What is a ledger?'

  const openInfo = () => {
    render(
      <PageHeader>
        <PageHeaderWrapper>
          <PageHeaderInfoTitle title="Ledgers" />
          <PageHeaderCollapsibleInfoTrigger question={QUESTION} />
        </PageHeaderWrapper>
        <PageHeaderCollapsibleInfo
          question={QUESTION}
          answer="A ledger holds accounts."
        />
      </PageHeader>
    )
    fireEvent.click(screen.getByRole('button'))
  }

  it('leaves exactly one h1 on the page once the info panel is open', () => {
    openInfo()

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Ledgers'
    )
  })

  it('renders the question as the h2 its position describes', () => {
    openInfo()

    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent(QUESTION)
    expect(heading.getAttribute('class')).toBe(
      'text-foreground text-xl font-bold'
    )
  })
})

/**
 * `flex items-center gap-8` with no `wrap` and no `min-w-0`: a flex item never
 * shrinks below its own min-content, so a wide control in the action row pushed
 * the row past the content column instead of wrapping — measured as a viewport
 * overflow at 768px and 1280px. `flex-wrap` gives the row somewhere to go and
 * `min-w-0` lets the row itself shrink inside the header's own flex parent. The
 * gap is deliberately unchanged.
 */
describe('PageHeaderActionButtons overflow', () => {
  const row = (container: HTMLElement) =>
    container.querySelector('[data-slot="page-header-action-buttons"]')

  it('wraps and shrinks instead of overflowing the content column', () => {
    const { container } = render(
      <PageHeaderActionButtons>
        <button>Act</button>
      </PageHeaderActionButtons>
    )

    expect(row(container)).toHaveClass('flex', 'flex-wrap', 'min-w-0')
  })

  it('keeps the established gap and cross-axis alignment', () => {
    const { container } = render(<PageHeaderActionButtons />)

    expect(row(container)).toHaveClass('items-center', 'gap-8')
  })

  it('still merges a consumer className last', () => {
    const { container } = render(<PageHeaderActionButtons className="gap-2" />)

    const el = row(container)
    expect(el).toHaveClass('gap-2')
    expect(el).not.toHaveClass('gap-8')
  })
})
