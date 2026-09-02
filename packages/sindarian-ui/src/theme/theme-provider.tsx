'use client'

/**
 * ThemeProvider — owns theme preference ('light' | 'dark' | 'system'),
 * persists it to localStorage, applies the `.dark` class on
 * `document.documentElement`, and resolves 'system' via
 * `prefers-color-scheme`.
 *
 * SSR-safe: state initializes to `defaultTheme` and never reads
 * window/localStorage during render. The persisted value is read inside an
 * effect on mount, so first paint uses `defaultTheme`. Pair with
 * `getThemeScript` in the document <head> to remove the flash before paint.
 *
 * Same-tab sync is handled by React context (every consumer reads the same
 * provider state); cross-tab sync rides the native `storage` event. While the
 * preference is 'system', `matchMedia('change')` keeps the resolved value live.
 * Theme switches are instant by design — no global color transition.
 */
import * as React from 'react'

const DARK_QUERY = '(prefers-color-scheme: dark)'

export type ThemePreference = 'light' | 'dark' | 'system'

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

function systemPrefersDark(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false
  }
  return window.matchMedia(DARK_QUERY).matches
}

type ThemeContextValue = {
  /** The persisted preference (NOT the resolved light/dark value). */
  theme: ThemePreference
  /** Persist a new preference; updates every consumer of this provider. */
  setTheme: (next: ThemePreference) => void
  /** The effective mode after resolving 'system'. */
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

export interface ThemeProviderProps {
  children: React.ReactNode
  /** localStorage key holding the preference. */
  storageKey?: string
  /** Preference used for the first (SSR / pre-hydration) paint. */
  defaultTheme?: ThemePreference
}

export function ThemeProvider({
  children,
  storageKey = 'sindarian.theme',
  defaultTheme = 'system'
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<ThemePreference>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = React.useState<'light' | 'dark'>(
    defaultTheme === 'dark' ? 'dark' : 'light'
  )

  const setTheme = React.useCallback(
    (next: ThemePreference) => {
      setThemeState(next)
      if (typeof window === 'undefined') return
      try {
        window.localStorage.setItem(storageKey, next)
      } catch {
        // Storage unavailable (private mode, quota). In-memory state still works.
      }
    },
    [storageKey]
  )

  // Read the persisted preference once on mount (effect, never render).
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(storageKey)
      if (isThemePreference(stored)) setThemeState(stored)
    } catch {
      // Ignore; keep defaultTheme.
    }
  }, [storageKey])

  // Apply the resolved class; while 'system', track prefers-color-scheme live.
  React.useEffect(() => {
    if (typeof document === 'undefined') return

    const apply = (dark: boolean) => {
      document.documentElement.classList.toggle('dark', dark)
      setResolvedTheme(dark ? 'dark' : 'light')
    }

    apply(theme === 'system' ? systemPrefersDark() : theme === 'dark')

    if (theme !== 'system' || typeof window.matchMedia !== 'function') {
      return
    }

    const media = window.matchMedia(DARK_QUERY)
    const onChange = (event: MediaQueryListEvent) => apply(event.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  // Cross-tab sync: the native `storage` event only fires in OTHER tabs.
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const onStorage = (event: StorageEvent) => {
      // WHICH STORE first, then which key. Only the store the preference lives
      // in may change it: a sessionStorage event carrying the SAME key would
      // otherwise mutate a localStorage-backed preference. `storageArea` is
      // absent only on a hand-dispatched synthetic event — apps use those for
      // same-tab sync — and one of those is not attributable to any store, so it
      // is allowed through rather than silently dropped.
      if (
        event.storageArea != null &&
        event.storageArea !== window.localStorage
      )
        return
      // A null key means another tab called `clear()` on the whole store, so the
      // stored preference is gone even though it is not named. Returning early
      // on that left the provider holding a deleted preference — and the wrong
      // `dark` class on the document. Fall through with newValue null, which
      // lands on the fallback.
      if (event.key !== null && event.key !== storageKey) return
      setThemeState(
        isThemePreference(event.newValue) ? event.newValue : defaultTheme
      )
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [storageKey, defaultTheme])

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, resolvedTheme }),
    [theme, setTheme, resolvedTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** Reads the theme context. Throws if used outside a ThemeProvider. */
export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext)
  if (context === null) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/**
 * Reads the theme context without requiring a provider — `undefined` when
 * there is none. For library components that should follow the theme when one
 * exists but must not force every consumer to mount a ThemeProvider (Toaster).
 * Not re-exported from the package barrel: consumers use `useTheme`, whose
 * throw is the intended signal that the provider is missing.
 */
export function useOptionalTheme(): ThemeContextValue | undefined {
  return React.useContext(ThemeContext) ?? undefined
}
