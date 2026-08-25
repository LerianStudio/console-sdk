import type { ThemePreference } from './theme-provider'

/**
 * Pre-paint theme script (FOUC guard). Returns a minified IIFE string that
 * reads the persisted preference from localStorage, resolves it the way
 * ThemeProvider does, and toggles the `.dark` class on the page root element
 * before first paint — so the page never flashes the wrong theme while React
 * hydrates. ThemeProvider owns the class from mount onward.
 *
 * The resolution mirrors ThemeProvider's exactly: an exact "dark"/"light"/
 * "system" stored value wins; anything else — absent or corrupted — falls back
 * to `defaultTheme`, which is then resolved ("dark" → dark, "light" → light,
 * "system" → the media query). Pass the SAME `defaultTheme` you give
 * ThemeProvider, or the two disagree on a first visit.
 * `get-theme-script.test.tsx` pins that agreement case by case.
 *
 * Server-safe: this module references no browser globals at module scope; the
 * returned string runs in the browser only, inside a try/catch.
 *
 * Consumer usage — inject in the page <head>, ideally as the first script:
 *
 *   <script dangerouslySetInnerHTML={{ __html: getThemeScript() }} />
 *
 * A dark-by-default app passes both arguments:
 *
 *   <script dangerouslySetInnerHTML={{ __html: getThemeScript('app.theme', 'dark') }} />
 */

/**
 * JSON string literal with `<` escaped, so no embedded value can close the
 * inline <script> element it is written into. `<` is `<` to the JS parser,
 * so the emitted script still compares against the original text.
 */
function jsString(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003C')
}

export function getThemeScript(
  storageKey = 'sindarian.theme',
  defaultTheme: ThemePreference = 'system'
): string {
  return `(function(){try{var k=${jsString(storageKey)};var t=localStorage.getItem(k);var r=(t==="dark"||t==="light"||t==="system")?t:${jsString(defaultTheme)};var d=r==="dark"||(r==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`
}
