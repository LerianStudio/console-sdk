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

describe('ChartStyle injection hardening', () => {
  const BREAKOUT = 'red}</style><img src=x onerror=alert(1)>'

  function expectNoBreakout(container: HTMLElement) {
    // The <style> element must never be closed early, and no markup smuggled
    // through it may materialize as real DOM.
    const css = container.querySelector('style')?.innerHTML ?? ''
    expect(css).not.toContain('</style')
    expect(css).not.toContain('<img')
    expect(container.querySelector('img')).toBeNull()
    expect(document.querySelector('img')).toBeNull()
  }

  it('drops a color value carrying markup instead of emitting it', () => {
    const { container } = render(
      <ChartContainer config={{ evil: { label: 'Evil', color: BREAKOUT } }}>
        <div />
      </ChartContainer>
    )

    expectNoBreakout(container)
    expect(container.querySelector('style')?.innerHTML ?? '').not.toContain(
      '--color-evil'
    )
  })

  it('drops a themed color value carrying markup', () => {
    const { container } = render(
      <ChartContainer
        config={{
          mixed: {
            label: 'Mixed',
            theme: { light: 'var(--color-chart-1)', dark: BREAKOUT }
          }
        }}
      >
        <div />
      </ChartContainer>
    )

    expectNoBreakout(container)
    const css = container.querySelector('style')!.innerHTML
    // The safe half still lands; only the poisoned one is dropped.
    expect(css).toContain('--color-mixed: var(--color-chart-1);')
    expect(css.match(/--color-mixed/g)).toHaveLength(1)
  })

  it('drops a config key that is not a CSS identifier', () => {
    const { container } = render(
      <ChartContainer
        config={{
          'evil}</style><img src=x onerror=alert(1)>': { color: 'red' }
        }}
      >
        <div />
      </ChartContainer>
    )

    expectNoBreakout(container)
  })

  it('strips CSS syntax out of a caller-supplied id', () => {
    const { container } = render(
      <ChartContainer
        id={'x]{}</style><img src=x onerror=alert(1)>'}
        config={{ settled: { color: 'var(--color-chart-1)' } }}
      >
        <div />
      </ChartContainer>
    )

    expectNoBreakout(container)
    // Selector and attribute must still agree after stripping, or colors break.
    const chartId = container
      .querySelector('[data-chart]')!
      .getAttribute('data-chart')!
    expect(chartId).toMatch(/^chart-[\w-]*$/)
    expect(container.querySelector('style')!.innerHTML).toContain(
      `[data-chart=${chartId}] {`
    )
  })

  it('rejects other CSS-breaking color syntax', () => {
    const hostile = [
      'red;color:blue',
      'red}@import url(//evil.test)',
      'expression(alert(1))"',
      "url('x')",
      'red !important',
      // Passes the character allowlist on its own — no colon, no quotes — but
      // the browser would fetch it, leaking IP and referrer to a third party.
      'url(//evil.test/pixel.png)',
      'URL(//evil.test/pixel.png)',
      'url (//evil.test/pixel.png)',
      'image-set(url(//evil.test/x) 1x)'
    ]

    hostile.forEach((color) => {
      const { container, unmount } = render(
        <ChartContainer config={{ probe: { color } }}>
          <div />
        </ChartContainer>
      )
      const css = container.querySelector('style')?.innerHTML ?? ''
      expect(css).not.toContain('--color-probe')
      unmount()
    })
  })

  it('admits a numeric series key, which is a valid custom-property name', () => {
    // A year-keyed series ("2024") must resolve, or every var(--color-2024)
    // reference in the chart silently falls back to nothing.
    const { container } = render(
      <ChartContainer
        config={{
          '2024': { label: '2024', color: 'var(--color-chart-1)' },
          '2025': { label: '2025', color: 'var(--color-chart-2)' }
        }}
      >
        <div />
      </ChartContainer>
    )

    const css = container.querySelector('style')!.innerHTML
    expect(css).toContain('--color-2024: var(--color-chart-1);')
    expect(css).toContain('--color-2025: var(--color-chart-2);')
  })

  it('still admits the color forms real charts use', () => {
    const allowed: Record<string, string> = {
      token: 'var(--color-chart-1)',
      hex: '#B91C1C',
      named: 'rebeccapurple',
      modern: 'hsl(0 74% 42%)',
      legacy: 'rgb(185, 28, 28)',
      alpha: 'hsl(var(--color-chart-1) / 0.5)',
      fallback: 'var(--color-chart-1, #B91C1C)'
    }

    const { container } = render(
      <ChartContainer
        config={Object.fromEntries(
          Object.entries(allowed).map(([key, color]) => [key, { color }])
        )}
      >
        <div />
      </ChartContainer>
    )

    const css = container.querySelector('style')!.innerHTML
    Object.entries(allowed).forEach(([key, color]) => {
      expect(css).toContain(`--color-${key}: ${color};`)
    })
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
