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

  it('carries no busy state by default', () => {
    const { container } = render(
      <Blotter>
        <BlotterRow label="Count" value="128" />
      </Blotter>
    )
    expect(container.querySelector('[aria-busy]')).toBeNull()
    expect(container.querySelector('[data-slot="skeleton"]')).toBeNull()
  })

  it('swaps the value for a skeleton and marks the row busy while loading', () => {
    // Consumers were hand-rolling dl lists to interleave Skeletons; the label is
    // known before the figure is, so it keeps rendering.
    const { container } = render(
      <Blotter>
        <BlotterRow loading label="Resolved on time" value="128" />
      </Blotter>
    )

    expect(screen.getByText('Resolved on time').tagName).toBe('DT')
    expect(screen.queryByText('128')).toBeNull()
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull()
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
  })

  it('sizes the loading skeleton to the stacked value slot', () => {
    const { container } = render(
      <Blotter>
        <BlotterRow stacked loading label="Motivo" value="Conta encerrada" />
      </Blotter>
    )

    expect(screen.getByText('Motivo').tagName).toBe('DT')
    expect(screen.queryByText('Conta encerrada')).toBeNull()
    expect(container.querySelector('[data-slot="skeleton"]')).toHaveClass(
      'w-full'
    )
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
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
