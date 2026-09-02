import '@testing-library/jest-dom'
import { render, waitFor } from '@testing-library/react'
import { Toaster as SonnerToaster } from 'sonner'

import { ThemeProvider } from '@/theme/theme-provider'
import { Toaster } from './toaster'

/**
 * sonner is mocked because the real Toaster resolves 'system' internally
 * through `matchMedia` before it renders anything, so the DOM cannot tell
 * 'system' apart from 'light' — and the resolution ORDER is exactly what is
 * under test here. Capturing the prop keeps the assertion on our contract, not
 * on sonner's internals.
 */
jest.mock('sonner', () => ({
  Toaster: jest.fn(() => null)
}))

/** The props of the LAST render — effects re-render the provider's consumers. */
function lastSonnerProps(): Record<string, unknown> {
  const calls = (SonnerToaster as unknown as jest.Mock).mock.calls
  expect(calls.length).toBeGreaterThan(0)
  return calls[calls.length - 1][0] as Record<string, unknown>
}

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('Toaster theme resolution', () => {
  it('uses the explicit theme prop over the provider theme', async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <Toaster theme="light" />
      </ThemeProvider>
    )

    await waitFor(() => expect(lastSonnerProps().theme).toBe('light'))
  })

  it('honours an explicit theme="system" inside a provider instead of the resolved theme', async () => {
    // 'system' is a real value, not "unset": a consumer asking for it wants
    // sonner's own media query, even under a dark provider.
    render(
      <ThemeProvider defaultTheme="dark">
        <Toaster theme="system" />
      </ThemeProvider>
    )

    await waitFor(() => expect(lastSonnerProps().theme).toBe('system'))
  })

  it("follows the provider's resolved theme when no prop is given", async () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <Toaster />
      </ThemeProvider>
    )

    await waitFor(() => expect(lastSonnerProps().theme).toBe('dark'))
  })

  it("follows the provider's resolved light theme too", async () => {
    render(
      <ThemeProvider defaultTheme="light">
        <Toaster />
      </ThemeProvider>
    )

    await waitFor(() => expect(lastSonnerProps().theme).toBe('light'))
  })

  it('tracks the provider when the stored preference switches the resolved theme', async () => {
    window.localStorage.setItem('sindarian.theme', 'dark')

    render(
      <ThemeProvider defaultTheme="light">
        <Toaster />
      </ThemeProvider>
    )

    await waitFor(() => expect(lastSonnerProps().theme).toBe('dark'))
  })

  it('renders outside any ThemeProvider without throwing and falls back to system', () => {
    expect(() => render(<Toaster />)).not.toThrow()

    expect(lastSonnerProps().theme).toBe('system')
  })

  it('keeps every other sonner prop unchanged', () => {
    render(<Toaster />)

    expect(lastSonnerProps()).toMatchObject({
      position: 'bottom-right',
      visibleToasts: 3,
      duration: 10000,
      expand: false,
      closeButton: true,
      richColors: false,
      offset: 16,
      gap: 8,
      toastOptions: { className: 'font-sans !text-sm !font-medium' }
    })
  })
})
