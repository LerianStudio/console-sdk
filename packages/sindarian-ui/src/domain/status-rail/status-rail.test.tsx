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

  // The lead span and the first item's separator used to ask the same question
  // two different ways: `lead !== undefined && lead !== null` for the span,
  // `lead != null` for the dot. They agree on null/undefined and diverge on a
  // ReactNode that RENDERS nothing — so a lead of `false` or `''` produced an
  // empty span AND a leading dot, opening the rail with a stray `·`.
  it.each([
    ['false', false],
    // React renders `true` as nothing too — it is exactly as empty as `false`.
    ['true', true],
    ['empty string', ''],
    ['null', null],
    ['undefined', undefined]
  ])('never leads with a separator for a lead of %s', (_kind, lead) => {
    const { container } = render(
      <StatusRail lead={lead} items={[{ value: '90d' }, { value: '12:04' }]} />
    )
    // Two items, nothing rendered as a lead → exactly one separator, between
    // the items and never before the first one.
    expect(container.querySelectorAll('[aria-hidden]')).toHaveLength(1)
    expect(container.textContent?.trimStart().startsWith('·')).toBe(false)
  })

  it('still leads with a separator when there IS a lead', () => {
    const { container } = render(
      <StatusRail lead="SPI" items={[{ value: '90d' }, { value: '12:04' }]} />
    )
    // Lead + two items → a dot before each item.
    expect(container.querySelectorAll('[aria-hidden]')).toHaveLength(2)
  })

  it('renders an item label inline before its value', () => {
    render(<StatusRail items={[{ label: 'Updated', value: '12:04 UTC' }]} />)
    expect(screen.getByText('Updated')).toHaveClass('font-medium')
    expect(screen.getByText('12:04 UTC')).toBeInTheDocument()
  })

  it('pins chips right and renders their label and value', () => {
    const { container } = render(
      <StatusRail chips={[{ label: 'Open', value: '12' }]} />
    )
    expect(container.querySelector('.ml-auto')).not.toBeNull()
    expect(screen.getByText('Open')).toHaveClass('font-medium')
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  /**
   * The rail hard-coded the retired Ledger register (`uppercase
   * tracking-[0.08em]`) on both label spans, bypassing LABEL_VOICE_CLASS
   * entirely — so after the kit moved to product-console's sentence-case voice
   * these two were the only labels left shouting. The rail root already owns
   * size, family and ink (`font-mono text-xs text-muted-foreground`), so the
   * label carries just the constant's weight, not its size.
   */
  it.each(['item', 'chip'] as const)('speaks no retired %s voice', (kind) => {
    render(
      <StatusRail
        items={kind === 'item' ? [{ label: 'Updated', value: '12:04' }] : []}
        chips={kind === 'chip' ? [{ label: 'Updated', value: '12' }] : []}
      />
    )

    // One class per assertion: a multi-argument `not.toHaveClass` passes when
    // ANY one of the names is missing, so a single call would go green with
    // one of the two retired tokens still on the label.
    const label = screen.getByText('Updated')
    expect(label).not.toHaveClass('uppercase')
    expect(label).not.toHaveClass('tracking-[0.08em]')
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
