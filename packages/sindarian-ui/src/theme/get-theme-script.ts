/**
 * Pre-paint theme script (FOUC guard). Returns a minified IIFE string that
 * reads the persisted preference from localStorage, resolves 'system' via
 * `prefers-color-scheme`, and toggles the `.dark` class on the page root
 * element before first paint — so the page never flashes the wrong theme while
 * React hydrates. ThemeProvider owns the class from mount onward.
 *
 * The resolution MUST mirror ThemeProvider's: only an exact "dark"/"light"
 * stored value pins the mode; anything else — "system", absent, or a corrupted
 * value — falls back to the system preference, exactly as the provider does
 * (it validates the stored string and otherwise keeps `defaultTheme`, which is
 * 'system'). `get-theme-script.test.ts` pins that agreement case by case.
 *
 * Server-safe: this module references no browser globals at module scope; the
 * returned string runs in the browser only, inside a try/catch.
 *
 * Consumer usage — inject in the page <head>, ideally as the first script:
 *
 *   <script dangerouslySetInnerHTML={{ __html: getThemeScript() }} />
 *
 * Pass the same `storageKey` you give ThemeProvider if you override its default.
 */
export function getThemeScript(storageKey = 'sindarian.theme'): string {
  return `(function(){try{var k=${JSON.stringify(storageKey)};var t=localStorage.getItem(k);var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`
}
