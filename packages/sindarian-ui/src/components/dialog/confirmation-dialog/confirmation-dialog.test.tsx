import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { ConfirmationDialog, ConfirmationDialogProps } from '.'

function renderDialog(props: Partial<ConfirmationDialogProps> = {}) {
  const onOpenChange = jest.fn()

  const view = render(
    <ConfirmationDialog
      open
      onOpenChange={onOpenChange}
      title="Delete the ledger?"
      description="This cannot be undone."
      {...props}
    />
  )

  return { ...view, onOpenChange }
}

function deferred() {
  let resolve!: () => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })

  return { promise, resolve, reject }
}

describe('ConfirmationDialog', () => {
  it('announces as an alert dialog, not a plain dialog', () => {
    renderDialog()

    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Delete the ledger?')).toBeInTheDocument()
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument()
  })

  it('opens with focus on cancel, the least destructive action', () => {
    renderDialog({ confirmLabel: 'Delete', cancelLabel: 'Keep it' })

    expect(screen.getByText('Keep it')).toHaveFocus()
    expect(screen.getByTestId('confirm')).not.toHaveFocus()
  })

  it('awaits a promise-returning confirm and closes once it resolves', async () => {
    const { promise, resolve } = deferred()
    const onConfirm = jest.fn(() => promise)
    const { onOpenChange } = renderDialog({ onConfirm })

    fireEvent.click(screen.getByTestId('confirm'))

    expect(onConfirm).toHaveBeenCalledTimes(1)
    // Still open while the mutation runs.
    expect(onOpenChange).not.toHaveBeenCalled()

    await act(async () => {
      resolve()
    })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('disables both actions and reports a pending status while confirming', async () => {
    const { promise, resolve } = deferred()
    const { onOpenChange } = renderDialog({ onConfirm: () => promise })

    expect(screen.getByRole('status')).toBeEmptyDOMElement()

    fireEvent.click(screen.getByTestId('confirm'))

    expect(screen.getByRole('status')).toHaveTextContent('Processing')
    expect(screen.getByTestId('confirm')).toBeDisabled()
    expect(screen.getByText('Cancel')).toBeDisabled()

    await act(async () => {
      resolve()
    })

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('ignores a second confirm click while the first is still running', async () => {
    const { promise, resolve } = deferred()
    const onConfirm = jest.fn(() => promise)
    renderDialog({ onConfirm })

    fireEvent.click(screen.getByTestId('confirm'))
    fireEvent.click(screen.getByTestId('confirm'))

    expect(onConfirm).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolve()
    })
  })

  it('blocks Escape while confirming but honours it when idle', async () => {
    const { promise, resolve } = deferred()
    const { onOpenChange } = renderDialog({ onConfirm: () => promise })

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    onOpenChange.mockClear()

    fireEvent.click(screen.getByTestId('confirm'))
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onOpenChange).not.toHaveBeenCalled()

    await act(async () => {
      resolve()
    })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('stays open and clears the pending state when confirm rejects', async () => {
    const { promise, reject } = deferred()
    const { onOpenChange } = renderDialog({ onConfirm: () => promise })

    fireEvent.click(screen.getByTestId('confirm'))

    await act(async () => {
      reject(new Error('boom'))
    })

    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(screen.getByTestId('confirm')).not.toBeDisabled()
  })

  it('closes on a synchronous confirm', () => {
    const onConfirm = jest.fn()
    const { onOpenChange } = renderDialog({ onConfirm })

    fireEvent.click(screen.getByTestId('confirm'))

    expect(onConfirm).toHaveBeenCalledTimes(1)

    return Promise.resolve().then(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('runs onCancel and closes from the cancel action', () => {
    const onCancel = jest.fn()
    const { onOpenChange } = renderDialog({ onCancel })

    fireEvent.click(screen.getByText('Cancel'))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('lets the caller localize the pending announcement', async () => {
    const { promise, resolve } = deferred()
    renderDialog({ onConfirm: () => promise, pendingLabel: 'Processando…' })

    fireEvent.click(screen.getByTestId('confirm'))

    expect(screen.getByRole('status')).toHaveTextContent('Processando…')
    expect(screen.getByRole('status')).not.toHaveTextContent('Processing')

    await act(async () => {
      resolve()
    })
  })

  it('keeps honouring the caller-driven loading prop', () => {
    renderDialog({ loading: true })

    expect(screen.getByRole('status')).toHaveTextContent('Processing')
    expect(screen.getByTestId('confirm')).toBeDisabled()
    expect(screen.getByText('Cancel')).toBeDisabled()
  })

  it('gives destructive its own treatment instead of aliasing default', () => {
    const { unmount } = renderDialog({ variant: 'destructive' })
    const destructive = screen
      .getByRole('alertdialog')
      .querySelector('span[class*="size-10"]')
    const destructiveClass = destructive?.className ?? ''
    unmount()

    renderDialog({ variant: 'default' })
    const fallback = screen
      .getByRole('alertdialog')
      .querySelector('span[class*="size-10"]')

    expect(destructiveClass).not.toBe('')
    expect(destructiveClass).not.toBe(fallback?.className)
    expect(destructiveClass).toContain('bg-system-error-surface')
    expect(fallback?.className).toContain('bg-muted')
  })

  it('keeps the cancel action looking like a secondary button', () => {
    // AlertDialogCancel hardcodes the outline variant and Slot joins its
    // className into this child's, so the two variants meet inside one cn call.
    // They are a single conflict group, last one wins, and outline arrives
    // second — so the secondary chrome survives only while this child's
    // className re-asserts it last. Absence of button-outline IS the assertion.
    renderDialog()

    const cancel = screen.getByText('Cancel')

    expect(cancel).toHaveClass('button-secondary')
    expect(cancel).not.toHaveClass('button-outline')
    // The composers ride along, so the disabled state still drops its border
    // and shadow the way a plain secondary button does.
    expect(cancel).toHaveClass('button-base', 'button-disabled', 'button-small')
  })

  it('carries no raw palette colours on any variant', () => {
    const variants: ConfirmationDialogProps['variant'][] = [
      'default',
      'warning',
      'destructive',
      'success'
    ]

    variants.forEach((variant) => {
      const { unmount } = renderDialog({ variant })

      expect(screen.getByRole('alertdialog').innerHTML).not.toMatch(
        /(bg|text)-(red|yellow|green)-\d/
      )

      unmount()
    })
  })
})
