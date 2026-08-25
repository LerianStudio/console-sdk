import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '.'

function Basic() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="one">
        <AccordionTrigger>Section one</AccordionTrigger>
        <AccordionContent>Body one</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

describe('Accordion', () => {
  it('starts collapsed and expands the panel when the trigger is activated', () => {
    render(<Basic />)

    const trigger = screen.getByRole('button', { name: 'Section one' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Body one')).not.toBeInTheDocument()

    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Body one')).toBeInTheDocument()
  })

  it('marks its parts with data-slot attributes', () => {
    const { container } = render(<Basic />)

    expect(container.querySelector('[data-slot="accordion"]')).not.toBeNull()
    expect(
      container.querySelector('[data-slot="accordion-item"]')
    ).not.toBeNull()
    expect(
      container.querySelector('[data-slot="accordion-trigger"]')
    ).not.toBeNull()
  })
})
