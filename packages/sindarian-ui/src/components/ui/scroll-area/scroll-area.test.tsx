import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ScrollArea, ScrollBar } from '.'

// Radix measures the viewport with ResizeObserver, which jsdom does not ship.
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
})

describe('ScrollArea', () => {
  it('renders its children inside the scrollable viewport', () => {
    const { container } = render(
      <ScrollArea className="h-20">
        <p>Ledger line</p>
      </ScrollArea>
    )

    const viewport = container.querySelector(
      '[data-slot="scroll-area-viewport"]'
    )
    expect(viewport).not.toBeNull()
    expect(screen.getByText('Ledger line')).toBeInTheDocument()
    expect(viewport).toContainElement(screen.getByText('Ledger line'))
  })

  it('exposes ScrollBar so a horizontal bar can be added to the area', () => {
    const { container } = render(
      <ScrollArea type="always">
        <p>Ledger line</p>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    )

    const bar = container.querySelector(
      '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'
    )
    expect(bar).not.toBeNull()
  })
})
