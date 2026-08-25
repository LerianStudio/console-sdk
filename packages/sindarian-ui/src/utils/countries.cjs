'use strict'

/**
 * The country/state dataset, loaded through CommonJS on purpose.
 *
 * A plain `import ... from './countries.json'` compiles fine, but Node's ESM
 * loader rejects it without an `with { type: 'json' }` attribute — and that
 * attribute cannot be written once for a dual build: TypeScript refuses it in
 * any file that compiles to a `require` call (TS2856). Since a JSON `require`
 * needs no attribute in either output, the one-line load lives here, in a
 * `.cjs` file that is CommonJS inside `dist/` and inside `dist/esm/` alike.
 *
 * Without this, `import '@lerianstudio/sindarian-ui'` throws
 * ERR_IMPORT_ATTRIBUTE_MISSING under any native-ESM consumer — Vitest, which
 * externalises ESM dependencies, being the one the apps actually hit.
 */
module.exports = require('../public/countries.json')
