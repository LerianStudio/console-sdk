// Guards the one property that makes the ESM build worth having: it must be
// real ES modules all the way down.
//
// A surviving `require()` in dist/esm is not a cosmetic slip. Node and every
// bundler resolve a `require` through the CommonJS half of a dependency's
// exports map, so a `require('react-hook-form')` inside an otherwise-ESM file
// loads a SECOND copy of that package next to the one the app imported — two
// module instances, two React context objects, and `useFormContext()`
// returning null across the boundary. The same split hits react, react-dom
// and every other peer.
//
// The two `.cjs` islands (next-router, countries) are the deliberate
// exceptions and are skipped: `.cjs` is CommonJS by extension in both output
// trees, so their `require` calls are correct rather than leaked.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ESM_DIR = 'dist/esm'
const REQUIRE_CALL = /\brequire\s*\(/

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

try {
  statSync(ESM_DIR)
} catch {
  console.error(`${ESM_DIR} is missing — run the ESM build first.`)
  process.exit(1)
}

const failures = []

const pkg = JSON.parse(readFileSync(join(ESM_DIR, 'package.json'), 'utf8'))
if (pkg.type !== 'module') {
  failures.push(`${ESM_DIR}/package.json must declare {"type":"module"}`)
}

for (const file of walk(ESM_DIR).filter((f) => f.endsWith('.js'))) {
  if (REQUIRE_CALL.test(readFileSync(file, 'utf8'))) {
    failures.push(`${file} contains a require() call`)
  }
}

if (failures.length > 0) {
  console.error('ESM output check failed:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log('ESM output check passed: no require() outside the .cjs islands.')
