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
 * variant mapping (success → success, error/warning → error).
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
    ['warningToast', warningToast, 'error']
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
