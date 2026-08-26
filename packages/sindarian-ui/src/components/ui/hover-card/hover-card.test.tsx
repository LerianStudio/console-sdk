import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '.'

describe('HoverCard', () => {
  it('keeps the content out of the tree while closed', () => {
    render(
      <HoverCard>
        <HoverCardTrigger>@lerian</HoverCardTrigger>
        <HoverCardContent>Lerian Studio</HoverCardContent>
      </HoverCard>
    )

    expect(screen.getByText('@lerian')).toBeInTheDocument()
    expect(screen.queryByText('Lerian Studio')).not.toBeInTheDocument()
  })

  it('renders the portalled content when open', () => {
    render(
      <HoverCard open>
        <HoverCardTrigger>@lerian</HoverCardTrigger>
        <HoverCardContent>Lerian Studio</HoverCardContent>
      </HoverCard>
    )

    expect(screen.getByText('Lerian Studio')).toBeInTheDocument()
    expect(
      document.querySelector('[data-slot="hover-card-content"]')
    ).not.toBeNull()
  })
})
