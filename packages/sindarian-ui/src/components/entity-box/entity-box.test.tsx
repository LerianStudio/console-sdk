import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  EntityBoxCollapsible,
  EntityBoxCollapsibleContent,
  EntityBoxCollapsibleTrigger,
  EntityBoxHeaderTitle
} from '.'

/**
 * EntityBoxHeaderTitle rendered its title as an `h1`. An EntityBox is always a
 * content box UNDER the page's own heading (`PageHeaderInfoTitle` renders the
 * page `h1`), so every console page carrying one shipped two or more `h1`s, and
 * consumers migrating from `SectionLabel` — which defaulted to `h2` — silently
 * lost their heading hierarchy. `as` selects the level; the default is `h2`.
 */
describe('EntityBoxHeaderTitle heading level', () => {
  it('renders the title as an h2 by default', () => {
    render(<EntityBoxHeaderTitle title="Ledgers" />)

    const heading = screen.getByRole('heading', { name: 'Ledgers' })
    expect(heading.tagName).toBe('H2')
  })

  it('never renders an h1 by default, so the page h1 stays unique', () => {
    const { container } = render(<EntityBoxHeaderTitle title="Ledgers" />)

    expect(container.querySelector('h1')).toBeNull()
  })

  it.each(['h1', 'h2', 'h3', 'h4'] as const)(
    'renders the title as %s when asked',
    (as) => {
      render(<EntityBoxHeaderTitle title="Ledgers" as={as} />)

      const heading = screen.getByRole('heading', { name: 'Ledgers' })
      expect(heading.tagName).toBe(as.toUpperCase())
    }
  )

  it('keeps the title styling on whichever element is chosen', () => {
    render(<EntityBoxHeaderTitle title="Ledgers" as="h3" />)

    expect(screen.getByRole('heading', { name: 'Ledgers' })).toHaveClass(
      'text-muted-foreground',
      'text-lg',
      'font-medium'
    )
  })
})

/**
 * The subtitle was painted `text-shadcn-400` (#A1A1AA), which reads 2.56:1 on
 * the white `--card` surface an EntityBox sits on — under the 4.5:1 WCAG AA
 * floor for body text, so downstream axe gates failed on it. `--muted-foreground`
 * is the library's own muted-text token: 7.73:1 in light, and identical to the
 * old value in dark, so nothing regresses.
 */
describe('EntityBoxHeaderTitle subtitle contrast', () => {
  it('paints the subtitle with the muted-foreground token', () => {
    render(
      <EntityBoxHeaderTitle title="Ledgers" subtitle="Manage the ledgers." />
    )

    expect(screen.getByText('Manage the ledgers.')).toHaveClass(
      'text-muted-foreground',
      'text-sm'
    )
  })

  it('no longer paints the subtitle with the sub-AA shadcn-400 grey', () => {
    render(
      <EntityBoxHeaderTitle title="Ledgers" subtitle="Manage the ledgers." />
    )

    expect(screen.getByText('Manage the ledgers.')).not.toHaveClass(
      'text-shadcn-400'
    )
  })
})

/**
 * The collapsible trigger is icon-only: a `Settings2` glyph inside a Button,
 * with no text node anywhere under it. It shipped with no accessible name at
 * all, so a screen reader announced "button" and nothing else — SC 4.1.2 — and
 * every console filter panel is opened by one of these. The console passes no
 * label at any of its ten call sites, so the name has to come from the kit.
 *
 * The name says what activating it DOES, and Radix's `aria-expanded` says what
 * state it is in, so the pair reads "Collapse, expanded" rather than leaving
 * either half to be inferred.
 */
describe('EntityBoxCollapsibleTrigger accessible name', () => {
  it('names itself in English with no props', () => {
    render(
      <EntityBoxCollapsible>
        <EntityBoxCollapsibleTrigger />
      </EntityBoxCollapsible>
    )

    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument()
  })

  it('names the action for the state it is in', () => {
    render(
      <EntityBoxCollapsible defaultOpen>
        <EntityBoxCollapsibleTrigger />
      </EntityBoxCollapsible>
    )

    expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument()
  })

  it('takes translated labels for both states', async () => {
    render(
      <EntityBoxCollapsible>
        <EntityBoxCollapsibleTrigger
          expandLabel="Abrir filtros"
          collapseLabel="Fechar filtros"
        />
      </EntityBoxCollapsible>
    )

    const trigger = screen.getByRole('button', { name: 'Abrir filtros' })
    await userEvent.click(trigger)

    expect(
      screen.getByRole('button', { name: 'Fechar filtros' })
    ).toBeInTheDocument()
  })

  it('lets an explicit aria-label win over both', () => {
    render(
      <EntityBoxCollapsible>
        <EntityBoxCollapsibleTrigger aria-label="Filters" />
      </EntityBoxCollapsible>
    )

    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument()
  })

  it('keeps reporting its state through aria-expanded', async () => {
    render(
      <EntityBoxCollapsible>
        <EntityBoxCollapsibleTrigger />
        <EntityBoxCollapsibleContent>filters</EntityBoxCollapsibleContent>
      </EntityBoxCollapsible>
    )

    const trigger = screen.getByRole('button')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps passing arbitrary props through to the trigger', () => {
    render(
      <EntityBoxCollapsible>
        <EntityBoxCollapsibleTrigger data-testid="filters-trigger" />
      </EntityBoxCollapsible>
    )

    expect(screen.getByTestId('filters-trigger')).toBeInTheDocument()
  })

  it('tracks a controlled open state', () => {
    render(
      <EntityBoxCollapsible open onOpenChange={() => {}}>
        <EntityBoxCollapsibleTrigger />
      </EntityBoxCollapsible>
    )

    expect(screen.getByRole('button', { name: 'Collapse' })).toBeInTheDocument()
  })
})
