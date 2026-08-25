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

  it('accepts a custom lucide icon', () => {
    const { container } = render(
      <EmptyState title="Custom icon" icon={FileSearch} />
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})
