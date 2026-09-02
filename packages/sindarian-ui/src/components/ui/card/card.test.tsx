import { render } from '@testing-library/react'
import { CardDescription, CardTitle } from '.'

/** Today's rendered class string. Frozen: `as` must not change it. */
const TITLE_CLASSES = 'text-sm leading-none font-medium tracking-tight'

describe('CardTitle — heading level', () => {
  it('renders an <h3> with data-slot="card-title" and the frozen classes when `as` is omitted', () => {
    const { container } = render(<CardTitle>title</CardTitle>)

    const el = container.firstElementChild
    expect(el?.tagName).toBe('H3')
    expect(el).toHaveAttribute('data-slot', 'card-title')
    expect(el?.getAttribute('class')).toBe(TITLE_CLASSES)
    expect(el).toHaveTextContent('title')
  })

  it('renders the requested heading level with an identical slot and class output', () => {
    const { container } = render(<CardTitle as="h2">title</CardTitle>)

    const el = container.firstElementChild
    expect(el?.tagName).toBe('H2')
    expect(el).toHaveAttribute('data-slot', 'card-title')
    expect(el?.getAttribute('class')).toBe(TITLE_CLASSES)
  })

  it('accepts every heading level h1-h6', () => {
    for (const level of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const) {
      const { container } = render(<CardTitle as={level}>title</CardTitle>)
      expect(container.firstElementChild?.tagName).toBe(level.toUpperCase())
    }
  })

  it('still merges a consumer className onto the heading', () => {
    const { container } = render(
      <CardTitle className="probe-title-class">title</CardTitle>
    )
    expect(container.firstElementChild).toHaveClass('probe-title-class')
  })
})

describe('CardDescription', () => {
  it('renders a <p>, which is what its prop type now claims', () => {
    const { container } = render(<CardDescription>desc</CardDescription>)

    const el = container.firstElementChild
    expect(el?.tagName).toBe('P')
    expect(el).toHaveAttribute('data-slot', 'card-description')
    expect(el?.getAttribute('class')).toBe('text-muted-foreground text-sm')
  })
})
