import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '.'

function Basic({ onConfirm }: { onConfirm?: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger>Delete</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

describe('AlertDialog', () => {
  it('opens from the trigger and renders the title and description', () => {
    render(<Basic />)

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Delete'))

    const dialog = screen.getByRole('alertdialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
  })

  it('runs the action handler and closes on cancel', () => {
    const onConfirm = jest.fn()
    render(<Basic onConfirm={onConfirm} />)

    fireEvent.click(screen.getByText('Delete'))
    fireEvent.click(screen.getByText('Confirm'))
    expect(onConfirm).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('Delete'))
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('keeps the overlay and content mounted while closed under forceMount', () => {
    // The overlay and the content each hold their OWN presence state; the
    // portal does not control them. Forwarding forceMount to the portal alone
    // left both children unmounted while closed, so a caller animating the exit
    // had nothing to animate.
    render(
      <AlertDialog>
        <AlertDialogTrigger>Delete</AlertDialogTrigger>
        <AlertDialogContent forceMount>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    )

    // Never opened, yet both parts are in the DOM and marked closed.
    const content = document.querySelector('[data-slot="alert-dialog-content"]')
    const overlay = document.querySelector('[data-slot="alert-dialog-overlay"]')
    expect(content).toBeInTheDocument()
    expect(overlay).toBeInTheDocument()
    expect(content).toHaveAttribute('data-state', 'closed')
    expect(overlay).toHaveAttribute('data-state', 'closed')
  })

  it('gives the action the primary button by default', () => {
    render(<Basic />)

    fireEvent.click(screen.getByText('Delete'))
    expect(screen.getByText('Confirm')).toHaveClass('button-primary')
  })

  it('threads a variant through to the action', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    const action = screen.getByText('Delete')
    expect(action).toHaveClass('button-destructive')
    expect(action).not.toHaveClass('button-primary')
  })

  it('unmounts the overlay and content while closed without forceMount', () => {
    render(<Basic />)

    expect(
      document.querySelector('[data-slot="alert-dialog-content"]')
    ).toBeNull()
    expect(
      document.querySelector('[data-slot="alert-dialog-overlay"]')
    ).toBeNull()
  })
})
