import '@testing-library/jest-dom'
import { act, render } from '@testing-library/react'

import { getThemeScript } from './get-theme-script'
import { ThemeProvider } from './theme-provider'

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
function runScript(): boolean {
  new Function(getThemeScript(STORAGE_KEY))()
  return document.documentElement.classList.contains('dark')
}

async function runProvider(): Promise<boolean> {
  const { unmount } = render(
    <ThemeProvider storageKey={STORAGE_KEY}>
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
  const cases: Array<{
    name: string
    stored: string | null
    prefersDark: boolean
    expectedDark: boolean
  }> = [
    {
      name: 'stored "dark"',
      stored: 'dark',
      prefersDark: false,
      expectedDark: true
    },
    {
      name: 'stored "light"',
      stored: 'light',
      prefersDark: true,
      expectedDark: false
    },
    {
      name: 'stored "system" with a dark OS',
      stored: 'system',
      prefersDark: true,
      expectedDark: true
    },
    {
      name: 'stored "system" with a light OS',
      stored: 'system',
      prefersDark: false,
      expectedDark: false
    },
    {
      name: 'no stored value with a dark OS',
      stored: null,
      prefersDark: true,
      expectedDark: true
    },
    {
      name: 'no stored value with a light OS',
      stored: null,
      prefersDark: false,
      expectedDark: false
    },
    {
      name: 'a corrupted stored value with a dark OS',
      stored: 'chartreuse',
      prefersDark: true,
      expectedDark: true
    },
    {
      name: 'a corrupted stored value with a light OS',
      stored: 'chartreuse',
      prefersDark: false,
      expectedDark: false
    }
  ]

  it.each(cases)(
    'resolves $name identically pre-paint and hydrated',
    async ({ stored, prefersDark, expectedDark }) => {
      mockSystemPrefersDark(prefersDark)

      reset(stored)
      const scriptDark = runScript()

      reset(stored)
      const providerDark = await runProvider()

      expect(scriptDark).toBe(expectedDark)
      expect(providerDark).toBe(expectedDark)
      expect(scriptDark).toBe(providerDark)
    }
  )
})
