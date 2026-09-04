import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { FIGURE_CLASS, Figure } from '.'
import type { FigureSize } from '.'

const SIZES: FigureSize[] = [
  'hero',
  'money-hero',
  'panel',
  'count',
  'row',
  'tick'
]

describe('FIGURE_CLASS', () => {
  it('carries the tabular invariant on every size', () => {
    for (const size of SIZES) {
      expect(FIGURE_CLASS[size]).toContain('tabular-nums')
    }
  })

  it('pins the canonical class strings (call sites compose these inline)', () => {
    expect(FIGURE_CLASS).toEqual({
      hero: 'text-4xl font-semibold tracking-tight tabular-nums lg:text-5xl',
      'money-hero':
        'text-2xl font-semibold tracking-tight tabular-nums lg:text-3xl',
      panel: 'text-3xl font-semibold tracking-tight tabular-nums',
      count: 'text-2xl font-semibold tracking-tight tabular-nums',
      row: 'text-sm tabular-nums',
      tick: 'text-xs leading-none tabular-nums'
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

  it('sizes a money hero one step under `hero` so 13-char BRL clears a 3-col panel', () => {
    const { container } = render(
      <Figure size="money-hero">R$ 1.840.500,00</Figure>
    )
    expect(container.firstElementChild).toHaveClass('text-2xl', 'lg:text-3xl')
    expect(container.firstElementChild).not.toHaveClass('text-4xl')
  })

  it('applies the size class and merges an extra className', () => {
    const { container } = render(
      <Figure size="count" className="text-credit">
        12
      </Figure>
    )
    expect(container.firstElementChild).toHaveClass(
      'tabular-nums',
      'text-2xl',
      'text-credit'
    )
  })
})

/**
 * Every size was locked to `font-mono`, which put every number in the console
 * on a different typeface from the text around it, and `tick` carried an
 * arbitrary `text-[10px]` off the type ramp. Figures now render on the console's
 * own Inter with `tabular-nums` still doing the column-alignment work Inter
 * supports natively (`tnum`), and `tick` sits on the ramp at `text-xs`.
 */
describe('FIGURE_CLASS console voice', () => {
  it('locks no size to the mono typeface', () => {
    for (const size of SIZES) {
      expect(FIGURE_CLASS[size]).not.toContain('font-mono')
    }
  })

  it('keeps the tabular invariant that does the column alignment', () => {
    for (const size of SIZES) {
      expect(FIGURE_CLASS[size]).toContain('tabular-nums')
    }
  })

  it('sizes every step on the Tailwind type ramp, never an arbitrary pixel', () => {
    for (const size of SIZES) {
      expect(FIGURE_CLASS[size]).not.toMatch(/text-\[\d+px\]/)
    }
  })
})
