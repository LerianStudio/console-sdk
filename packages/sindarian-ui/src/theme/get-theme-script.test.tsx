import '@testing-library/jest-dom'
import { act, render } from '@testing-library/react'

import { getThemeScript } from './get-theme-script'
import { ThemeProvider, type ThemePreference } from './theme-provider'

/**
 * FC-3 fallback contract: the pre-paint script and the hydrated provider must
 * resolve to the SAME mode for every stored value, or the page flashes the
 * wrong theme on the way to hydration. These tests run both resolvers against
 * an identical starting state and compare the resulting `.dark` class.
 */
function mockSystemPrefersDark(prefersDark: boolean) {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: prefersDark,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  }))
}

const STORAGE_KEY = 'agreement.theme'

function reset(stored: string | null) {
  document.documentElement.classList.remove('dark')
  window.localStorage.clear()
  if (stored !== null) window.localStorage.setItem(STORAGE_KEY, stored)
}

/** Runs the returned IIFE the way a <script> tag in <head> would. */
function runScript(defaultTheme?: ThemePreference): boolean {
  new Function(getThemeScript(STORAGE_KEY, defaultTheme))()
  return document.documentElement.classList.contains('dark')
}

async function runProvider(defaultTheme?: ThemePreference): Promise<boolean> {
  const { unmount } = render(
    <ThemeProvider storageKey={STORAGE_KEY} defaultTheme={defaultTheme}>
      <span>content</span>
    </ThemeProvider>
  )
  // The stored value is read in a mount effect which re-renders and re-runs the
  // class effect; flush that cascade before reading the class.
  await act(async () => {})
  const isDark = document.documentElement.classList.contains('dark')
  unmount()
  return isDark
}

describe('getThemeScript', () => {
  it('uses the default storage key', () => {
    expect(getThemeScript()).toContain('"sindarian.theme"')
  })

  it('embeds a custom storage key safely', () => {
    expect(getThemeScript('app"weird')).toContain('"app\\"weird"')
  })

  it('escapes < so a pathological key cannot close the script tag', () => {
    const script = getThemeScript('app</script><img src=x onerror=alert(1)>')

    expect(script).not.toContain('<')
    expect(script).toContain('\\u003C')
  })

  it('still matches the escaped key against the real stored value', () => {
    const key = 'a<b'
    window.localStorage.clear()
    window.localStorage.setItem(key, 'dark')
    document.documentElement.classList.remove('dark')
    mockSystemPrefersDark(false)

    new Function(getThemeScript(key))()

    // The escape is a JS-source escape only: `<` parses back to `<`, so
    // the emitted script reads the very key the caller passed.
    expect(document.documentElement).toHaveClass('dark')
  })

  it('swallows errors so a broken storage never blocks paint', () => {
    const getItem = jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('storage disabled')
      })

    expect(() => runScript()).not.toThrow()

    getItem.mockRestore()
  })
})

describe('pre-paint script and ThemeProvider agree', () => {
  /**
   * The contract, stated once and independently of either implementation: a
   * valid stored preference wins, anything else falls back to defaultTheme,
   * and 'system' then resolves against the OS. The test's value is that two
   * separate implementations — an emitted JS string and a React component —
   * both land on it.
   */
  function expectedDark(
    stored: string | null,
    defaultTheme: ThemePreference,
    prefersDark: boolean
  ): boolean {
    const resolved =
      stored === 'dark' || stored === 'light' || stored === 'system'
        ? stored
        : defaultTheme
    return resolved === 'dark' || (resolved === 'system' && prefersDark)
  }

  const storedValues: Array<[label: string, stored: string | null]> = [
    ['stored "dark"', 'dark'],
    ['stored "light"', 'light'],
    ['stored "system"', 'system'],
    ['no stored value', null],
    ['a corrupted stored value', 'chartreuse']
  ]

  const cases = (['system', 'dark', 'light'] as const).flatMap((defaultTheme) =>
    storedValues.flatMap(([label, stored]) =>
      [true, false].map((prefersDark) => ({
        name: `${label}, defaultTheme "${defaultTheme}", ${prefersDark ? 'dark' : 'light'} OS`,
        stored,
        defaultTheme,
        prefersDark
      }))
    )
  )

  it.each(cases)(
    'resolves $name identically pre-paint and hydrated',
    async ({ stored, defaultTheme, prefersDark }) => {
      mockSystemPrefersDark(prefersDark)
      const expected = expectedDark(stored, defaultTheme, prefersDark)

      reset(stored)
      const scriptDark = runScript(defaultTheme)

      reset(stored)
      const providerDark = await runProvider(defaultTheme)

      expect(scriptDark).toBe(expected)
      expect(providerDark).toBe(expected)
      expect(scriptDark).toBe(providerDark)
    }
  )
})
