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
  } catch {
    return null
  }
}
