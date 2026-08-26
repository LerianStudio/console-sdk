import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { ModeToggle } from './mode-toggle'
import { ThemeProvider, useTheme } from './theme-provider'

function CurrentTheme() {
  const { theme, resolvedTheme } = useTheme()
  return (
    <>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
    </>
  )
}

function renderToggle(props: Parameters<typeof ModeToggle>[0] = {}) {
  return render(
    <ThemeProvider storageKey="toggle.theme">
      <ModeToggle {...props} />
      <CurrentTheme />
    </ThemeProvider>
  )
}

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.classList.remove('dark')
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  }))
})

describe('ModeToggle', () => {
  it('exposes a labelled group of three theme segments', () => {
    renderToggle()

    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('marks the active segment with aria-pressed', async () => {
    renderToggle()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    )
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  it('switches through all three modes', async () => {
    renderToggle()

    fireEvent.click(screen.getByRole('button', { name: 'Dark' }))
    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    )
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(window.localStorage.getItem('toggle.theme')).toBe('dark')

    fireEvent.click(screen.getByRole('button', { name: 'Light' }))
    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('light')
    )
    expect(document.documentElement).not.toHaveClass('dark')

    fireEvent.click(screen.getByRole('button', { name: 'System' }))
    await waitFor(() =>
      expect(screen.getByTestId('theme')).toHaveTextContent('system')
    )
    expect(window.localStorage.getItem('toggle.theme')).toBe('system')
  })

  // Every segment is icon-only, so a blank override leaves aria-label="", which
  // names the button "" AND suppresses its other naming routes — strictly worse
  // than the untranslated English it replaced. A blank string is a MISSING
  // translation, not a chosen name.
  it.each([[''], ['   '], ['\t\n']])(
    'keeps the default label when an override is blank (%p)',
    (blank) => {
      renderToggle({
        labels: { light: blank, system: blank, dark: blank, group: blank }
      })

      expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'System' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Dark' })).toBeInTheDocument()
    }
  )

  it('falls back per key, so one blank override does not lose the others', () => {
    renderToggle({ labels: { light: '', dark: 'Escuro', group: 'Tema' } })

    expect(screen.getByRole('group', { name: 'Tema' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Escuro' })).toBeInTheDocument()
  })

  it('localizes the segment and group labels', () => {
    renderToggle({
      labels: {
        light: 'Claro',
        system: 'Sistema',
        dark: 'Escuro',
        group: 'Tema'
      }
    })

    expect(screen.getByRole('group', { name: 'Tema' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Escuro' })).toBeInTheDocument()
  })
})
