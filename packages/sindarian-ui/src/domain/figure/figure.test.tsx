import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { FIGURE_CLASS, Figure } from '.'
import type { FigureSize } from '.'

const SIZES: FigureSize[] = ['hero', 'panel', 'count', 'row', 'tick']

describe('FIGURE_CLASS', () => {
  it('carries the mono + tabular invariants on every size', () => {
    for (const size of SIZES) {
      expect(FIGURE_CLASS[size]).toContain('font-mono')
      expect(FIGURE_CLASS[size]).toContain('tabular-nums')
    }
  })

  it('pins the canonical class strings (call sites compose these inline)', () => {
    expect(FIGURE_CLASS).toEqual({
      hero: 'font-mono text-4xl font-semibold tracking-tight tabular-nums lg:text-5xl',
      panel: 'font-mono text-3xl font-semibold tracking-tight tabular-nums',
      count: 'font-mono text-2xl font-semibold tracking-tight tabular-nums',
      row: 'font-mono text-sm tabular-nums',
      tick: 'font-mono text-[10px] leading-none tabular-nums'
    })
  })
})

describe('Figure', () => {
  it('renders a span by default', () => {
    const { container } = render(<Figure size="row">1.234</Figure>)
    expect(container.firstElementChild?.tagName).toBe('SPAN')
    expect(screen.getByText('1.234')).toBeInTheDocument()
  })

  it('honours the `as` render element', () => {
    const { container } = render(
      <Figure size="hero" as="dd">
        99
      </Figure>
    )
    expect(container.firstElementChild?.tagName).toBe('DD')
  })

  it('applies the size class and merges an extra className', () => {
    const { container } = render(
      <Figure size="count" className="text-credit">
        12
      </Figure>
    )
    expect(container.firstElementChild).toHaveClass(
      'font-mono',
      'text-2xl',
      'text-credit'
    )
  })
})
