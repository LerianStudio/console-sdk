import { render, screen } from '@testing-library/react'
import { StatCard, type StatCardTone } from '.'

const series = [{ value: 1 }, { value: 4 }, { value: 2 }, { value: 9 }]

describe('StatCard', () => {
  it('renders the label and the hero figure', () => {
    render(<StatCard label="Match rate" value="98.4%" />)

    expect(
      screen.getByRole('heading', { name: 'Match rate' })
    ).toBeInTheDocument()
    expect(screen.getByText('98.4%')).toBeInTheDocument()
  })

  it('renders the delta line only when supplied', () => {
    const { rerender } = render(<StatCard label="Rate" value="98%" />)
    expect(screen.queryByText('+0.6 pts')).toBeNull()

    rerender(<StatCard label="Rate" value="98%" delta="+0.6 pts" />)
    expect(screen.getByText('+0.6 pts')).toBeInTheDocument()
  })

  it.each([
    ['default', 'text-foreground'],
    ['success', 'text-system-success-text'],
    ['warning', 'text-system-alert-text'],
    ['destructive', 'text-destructive']
  ] as const)('escalates the %s tone onto its token', (tone, expected) => {
    render(
      <StatCard
        label="Rate"
        value="98%"
        tone={tone as StatCardTone}
        delta="-1"
      />
    )
    expect(screen.getByText('98%')).toHaveClass(expected)
    expect(screen.getByText('-1')).toHaveClass(expected)
  })

  it('renders the trend sparkline for a plottable series', () => {
    const { container } = render(
      <StatCard label="In flight" value="129" trend={series} />
    )
    const polyline = container.querySelector('polyline')
    expect(polyline).toBeInTheDocument()
    expect(polyline?.getAttribute('points')?.split(' ')).toHaveLength(4)
  })

  it('reads the trend from a custom trendKey', () => {
    const { container } = render(
      <StatCard
        label="In flight"
        value="129"
        trend={[{ v: 3 }, { v: 7 }]}
        trendKey="v"
      />
    )
    expect(container.querySelector('polyline')).toBeInTheDocument()
  })

  it('renders no trend for an empty or single-point series', () => {
    const { container, rerender } = render(
      <StatCard label="Flat" value="0" trend={[]} />
    )
    expect(container.querySelector('svg')).toBeNull()

    rerender(<StatCard label="Flat" value="0" trend={[{ value: 1 }]} />)
    expect(container.querySelector('svg')).toBeNull()
  })

  it('skips absent trend samples instead of plotting them as zero', () => {
    const { container } = render(
      <StatCard
        label="In flight"
        value="129"
        trend={[{ value: 10 }, { value: null }, { value: 20 }]}
      />
    )

    // Three samples, one absent -> two plotted points. Coercing null through
    // Number() would add a third point at 0 and draw a dip to the floor.
    const points = container
      .querySelector('polyline')
      ?.getAttribute('points')
      ?.split(' ')
    expect(points).toHaveLength(2)
    // The floor (y=40) belongs to the minimum real sample, not a phantom zero.
    expect(points?.[0]).toBe('0.00,40.00')
    expect(points?.[1]).toBe('100.00,0.00')
  })

  it('treats an empty-string sample as absent', () => {
    const { container } = render(
      <StatCard
        label="In flight"
        value="129"
        trend={[{ value: 10 }, { value: '' }, { value: 20 }]}
      />
    )
    expect(
      container.querySelector('polyline')?.getAttribute('points')?.split(' ')
    ).toHaveLength(2)
  })

  it('survives a flat series without dividing by zero', () => {
    const { container } = render(
      <StatCard label="Flat" value="5" trend={[{ value: 5 }, { value: 5 }]} />
    )
    expect(container.querySelector('polyline')?.getAttribute('points')).toBe(
      '0.00,20.00 100.00,20.00'
    )
  })

  it('renders the secondary key/value rows', () => {
    render(
      <StatCard
        label="Disputes"
        value="3"
        rows={[
          { label: 'Open', value: '3' },
          { label: 'Closed', value: '11' }
        ]}
      />
    )

    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('3', { selector: 'dd' })).toBeInTheDocument()
    expect(screen.getByText('Closed')).toBeInTheDocument()
    expect(screen.getByText('11')).toBeInTheDocument()
  })
})

/**
 * The delta line hand-rolled its own `font-mono` next to a hero `Figure` that
 * no longer carries one, which would have put the two numbers of the same card
 * on two different typefaces. Both now render on the console's Inter with
 * `tabular-nums` doing the alignment.
 */
describe('StatCard figure voice', () => {
  it('keeps the hero and the delta on the same typeface', () => {
    render(<StatCard label="Rate" value="98%" delta="+0.6 pts" />)

    for (const el of [screen.getByText('98%'), screen.getByText('+0.6 pts')]) {
      expect(el).not.toHaveClass('font-mono')
      expect(el).toHaveClass('tabular-nums')
    }
  })
})
