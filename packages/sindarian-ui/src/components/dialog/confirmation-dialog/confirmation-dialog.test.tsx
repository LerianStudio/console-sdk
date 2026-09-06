import '@testing-library/jest-dom'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { ConfirmationDialog, ConfirmationDialogProps } from '.'

/**
 * The cast is the price of the override bag. `Partial` makes `loading` and
 * `pendingLabel` independently optional, which is precisely the correlation the
 * props union exists to forbid, so no `Partial`-shaped parameter can satisfy
 * it. The union itself is asserted directly, at a real call site, in
 * "ConfirmationDialog pending typing" at the bottom of this file.
 */
function renderDialog(props: Partial<ConfirmationDialogProps> = {}) {
  const onOpenChange = jest.fn()

  const view = render(
    <ConfirmationDialog
      {...({
        open: true,
        onOpenChange,
        title: 'Delete the ledger?',
        description: 'This cannot be undone.',
        ...props
      } as ConfirmationDialogProps)}
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
    const { onOpenChange } = renderDialog({
      onConfirm: () => promise,
      pendingLabel: 'Processing'
    })

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
    const { onOpenChange } = renderDialog({
      onConfirm: () => promise,
      pendingLabel: 'Processing'
    })

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
    renderDialog({ loading: true, pendingLabel: 'Processing' })

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
    // Slot joins AlertDialogCancel's className into this child's, so both
    // variants meet inside one cn call as a single conflict group. The dialog
    // hands Cancel the secondary variant through its own seam, so both halves
    // emit button-secondary and there is no outline left to arrive last and win
    // the group. Absence of button-outline IS the assertion.
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

/**
 * The pending region is announced through `role="status"`, so its text is read
 * aloud. A hard-coded English default meant a Portuguese console announced
 * "Processing" over its own copy, and the caller had no way to know it was
 * happening: the string is invisible on screen. The region is now mounted only
 * when the caller supplies the label, so an unlocalized dialog announces
 * nothing rather than announcing the wrong language.
 */
describe('ConfirmationDialog pending announcement', () => {
  it('announces nothing when the caller supplies no pending label', async () => {
    const { promise, resolve } = deferred()
    renderDialog({ onConfirm: () => promise })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('confirm'))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    await act(async () => {
      resolve()
    })
  })

  it('mounts the region empty so the label change is what fires', () => {
    renderDialog({ pendingLabel: 'Processando' })

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('keeps the visible action labels defaulted in English', () => {
    // Deliberately unchanged: a caller SEES these two and overrides them, so
    // dropping the defaults would blank the buttons of every existing consumer.
    renderDialog()

    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
  })
})

/**
 * The busy prop and the announcement are one decision, so the type says so.
 * Wave 1 dropped the English default for `pendingLabel` and stopped mounting
 * the `role="status"` region without it, which is right for a translated
 * console and silent for the 73 consumer call sites that pass `loading` alone:
 * nothing on screen changes when the announcement disappears. `loading` now
 * requires the label, so those call sites fail the build instead.
 *
 * The annotations ARE the assertion, the way `select-field.test.tsx` pins its
 * own discriminant: `tsc -p tsconfig.storybook.json` checks this file, so it
 * fails the day an unmarked shape stops compiling and just as loudly the day a
 * marked one starts.
 */
describe('ConfirmationDialog pending typing', () => {
  it('requires a pending label wherever the busy prop is passed', () => {
    const noBusyState: ConfirmationDialogProps = {
      open: true,
      onOpenChange: jest.fn()
    }

    // Optional while nothing drives the busy state from outside.
    const labelWithoutBusyState: ConfirmationDialogProps = {
      open: true,
      onOpenChange: jest.fn(),
      pendingLabel: 'Processando'
    }

    const busyStateWithLabel: ConfirmationDialogProps = {
      open: true,
      onOpenChange: jest.fn(),
      loading: true,
      pendingLabel: 'Processando'
    }

    // @ts-expect-error the silent case: `loading` drives a pending state that
    // has no announcement without the label.
    const busyStateWithoutLabel: ConfirmationDialogProps = {
      open: true,
      onOpenChange: jest.fn(),
      loading: true
    }

    expect([
      noBusyState,
      labelWithoutBusyState,
      busyStateWithLabel,
      busyStateWithoutLabel
    ]).toHaveLength(4)
  })
})

/**
 * `title` and `description` were typed `string`, so a caller could not put a
 * bold entity name or a link inside the copy without forking the component.
 * Both Radix slots have always accepted arbitrary children.
 */
describe('ConfirmationDialog rich copy', () => {
  it('renders an element inside the description', () => {
    renderDialog({
      description: (
        <span>
          This deletes <strong>every</strong> entry.
        </span>
      )
    })

    expect(screen.getByText('every').tagName).toBe('STRONG')
  })

  it('renders an element inside the title', () => {
    renderDialog({
      title: (
        <span>
          Delete <em>Main ledger</em>?
        </span>
      )
    })

    expect(screen.getByText('Main ledger').tagName).toBe('EM')
  })

  it.each([false, '', true])(
    'keeps the fallback accessible name for an empty title value (%p)',
    (title) => {
      render(
        <ConfirmationDialog
          open
          onOpenChange={jest.fn()}
          title={title}
          confirmLabel="Delete"
        />
      )

      expect(
        screen.getByRole('alertdialog', { name: 'Delete' })
      ).toBeInTheDocument()
    }
  )

  it('keeps an accessible name without optional copy', () => {
    render(<ConfirmationDialog open onOpenChange={jest.fn()} />)

    const dialog = screen.getByRole('alertdialog', { name: 'Confirm' })

    expect(dialog).not.toHaveAttribute('aria-describedby')
  })

  it('declares both copy slots as nodes, not strings', () => {
    // The two tests above pass either way, because React renders whatever it is
    // handed no matter what the prop type claims. Nothing type-checks a test
    // file in this package (tsconfig excludes them and ts-jest transpiles), so
    // the widened signature is asserted against the source, the way
    // "Badge token hygiene" asserts its own.
    const source = readFileSync(join(__dirname, 'index.tsx'), 'utf8')

    expect(source).toMatch(/title\?: React\.ReactNode/)
    expect(source).toMatch(/description\?: React\.ReactNode/)
  })
})
