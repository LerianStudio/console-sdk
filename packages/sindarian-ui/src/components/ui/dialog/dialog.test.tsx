import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { Dialog, DialogContent, DialogTitle } from '.'

/**
 * A toast renders outside the dialog's DOM, so Radix reads a press on its
 * close button as an outside interaction and dismisses the dialog under it.
 */
function renderOpenDialog(onInteractOutside?: jest.Mock) {
  const onOpenChange = jest.fn()
  render(
    <>
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent
          aria-describedby={undefined}
          onInteractOutside={onInteractOutside}
        >
          <DialogTitle>Edit</DialogTitle>
        </DialogContent>
      </Dialog>
      <ol data-sonner-toaster="">
        <li>
          <button>Close toast</button>
        </li>
      </ol>
      <button>Elsewhere</button>
    </>
  )
  return onOpenChange
}

// Radix attaches its outside-pointer listener on the next tick.
const outsideListenerReady = () =>
  act(() => new Promise((resolve) => setTimeout(resolve, 0)))

describe('DialogContent outside interaction', () => {
  it('stays open when a toast is pressed', async () => {
    const onInteractOutside = jest.fn()
    const onOpenChange = renderOpenDialog(onInteractOutside)
    await outsideListenerReady()

    fireEvent.pointerDown(screen.getByText('Close toast'))

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(onInteractOutside).not.toHaveBeenCalled()
  })

  it("closes on any other outside press and forwards it to the caller's handler", async () => {
    const onInteractOutside = jest.fn()
    const onOpenChange = renderOpenDialog(onInteractOutside)
    await outsideListenerReady()

    fireEvent.pointerDown(screen.getByText('Elsewhere'))

    expect(onInteractOutside).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('DialogContent close button', () => {
  const renderContent = (
    props: { closeLabel?: string; showCloseButton?: boolean } = {}
  ) =>
    render(
      <Dialog open>
        <DialogContent aria-describedby={undefined} {...props}>
          <DialogTitle>Edit</DialogTitle>
        </DialogContent>
      </Dialog>
    )

  it('is named Close by default', () => {
    renderContent()

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('takes a localized name', () => {
    renderContent({ closeLabel: 'Fechar' })

    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument()
  })

  it('is not rendered when showCloseButton is false', () => {
    renderContent({ showCloseButton: false })

    expect(screen.queryByRole('button')).toBeNull()
  })
})
