import { render, screen } from '@testing-library/react'
import { AlertBanner, type AlertBannerTone } from '.'

describe('AlertBanner', () => {
  it('renders as an alert with title, body and mono detail', () => {
    render(
      <AlertBanner title="Import failed" detail="ERR_PARSE_0042">
        The file could not be parsed.
      </AlertBanner>
    )

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(screen.getByText('Import failed')).toBeInTheDocument()
    expect(
      screen.getByText('The file could not be parsed.')
    ).toBeInTheDocument()
    expect(screen.getByText('ERR_PARSE_0042')).toBeInTheDocument()
  })

  it('defaults to the neutral tone', () => {
    render(<AlertBanner title="Heads up" />)
    expect(screen.getByRole('alert')).toHaveAttribute('data-tone', 'neutral')
  })

  it.each([
    ['destructive', 'border-system-error-border', 'text-system-error-text'],
    ['warning', 'border-system-alert-border', 'text-system-alert-text'],
    ['info', 'border-system-info-border', 'text-system-info-text'],
    ['success', 'border-system-success-border', 'text-system-success-text'],
    ['neutral', 'border-border', 'text-foreground']
  ] as const)(
    'maps the %s tone onto its sindarian-ui token family',
    (tone, containerClass, titleClass) => {
      render(<AlertBanner tone={tone as AlertBannerTone} title="Tone" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass(containerClass)
      expect(screen.getByText('Tone')).toHaveClass(titleClass)
    }
  )

  it('renders the icon slot only when an icon is supplied', () => {
    const { rerender } = render(<AlertBanner title="No icon" />)
    expect(screen.getByRole('alert').querySelector('span')).toBeNull()

    rerender(
      <AlertBanner title="With icon" icon={<svg data-testid="glyph" />} />
    )
    expect(screen.getByTestId('glyph')).toBeInTheDocument()
  })

  it('renders a numeric 0 in every content slot', () => {
    // 0 is legitimate content — a truthiness check would silently drop it.
    render(
      <AlertBanner title={0} detail={0}>
        {0}
      </AlertBanner>
    )

    const alert = screen.getByRole('alert')
    expect(alert.querySelector('p')).toHaveTextContent('0')
    expect(alert.querySelector('pre')).toHaveTextContent('0')
    expect(alert).toHaveTextContent('000')
  })

  it('omits slots that are genuinely absent', () => {
    render(<AlertBanner />)
    const alert = screen.getByRole('alert')
    expect(alert.querySelector('p')).toBeNull()
    expect(alert.querySelector('pre')).toBeNull()
  })

  it('forwards className to the container', () => {
    render(<AlertBanner title="Custom" className="probe-class" />)
    expect(screen.getByRole('alert')).toHaveClass('probe-class')
  })
})
