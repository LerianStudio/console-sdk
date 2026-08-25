import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { Dot, LivePulse, StatusRail } from '.'

describe('StatusRail', () => {
  it('renders the lead token in the foreground voice', () => {
    render(<StatusRail lead="SPI · produção" />)
    expect(screen.getByText('SPI · produção')).toHaveClass(
      'font-medium',
      'text-foreground'
    )
  })

  it('dot-separates tape items but never leads with a separator', () => {
    const { container } = render(
      <StatusRail items={[{ value: '90d' }, { value: '12:04 UTC' }]} />
    )
    // Two items, no lead → exactly one separator dot between them.
    expect(container.querySelectorAll('[aria-hidden]')).toHaveLength(1)
  })

  it('renders an item label inline before its value', () => {
    render(<StatusRail items={[{ label: 'Updated', value: '12:04 UTC' }]} />)
    expect(screen.getByText('Updated')).toHaveClass('uppercase')
    expect(screen.getByText('12:04 UTC')).toBeInTheDocument()
  })

  it('pins chips right and renders their label and value', () => {
    const { container } = render(
      <StatusRail chips={[{ label: 'Open', value: '12' }]} />
    )
    expect(container.querySelector('.ml-auto')).not.toBeNull()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('pairs an alarm chip with a non-color cue (WCAG 1.4.1)', () => {
    render(
      <StatusRail
        chips={[{ label: 'Pending overdue', value: '3', alarm: true }]}
      />
    )
    // The tint is reinforcement only; the sr-only marker carries the alarm.
    expect(screen.getByText('(alarme)')).toBeInTheDocument()
  })

  it('leaves a calm chip without the alarm marker', () => {
    render(<StatusRail chips={[{ label: 'Open', value: '12' }]} />)
    expect(screen.queryByText('(alarme)')).toBeNull()
  })
})

describe('Dot', () => {
  it('is decorative, hidden from assistive tech', () => {
    const { container } = render(<Dot />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden')
  })
})

describe('LivePulse', () => {
  it('gates the ping ring behind prefers-reduced-motion: no-preference', () => {
    const { container } = render(<LivePulse />)
    const ring = container.querySelector('.motion-safe\\:animate-ping')
    expect(ring).not.toBeNull()
  })

  it('keeps the static dot, which is never animated', () => {
    const { container } = render(<LivePulse />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden')
    expect(container.querySelectorAll('span')).toHaveLength(3)
  })
})
