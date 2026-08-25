import { fireEvent, render, screen } from '@testing-library/react'
import { DetailPanel } from '.'

describe('DetailPanel', () => {
  it('renders nothing while closed', () => {
    render(
      <DetailPanel open={false} onOpenChange={jest.fn()} title="Transaction">
        body
      </DetailPanel>
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('names the dialog with the title and renders the body', () => {
    render(
      <DetailPanel open onOpenChange={jest.fn()} title="Transaction txn_8f2a">
        <p>ledger body</p>
      </DetailPanel>
    )

    expect(
      screen.getByRole('dialog', { name: 'Transaction txn_8f2a' })
    ).toBeInTheDocument()
    expect(screen.getByText('ledger body')).toBeInTheDocument()
  })

  it('labels its own header close control', () => {
    render(
      <DetailPanel
        open
        onOpenChange={jest.fn()}
        title="Panel"
        closeLabel="Fechar"
      >
        body
      </DetailPanel>
    )

    expect(screen.getByRole('button', { name: 'Fechar' })).toHaveAttribute(
      'data-slot',
      'detail-panel-close'
    )
    // Sheet contributes its own corner close, hidden by CSS in the browser
    // ([&>button.absolute]:hidden) but still present in the jsdom tree.
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('reports dismissal through onOpenChange', () => {
    const onOpenChange = jest.fn()
    render(
      <DetailPanel open onOpenChange={onOpenChange} title="Panel">
        body
      </DetailPanel>
    )

    fireEvent.click(
      document.querySelector('[data-slot="detail-panel-close"]') as HTMLElement
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders the actions and footer slots only when supplied', () => {
    const { rerender } = render(
      <DetailPanel open onOpenChange={jest.fn()} title="Panel">
        body
      </DetailPanel>
    )
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull()

    rerender(
      <DetailPanel
        open
        onOpenChange={jest.fn()}
        title="Panel"
        actions={<button>Retry</button>}
        footer={<button>Save</button>}
      >
        body
      </DetailPanel>
    )
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })
})
