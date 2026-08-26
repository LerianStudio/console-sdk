import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { QRCode } from '.'

const SAMPLE =
  'otpauth://totp/Lerian:user@acme?secret=JBSWY3DPEHPK3PXP&issuer=Lerian'

describe('QRCode', () => {
  it('renders an svg when value is present', () => {
    const { container } = render(<QRCode value={SAMPLE} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('exposes the QR as an image to assistive tech', () => {
    render(<QRCode value={SAMPLE} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('renders nothing when value is an empty string', () => {
    const { container } = render(<QRCode value="" />)
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders nothing when value is whitespace only', () => {
    const { container } = render(<QRCode value="   " />)
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('applies the provided aria-label', () => {
    render(<QRCode value={SAMPLE} aria-label="Scan this QR code" />)
    expect(
      screen.getByRole('img', { name: 'Scan this QR code' })
    ).toBeInTheDocument()
  })

  it('falls back to a generic accessible name when aria-label is omitted', () => {
    render(<QRCode value={SAMPLE} />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAccessibleName()
    expect(svg.getAttribute('aria-label')).toBeTruthy()
  })

  it('applies the provided size to width and height', () => {
    const { container } = render(<QRCode value={SAMPLE} size={200} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '200')
    expect(svg).toHaveAttribute('height', '200')
  })

  it('defaults width and height to 160 when size is omitted', () => {
    const { container } = render(<QRCode value={SAMPLE} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '160')
    expect(svg).toHaveAttribute('height', '160')
  })

  it('embeds the center logo when logoSrc is provided', () => {
    const { container } = render(<QRCode value={SAMPLE} logoSrc="/logo.svg" />)
    const image = container.querySelector('image')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('href', '/logo.svg')
  })

  it('renders no embedded image when logoSrc is omitted', () => {
    const { container } = render(<QRCode value={SAMPLE} />)
    expect(container.querySelector('image')).not.toBeInTheDocument()
  })
})
