import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

import { LedgerPanel, LedgerSheet } from '.'

describe('LedgerSheet', () => {
  it('builds a connected sheet: bg-border wrapper with 1px seams', () => {
    const { container } = render(
      <LedgerSheet>
        <LedgerPanel>cell</LedgerPanel>
      </LedgerSheet>
    )
    expect(container.firstElementChild).toHaveClass(
      'grid',
      'grid-cols-1',
      'gap-px',
      'bg-border'
    )
  })

  it('collapses to a single column on mobile and maps cols 1..4 on desktop', () => {
    for (const [cols, cls] of [
      [1, 'lg:grid-cols-1'],
      [2, 'lg:grid-cols-2'],
      [3, 'lg:grid-cols-3'],
      [4, 'lg:grid-cols-4']
    ] as const) {
      const { container } = render(
        <LedgerSheet cols={cols}>
          <LedgerPanel>cell</LedgerPanel>
        </LedgerSheet>
      )
      expect(container.firstElementChild).toHaveClass('grid-cols-1', cls)
    }
  })

  it('defaults to a single desktop column', () => {
    const { container } = render(
      <LedgerSheet>
        <LedgerPanel>cell</LedgerPanel>
      </LedgerSheet>
    )
    expect(container.firstElementChild).toHaveClass('lg:grid-cols-1')
  })
})

describe('LedgerPanel', () => {
  it('renders a flush section cell on bg-card, no border or shadow of its own', () => {
    const { container } = render(<LedgerPanel>cell</LedgerPanel>)
    const panel = container.firstElementChild
    expect(panel?.tagName).toBe('SECTION')
    expect(panel).toHaveClass('flex', 'h-full', 'flex-col', 'bg-card', 'p-5')
    expect(panel?.className).not.toMatch(/\bborder\b|\bshadow-/)
  })

  it('honours the `as` render element', () => {
    const { container } = render(<LedgerPanel as="div">cell</LedgerPanel>)
    expect(container.firstElementChild?.tagName).toBe('DIV')
  })
})
