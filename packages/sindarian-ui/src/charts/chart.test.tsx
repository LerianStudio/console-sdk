import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import type { TooltipPayloadEntry } from 'recharts'

import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
  type ChartConfig
} from './chart'

const config: ChartConfig = {
  settled: { label: 'Settled', color: 'var(--color-chart-1)' },
  returned: { label: 'Returned', color: 'var(--color-chart-2)' },
  pending: {
    label: 'Pending',
    theme: { light: 'var(--color-chart-3)', dark: 'var(--color-chart-4)' }
  },
  unpainted: { label: 'No color' }
}

/**
 * ChartContainer feeds its child through Recharts' ResponsiveContainer, which
 * clones it with measured dimensions. A plain element is enough to put the
 * subject inside the chart context without simulating layout or hover.
 */
function renderInChart(
  children: React.ReactElement,
  ariaLabel?: string | false
) {
  return render(
    <ChartContainer config={config} ariaLabel={ariaLabel}>
      <div>{children}</div>
    </ChartContainer>
  )
}

describe('ChartContainer', () => {
  it('injects one --color-<key> custom property per series, per theme', () => {
    const { container } = renderInChart(<div />)

    const style = container.querySelector('style')
    expect(style).not.toBeNull()
    const css = style!.innerHTML

    // Light scope carries the flat colors and the light half of themed entries.
    expect(css).toContain('--color-settled: var(--color-chart-1);')
    expect(css).toContain('--color-returned: var(--color-chart-2);')
    expect(css).toContain('--color-pending: var(--color-chart-3);')
    // Dark scope overrides only what the theme map defines.
    expect(css).toContain('.dark [data-chart=')
    expect(css).toContain('--color-pending: var(--color-chart-4);')
    // A series with neither color nor theme contributes no variable.
    expect(css).not.toContain('--color-unpainted')
  })

  it('scopes the injected variables to this chart instance', () => {
    const { container } = renderInChart(<div />)

    const chart = container.querySelector('[data-chart]')
    const chartId = chart!.getAttribute('data-chart')

    expect(chartId).toMatch(/^chart-/)
    expect(container.querySelector('style')!.innerHTML).toContain(
      `[data-chart=${chartId}]`
    )
  })

  it('emits no style element when no series defines a color', () => {
    const { container } = render(
      <ChartContainer config={{ bare: { label: 'Bare' } }}>
        <div />
      </ChartContainer>
    )

    expect(container.querySelector('style')).toBeNull()
  })

  it('exposes a named chart as an image', () => {
    renderInChart(<div />, 'Settlement volume by day')

    expect(
      screen.getByRole('img', { name: 'Settlement volume by day' })
    ).toBeInTheDocument()
  })

  it('hides a decorative chart from the accessibility tree', () => {
    const { container } = renderInChart(<div />, false)

    expect(container.querySelector('[data-slot="chart"]')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
  })

  it('applies no accessibility attributes without an ariaLabel', () => {
    const { container } = renderInChart(<div />)
    const chart = container.querySelector('[data-slot="chart"]')

    expect(chart).not.toHaveAttribute('role')
    expect(chart).not.toHaveAttribute('aria-hidden')
  })
})

describe('useChart', () => {
  it('throws when chart parts are used outside a ChartContainer', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    expect(() => render(<ChartLegendContent payload={[]} />)).toThrow(
      'useChart must be used within a <ChartContainer />'
    )

    consoleError.mockRestore()
  })
})

describe('ChartTooltipContent', () => {
  const payload: TooltipPayloadEntry[] = [
    {
      dataKey: 'settled',
      name: 'settled',
      value: 1234,
      color: 'var(--color-settled)',
      payload: { settled: 1234 },
      graphicalItemId: 'bar-settled'
    }
  ]

  it('renders the config label and the formatted value', () => {
    renderInChart(<ChartTooltipContent active payload={payload} />)

    // A single-series payload with no explicit label renders the config label
    // twice: once as the tooltip heading, once as the series name.
    expect(screen.getAllByText('Settled')).toHaveLength(2)
    expect(screen.getByText('1,234')).toBeInTheDocument()
  })

  it('renders nothing while inactive', () => {
    renderInChart(<ChartTooltipContent active={false} payload={payload} />)

    expect(screen.queryByText('Settled')).not.toBeInTheDocument()
  })

  it('renders nothing with an empty payload', () => {
    renderInChart(<ChartTooltipContent active payload={[]} />)

    expect(screen.queryByText('Settled')).not.toBeInTheDocument()
  })

  it('resolves the group label through the config', () => {
    renderInChart(
      <ChartTooltipContent active payload={payload} label="returned" />
    )

    expect(screen.getByText('Returned')).toBeInTheDocument()
  })
})

describe('ChartLegendContent', () => {
  const payload = [
    { dataKey: 'settled', value: 'settled', color: 'var(--color-settled)' },
    { dataKey: 'returned', value: 'returned', color: 'var(--color-returned)' }
  ]

  it('renders one entry per series, labelled from the config', () => {
    renderInChart(<ChartLegendContent payload={payload} />)

    expect(screen.getByText('Settled')).toBeInTheDocument()
    expect(screen.getByText('Returned')).toBeInTheDocument()
  })

  it('renders nothing with an empty payload', () => {
    renderInChart(<ChartLegendContent payload={[]} />)

    expect(screen.queryByText('Settled')).not.toBeInTheDocument()
    expect(screen.queryByText('Returned')).not.toBeInTheDocument()
  })
})
