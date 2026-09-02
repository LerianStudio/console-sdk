import '@testing-library/jest-dom'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { render, screen } from '@testing-library/react'
import { EntityCard, EntityCardGridFooter } from '.'

/**
 * Raw Tailwind palette steps and the bare `white`/`black` surfaces are frozen
 * values: they have no dark counterpart, so anything painted with them stays
 * light while the theme around it flips. Scanning the SOURCE rather than a
 * render is deliberate — this file exports twelve components, several of them
 * behind props, and a palette class smuggled into a branch nothing renders here
 * would still ship to consumers.
 */
const source = readFileSync(resolve(__dirname, 'index.tsx'), 'utf8')
  // Comments are prose, not paint. The note explaining WHY this component stopped
  // using `bg-white` has to be free to name the class it stopped using.
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[^\n'"`]*\/\/.*$/gm, '')

const PALETTE =
  'zinc|slate|gray|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'

describe('EntityCard tokens', () => {
  it('paints no raw palette step', () => {
    expect(source).not.toMatch(
      new RegExp(`\\b[a-z-]+-(?:${PALETTE})-(?:50|[1-9]00|950)\\b`)
    )
  })

  it('paints no bare white or black surface', () => {
    expect(source).not.toMatch(/\b(?:bg|border|text|ring)-(?:white|black)\b/)
  })

  it('gives the grid footer the same themed surface as the cards above it', () => {
    render(
      <>
        <EntityCardGridFooter data-testid="footer" />
        <EntityCard data-testid="card" />
      </>
    )

    const footer = screen.getByTestId('footer')
    expect(footer).toHaveClass('bg-card', 'border-border')
    // The footer sits flush under the grid, so it has to read as the same
    // surface the cards do — not a separate, lighter slab.
    expect(screen.getByTestId('card')).toHaveClass('bg-card')
  })
})
