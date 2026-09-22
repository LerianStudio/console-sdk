import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { toast as sonnerToast } from 'sonner'

import { Toaster } from '@/components/ui/toast/toaster'
import { errorToast, successToast, warningToast } from './helpers'

/**
 * End-to-end wiring check: the helpers must reach the SAME `<Toaster />` every
 * other sindarian-ui consumer mounts. Nothing is mocked — a helper that stopped
 * routing through `@/hooks/use-toast` would render nothing here.
 *
 * `data-type` is Sonner's own severity attribute, so asserting it pins the
 * variant mapping (success → success, error → error, warning → warning).
 */
// Sonner's Toaster reads prefers-reduced-motion on mount; jsdom has no matchMedia.
beforeEach(() => {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  }))
})

afterEach(() => {
  sonnerToast.dismiss()
})

describe('toast helpers', () => {
  it.each([
    ['successToast', successToast, 'success'],
    ['errorToast', errorToast, 'error'],
    ['warningToast', warningToast, 'warning']
  ] as const)(
    '%s renders its title and description through the Toaster',
    async (name, helper, expectedType) => {
      render(<Toaster />)

      helper(`${name} title`, `${name} description`)

      const title = await screen.findByText(`${name} title`)
      expect(screen.getByText(`${name} description`)).toBeInTheDocument()

      const toastEl = title.closest('[data-sonner-toast]')
      expect(toastEl).toHaveAttribute('data-type', expectedType)
    }
  )

  it('renders a title-only toast', async () => {
    render(<Toaster />)

    successToast('Version recorded')

    expect(await screen.findByText('Version recorded')).toBeInTheDocument()
  })

  it('accepts legacy opts without rendering an errorCode slot', async () => {
    render(<Toaster />)

    errorToast('Request failed', 'Account not found', { errorCode: 'ACC-404' })

    expect(await screen.findByText('Request failed')).toBeInTheDocument()
    expect(screen.getByText('Account not found')).toBeInTheDocument()
    expect(screen.queryByText('ACC-404')).not.toBeInTheDocument()
  })

  it('renders an action element passed through opts', async () => {
    render(<Toaster />)

    warningToast('Sem permissão', 'A ação foi recusada pelo servidor.', {
      action: <button>Retry</button>
    })

    await screen.findByText('Sem permissão')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    )
  })
})

/**
 * The lifetime knob has to be reachable from the surface the consoles actually
 * call. Spying on sonner's own severity functions is the narrowest place to
 * prove it: it pins what leaves sindarian-ui without asserting on sonner's
 * internal timer.
 */
describe('toast helper duration', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('forwards a caller-supplied duration to sonner', () => {
    const error = jest.spyOn(sonnerToast, 'error')

    errorToast('Refused', 'The ledger rejected the entry', { duration: 2000 })

    expect(error).toHaveBeenCalledWith(
      'Refused',
      expect.objectContaining({ duration: 2000 })
    )
  })

  it('forwards a duration from the non-destructive helpers too', () => {
    const success = jest.spyOn(sonnerToast, 'success')
    const warning = jest.spyOn(sonnerToast, 'warning')

    successToast('Saved', undefined, { duration: 1500 })
    warningToast('Partial', undefined, { duration: 3000 })

    expect(success).toHaveBeenCalledWith(
      'Saved',
      expect.objectContaining({ duration: 1500 })
    )
    expect(warning).toHaveBeenCalledWith(
      'Partial',
      expect.objectContaining({ duration: 3000 })
    )
  })

  it('leaves the variant lifetime alone when no duration is passed', () => {
    const error = jest.spyOn(sonnerToast, 'error')

    errorToast('Refused')

    expect(error).toHaveBeenCalledWith(
      'Refused',
      expect.objectContaining({ duration: Infinity })
    )
  })
})
