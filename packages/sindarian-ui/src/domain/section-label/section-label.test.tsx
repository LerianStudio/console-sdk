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
})
