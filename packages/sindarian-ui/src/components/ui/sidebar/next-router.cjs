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
    // installed but throwing on require is the silent downgrade this file's
    // header warns about: the Console drops to plain anchors and full page
    // loads with nothing anywhere saying why. Only the second one is worth a
    // word, and only in development.
    //
    // Both the code AND the message are checked because the resolvers disagree:
    // Node sets `code = 'MODULE_NOT_FOUND'`, while Jest's resolver throws a
    // plain Error with NO code and only "Cannot find module ..." to go on.
    // Checking the code alone made this warn on every test run — for the case
    // that is supposed to be silent.
    const missing =
      !error ||
      error.code === 'MODULE_NOT_FOUND' ||
      /Cannot find module/i.test(String(error.message))

    if (process.env.NODE_ENV !== 'production' && !missing) {
      console.warn(
        '[sindarian-ui] next is installed but next/link failed to load, so ' +
          'sidebar navigation falls back to full page loads. Original error:',
        error
      )
    }
    return null
  }
}
