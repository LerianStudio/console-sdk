import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'

import { ThemeProvider, useTheme } from './theme-provider'

/**
 * jsdom's MediaQueryList always reports `matches: false`, so the system
 * preference has to be driven explicitly. `listeners` captures the provider's
 * 'change' subscription so a live OS switch can be simulated.
 */
let listeners: Array<(event: MediaQueryListEvent) => void> = []

function mockSystemPrefersDark(prefersDark: boolean) {
  listeners = []
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: prefersDark,
    media: query,
    onchange: null,
    addEventListener: (_: string, listener: (e: MediaQueryListEvent) => void) =>
      listeners.push(listener),
    removeEventListener: (
      _: string,
      listener: (e: MediaQueryListEvent) => void
    ) => {
      listeners = listeners.filter((l) => l !== listener)
    },
    dispatchEvent: () => false
  }))
}

function Probe() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('dark')}>go dark</button>
      <button onClick={() => setTheme('system')}>go system</button>
    </div>
  )
}

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.classList.remove('dark')
  mockSystemPrefersDark(false)
})

describe('ThemeProvider', () => {
  it('defaults to the system preference and resolves it', async () => {
    mockSystemPrefersDark(true)

    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    )

    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('system')
    )
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('persists a chosen preference under the default storage key', async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    )

    act(() => screen.getByText('go dark').click())

    await waitFor(() =>
      expect(window.localStorage.getItem('sindarian.theme')).toBe('dark')
    )
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('reads the stored preference on mount, overriding defaultTheme', async () => {
    window.localStorage.setItem('app.theme', 'dark')

    render(
      <ThemeProvider storageKey="app.theme" defaultTheme="light">
        <Probe />
      </ThemeProvider>
    )

    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    )
    expect(document.documentElement).toHaveClass('dark')
  })

  it('tracks live OS changes while the preference is system', async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    )

    await waitFor(() =>
      expect(screen.getByTestId('resolved')).toHaveTextContent('light')
    )

    act(() => {
      listeners.forEach((l) => l({ matches: true } as MediaQueryListEvent))
    })

    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('stops tracking OS changes once an explicit preference is set', async () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    )

    act(() => screen.getByText('go dark').click())
    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    )

    expect(listeners).toHaveLength(0)
  })

  it('syncs across tabs through the storage event', async () => {
    render(
      <ThemeProvider storageKey="app.theme">
        <Probe />
      </ThemeProvider>
    )

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'app.theme', newValue: 'dark' })
      )
    })

    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    )
    expect(document.documentElement).toHaveClass('dark')
  })

  it('falls back to defaultTheme when another tab clears the key', async () => {
    window.localStorage.setItem('app.theme', 'dark')

    render(
      <ThemeProvider storageKey="app.theme" defaultTheme="light">
        <Probe />
      </ThemeProvider>
    )

    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    )

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'app.theme', newValue: null })
      )
    })

    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('light')
    )
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('falls back to defaultTheme when another tab clears the whole store', async () => {
    // `localStorage.clear()` fires a storage event with key === null: the
    // preference is gone but never named. Bailing out on an unnamed key left
    // the provider holding a deleted preference and the wrong document class.
    window.localStorage.setItem('app.theme', 'dark')

    render(
      <ThemeProvider storageKey="app.theme" defaultTheme="light">
        <Probe />
      </ThemeProvider>
    )

    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    )

    act(() => {
      window.localStorage.clear()
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: null,
          newValue: null,
          storageArea: window.localStorage
        })
      )
    })

    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('light')
    )
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('ignores a sessionStorage event carrying the SAME key', async () => {
    // The store check has to run BEFORE the key check. Testing the key first
    // let a sessionStorage write under the same name through, and it mutated a
    // preference that lives in localStorage.
    window.localStorage.setItem('app.theme', 'dark')

    render(
      <ThemeProvider storageKey="app.theme" defaultTheme="light">
        <Probe />
      </ThemeProvider>
    )

    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    )

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'app.theme',
          newValue: 'light',
          storageArea: window.sessionStorage
        })
      )
    })

    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    )
  })

  it('ignores a sessionStorage clear', async () => {
    // Only the store the preference lives in can reset it; sessionStorage
    // clearing its own keys says nothing about the theme.
    window.localStorage.setItem('app.theme', 'dark')

    render(
      <ThemeProvider storageKey="app.theme" defaultTheme="light">
        <Probe />
      </ThemeProvider>
    )

    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    )

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: null,
          newValue: null,
          storageArea: window.sessionStorage
        })
      )
    })

    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    )
  })

  it('ignores storage events for other keys', async () => {
    render(
      <ThemeProvider storageKey="app.theme">
        <Probe />
      </ThemeProvider>
    )

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: 'other.theme', newValue: 'dark' })
      )
    })

    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('system')
    )
  })
})

describe('useTheme', () => {
  it('throws outside a ThemeProvider', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    expect(() => render(<Probe />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    )

    consoleError.mockRestore()
  })
})
