import { render, screen } from '@testing-library/react'
import { FileSearch } from 'lucide-react'
import { EmptyState } from '.'

describe('EmptyState', () => {
  it('renders the centered card by default', () => {
    const { container } = render(
      <EmptyState title="Nothing here yet" description="Create one first" />
    )

    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
    expect(screen.getByText('Create one first')).toBeInTheDocument()
    expect(container.querySelector('[data-variant="ruled"]')).toBeNull()
    expect(container.firstElementChild).toHaveClass('items-center')
  })

  it('renders the ruled-page notation when ruled is set', () => {
    const { container } = render(<EmptyState title="No rows" ruled />)

    const root = container.querySelector('[data-variant="ruled"]')
    expect(root).toBeInTheDocument()
    expect(root).toHaveClass('items-start')
    expect(screen.getByText('No rows')).toBeInTheDocument()
  })

  it('omits the description and action nodes when not supplied', () => {
    render(<EmptyState title="Bare" />)
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('Bare')).toBeInTheDocument()
  })

  it('renders the action slot in both presentations', () => {
    const { rerender } = render(
      <EmptyState title="With action" action={<button>Create</button>} />
    )
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()

    rerender(
      <EmptyState title="With action" ruled action={<button>Create</button>} />
    )
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument()
  })

  it('keeps the title out of the heading outline by default', () => {
    render(<EmptyState title="Nothing here yet" />)

    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('renders the title as a heading at the chosen level in both presentations', () => {
    const { rerender } = render(
      <EmptyState title="Nothing here yet" titleAs="h2" />
    )
    expect(
      screen.getByRole('heading', { level: 2, name: 'Nothing here yet' })
    ).toBeInTheDocument()

    rerender(<EmptyState title="No rows" ruled titleAs="h3" />)
    expect(
      screen.getByRole('heading', { level: 3, name: 'No rows' })
    ).toBeInTheDocument()
  })

  it('accepts a custom lucide icon', () => {
    const { container } = render(
      <EmptyState title="Custom icon" icon={FileSearch} />
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
