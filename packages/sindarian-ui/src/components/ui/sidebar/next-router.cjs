'use strict'

/**
 * Next.js router resolution — deliberately authored as CommonJS, and shipped
 * byte-identical into BOTH build outputs (`dist/` and `dist/esm/`).
 *
 * `require` with a literal specifier, wrapped in try/catch, is the one form
 * that behaves correctly in both consumer worlds:
 *  - Next (webpack/turbopack) statically sees the literal and bundles
 *    next/link into the client chunk, so navigation stays client-side;
 *  - Vite/rolldown cannot resolve it when `next` is absent, and instead of
 *    failing the build it drops through to the catch.
 * A dynamic `import()` fails the Vite build outright; a computed specifier
 * hides it from Next too, which would silently downgrade the Console to full
 * page loads.
 *
 * That form has no equivalent in ES modules: a bare `require` does not exist
 * there, so the ESM build would always fall through to the catch and every
 * Next.js consumer would silently lose client-side sidebar navigation. Rather
 * than fork the behavior per format, the ~15 lines that need CommonJS
 * semantics live in a `.cjs` file — CommonJS inside `dist/` (package type
 * commonjs) and CommonJS inside `dist/esm/` (`.cjs` overrides type module).
 * Every bundler in play (webpack, rollup/Vite, esbuild) and Node itself read
 * it the same way from either entry point.
 *
 * Resolved once by its importer, so the returned object — and therefore
 * `usePathname`'s identity — is stable across renders.
 *
 * @returns {{ Link: unknown, usePathname: () => string } | null}
 */
/**
 * Whether `next` itself is present in this install.
 *
 * The thrown error cannot answer this on its own. MODULE_NOT_FOUND (and the
 * "Cannot find module" text) is ALSO what Node reports when `next/link` is right
 * there but something IT requires is missing — a genuinely broken install, which
 * an error-shape check silences along with the intended fallback. Asking about
 * the top-level package separates "no Next here" from "Next here and broken".
 *
 * `next/package.json` rather than `next`: the manifest is inert, while the
 * package entry executes code and could throw for the very reason being
 * diagnosed.
 */
function nextIsInstalled() {
  try {
    require.resolve('next/package.json')
    return true
  } catch {
    return false
  }
}

/**
 * Whether the failure says one of the two ENTRIES we require is itself absent,
 * rather than something missing INSIDE an installed next.
 *
 * This is the distinction the warning turns on, and `nextIsInstalled()` alone
 * cannot draw it: a shimmed or mocked environment can leave the real `next`
 * package on disk while `next/link` does not resolve, which is not a broken
 * install and not worth a word. Naming the two specifiers keeps the check narrow
 * — a missing INNER dependency reports some other module and still warns, which
 * is the whole point.
 */
function isMissingNextEntry(error) {
  return /Cannot find module '(next\/link|next\/navigation)'/.test(
    String(error && error.message)
  )
}

exports.loadNextRouter = function loadNextRouter() {
  try {
    const link = require('next/link')
    const navigation = require('next/navigation')

    const Link = link?.default ?? link
    const usePathname = navigation?.usePathname

    if (!Link || typeof usePathname !== 'function') return null
    return { Link, usePathname }
  } catch (error) {
    // Two very different situations reach here. `next` simply NOT INSTALLED is
    // the intended fallback (every Vite consumer) and must stay silent. `next`
    // installed but failing to load is the silent downgrade this file's header
    // warns about: the Console drops to plain anchors and full page loads with
    // nothing anywhere saying why. Only the second one is worth a word, and only
    // in development.
    //
    // TWO signals, because each covers what the other misses.
    // `nextIsInstalled()` is the robust one: it does not depend on error text,
    // which varies across Node, Jest and every bundler. But on its own it warns
    // whenever the real package is on disk while the entry does not resolve —
    // a mocked or shimmed environment, not a broken install. `isMissingNextEntry`
    // narrows that: a missing INNER dependency names some other module, so it
    // still warns, which is the case actually worth reporting.
    if (
      process.env.NODE_ENV !== 'production' &&
      nextIsInstalled() &&
      !isMissingNextEntry(error)
    ) {
      console.warn(
        '[sindarian-ui] next is installed but next/link failed to load, so ' +
          'sidebar navigation falls back to full page loads. Original error:',
        error
      )
    }
    return null
  }
}
