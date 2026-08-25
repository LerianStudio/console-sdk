import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import { Blotter, BlotterRow } from '.'

describe('Blotter', () => {
  it('renders a definition list with hairline dividers, no zebra fills', () => {
    const { container } = render(
      <Blotter>
        <BlotterRow label="Resolved on time" value="128" />
      </Blotter>
    )
    const dl = container.firstElementChild
    expect(dl?.tagName).toBe('DL')
    expect(dl).toHaveClass('divide-y', 'divide-border')
  })
})

describe('BlotterRow', () => {
  it('pairs a dt label with a dd value', () => {
    render(
      <Blotter>
        <BlotterRow label="Pending overdue" value="3" />
      </Blotter>
    )
    expect(screen.getByText('Pending overdue').tagName).toBe('DT')
    expect(screen.getByText('3').tagName).toBe('DD')
  })

  it('sets the inline value in mono tabular figures', () => {
    render(
      <Blotter>
        <BlotterRow label="Count" value="128" />
      </Blotter>
    )
    expect(screen.getByText('128')).toHaveClass('font-mono', 'tabular-nums')
  })

  it('escalates the value through valueClassName', () => {
    render(
      <Blotter>
        <BlotterRow label="Overdue" value="3" valueClassName="text-credit" />
      </Blotter>
    )
    expect(screen.getByText('3')).toHaveClass('text-credit')
  })

  it('renders long-form prose as wrapping body copy when stacked', () => {
    render(
      <Blotter>
        <BlotterRow
          stacked
          label="Motivo"
          value="Conta encerrada pelo titular"
        />
      </Blotter>
    )
    const value = screen.getByText('Conta encerrada pelo titular')
    expect(value).toHaveClass('whitespace-pre-wrap', 'break-words', 'text-sm')
    expect(value).not.toHaveClass('font-mono')
  })
})
