import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { AppShell } from '.'

/** Count non-overlapping occurrences of a literal substring. */
function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}

describe('AppShell — landmark frame', () => {
  it('renders EXACTLY ONE <main> — the content column, never a second main from the inset', () => {
    const { container } = render(<AppShell>body</AppShell>)

    expect(container.querySelectorAll('main')).toHaveLength(1)
    // The inset column survives as a div carrying the same data-slot, so
    // consumers/styles keyed on it still hit.
    const inset = container.querySelector('[data-slot="sidebar-inset"]')
    expect(inset).toBeInTheDocument()
    expect(inset?.tagName).toBe('DIV')
  })

  it('renders the header as a top-level <header> banner that is a SIBLING of <main>, not nested in it', () => {
    const { container } = render(<AppShell header="page-header">body</AppShell>)

    expect(container.querySelectorAll('header')).toHaveLength(1)
    expect(screen.getByText('page-header')).toBeInTheDocument()

    const html = container.innerHTML
    const headerAt = html.indexOf('<header')
    const headerCloseAt = html.indexOf('</header>')
    const mainAt = html.indexOf('<main')
    // header opens AND closes before main opens => sibling, not ancestor.
    expect(headerAt).toBeGreaterThanOrEqual(0)
    expect(headerCloseAt).toBeLessThan(mainAt)

    const main = container.querySelector('main')
    expect(main?.querySelector('header')).toBeNull()
  })

  it('names the banner with headerLabel, rendered as aria-label on the <header>', () => {
    const { container } = render(
      <AppShell header="page-header" headerLabel="Barra do console">
        body
      </AppShell>
    )

    const header = container.querySelector('header')
    expect(header).toHaveAttribute('aria-label', 'Barra do console')
    expect(screen.getByRole('banner', { name: 'Barra do console' })).toBe(
      header
    )
  })

  it('leaves the banner unnamed — NO aria-label attribute — when headerLabel is omitted', () => {
    const { container } = render(<AppShell header="page-header">body</AppShell>)

    const header = container.querySelector('header')
    expect(header).toBeInTheDocument()
    expect(header?.hasAttribute('aria-label')).toBe(false)
  })

  it('renders no <header> when no header prop is given', () => {
    const { container } = render(<AppShell>body</AppShell>)
    expect(container.querySelectorAll('header')).toHaveLength(0)
  })

  it('renders the skip link FIRST with skipToContentLabel, href === "#"+<main>.id', () => {
    const { container } = render(
      <AppShell skipToContentLabel="Pular para o conteúdo" header="page-header">
        body
      </AppShell>
    )

    const link = screen.getByRole('link', { name: 'Pular para o conteúdo' })
    const html = container.innerHTML
    expect(html.indexOf('<a')).toBeLessThan(html.indexOf('<header'))
    expect(html.indexOf('<a')).toBeLessThan(html.indexOf('<main'))

    const mainId = container.querySelector('main')?.id
    expect(mainId).toBeTruthy()
    expect(link).toHaveAttribute('href', `#${mainId}`)
  })

  it('renders NO skip link when skipToContentLabel is omitted', () => {
    const { container } = render(<AppShell header="page-header">body</AppShell>)
    expect(container.querySelectorAll('a')).toHaveLength(0)
    expect(count(container.innerHTML, '<a ')).toBe(0)
  })

  it('makes <main> skip-linkable + focus-targetable: it carries an id and tabIndex=-1', () => {
    const { container } = render(
      <AppShell skipToContentLabel="Skip to content">body</AppShell>
    )

    const main = container.querySelector('main')
    expect(main?.id).toBeTruthy()
    expect(main).toHaveAttribute('tabindex', '-1')
  })

  it('keeps children inside <main>, wrapped in the centered content container', () => {
    const { container } = render(
      <AppShell contentClassName="probe-content-class">inner-body</AppShell>
    )

    const main = container.querySelector('main')
    expect(main).toHaveTextContent('inner-body')
    const content = main?.firstElementChild
    expect(content).toHaveClass('probe-content-class')
    expect(content).toHaveClass('max-w-7xl')
  })

  it('forwards the ref to the content <main>', () => {
    const ref = createRef<HTMLElement>()
    const { container } = render(<AppShell ref={ref}>body</AppShell>)

    expect(ref.current).toBe(container.querySelector('main'))
  })

  it('renders the sidebar slot before the inset column and applies className to the shell row', () => {
    const { container } = render(
      <AppShell className="probe-shell-class" sidebar={<nav>rail</nav>}>
        body
      </AppShell>
    )

    expect(screen.getByText('rail')).toBeInTheDocument()
    const row = container.querySelector('.probe-shell-class')
    expect(row).toBeInTheDocument()
    expect(row?.firstElementChild?.tagName).toBe('NAV')
  })
})
