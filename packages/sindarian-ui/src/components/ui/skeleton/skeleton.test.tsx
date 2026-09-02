import React from 'react'
import { render, screen } from '@testing-library/react'

import { Skeleton } from './index'

describe('a skeleton', () => {
  it('renders a placeholder carrying its data-slot', () => {
    const { container } = render(<Skeleton />)

    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull()
  })

  it('guards its pulse behind prefers-reduced-motion', () => {
    // ⛔ A BARE `animate-pulse` RUNS FOREVER, on every loading surface in the
    // console at once, for a reader who asked the OS to stop motion. The
    // placeholder must still be VISIBLE under reduced motion — only the pulse
    // is dropped — so the background class stays unguarded.
    const { container } = render(<Skeleton />)
    const skeleton = container.querySelector(
      '[data-slot="skeleton"]'
    ) as HTMLElement

    expect(skeleton).toHaveClass('motion-safe:animate-pulse')
    expect(skeleton).not.toHaveClass('animate-pulse')
    expect(skeleton).toHaveClass('bg-muted')
  })

  it('keeps the caller className alongside its own', () => {
    render(<Skeleton className="h-4 w-32" data-testid="subject" />)
    const skeleton = screen.getByTestId('subject')

    expect(skeleton).toHaveClass('h-4', 'w-32', 'motion-safe:animate-pulse')
  })
})
