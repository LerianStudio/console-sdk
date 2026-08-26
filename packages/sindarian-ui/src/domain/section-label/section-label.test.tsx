import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

import { SECTION_LABEL_CLASS } from '@/lib/typography'

import { SectionLabel } from '.'

describe('SectionLabel', () => {
  it('renders an h2 by default (the ledger-sheet cell heading)', () => {
    const { container } = render(<SectionLabel>Posição</SectionLabel>)
    expect(container.firstElementChild?.tagName).toBe('H2')
  })

  it('honours the `as` render element for captions and inline labels', () => {
    const { container } = render(<SectionLabel as="span">Posição</SectionLabel>)
    expect(container.firstElementChild?.tagName).toBe('SPAN')
  })

  it('uses the shared label voice rather than re-stating it', () => {
    const { container } = render(<SectionLabel>Posição</SectionLabel>)
    for (const cls of SECTION_LABEL_CLASS.split(' ')) {
      expect(container.firstElementChild).toHaveClass(cls)
    }
  })

  it('merges an extra className', () => {
    const { container } = render(
      <SectionLabel className="mb-2">Posição</SectionLabel>
    )
    expect(container.firstElementChild).toHaveClass('mb-2')
  })

  it('forwards id, aria-* and data-* onto the rendered tag', () => {
    // Without the spread there was no way to reference the heading from its own
    // container — a panel could not point `aria-labelledby` at it, and a test
    // could not hang a hook off it.
    const { container } = render(
      <SectionLabel
        id="posicao-heading"
        aria-describedby="posicao-note"
        data-testid="posicao"
      >
        Posição
      </SectionLabel>
    )
    const heading = container.firstElementChild

    expect(heading).toHaveAttribute('id', 'posicao-heading')
    expect(heading).toHaveAttribute('aria-describedby', 'posicao-note')
    expect(heading).toHaveAttribute('data-testid', 'posicao')
    // The forwarded props must not cost the shared voice.
    expect(heading).toHaveClass(SECTION_LABEL_CLASS.split(' ')[0])
  })

  it('forwards onto the `as` element too', () => {
    const { container } = render(
      <SectionLabel as="dt" id="rate-term">
        Inadimplência
      </SectionLabel>
    )
    expect(container.firstElementChild?.tagName).toBe('DT')
    expect(container.firstElementChild).toHaveAttribute('id', 'rate-term')
  })
})
