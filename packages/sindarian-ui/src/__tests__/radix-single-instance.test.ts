import { existsSync, readFileSync, readdirSync } from 'fs'
import { dirname, resolve } from 'path'

/**
 * Every @radix-ui package must resolve to exactly ONE version in the install.
 *
 * Radix's shared internals — focus-scope, dismissable-layer, roving-focus and
 * friends — keep the stack of currently-active layers in MODULE scope. Two
 * copies of one of them means two independent stacks: opening a Select or
 * Popover inside a Dialog or Sheet sends focus bouncing between the layers
 * until the browser throws "Maximum call stack size exceeded". It reached
 * production, and the trigger was purely a resolution accident — this
 * package declaring one Radix component at a range that pinned an older
 * generation of internals than its neighbours.
 *
 * Nothing in the source can prevent that, so the guard lives here: the fix is
 * always to raise the lagging range in package.json until the tree agrees.
 */
/** Every `node_modules` from the package directory up to the filesystem root. */
function installRoots(): string[] {
  const roots: string[] = []
  let dir = resolve(__dirname, '../..')

  for (;;) {
    const candidate = resolve(dir, 'node_modules')
    if (existsSync(candidate)) roots.push(candidate)

    const parent = dirname(dir)
    if (parent === dir) return roots
    dir = parent
  }
}

function collectRadixVersions(dir: string, found: Map<string, Set<string>>) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }

  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue

    const path = resolve(dir, entry.name)

    // Scopes hold packages, not a package themselves.
    if (entry.name.startsWith('@')) {
      collectRadixVersions(path, found)
      continue
    }

    const manifest = resolve(path, 'package.json')
    if (existsSync(manifest)) {
      try {
        const { name, version } = JSON.parse(readFileSync(manifest, 'utf8'))
        if (typeof name === 'string' && name.startsWith('@radix-ui/')) {
          const versions = found.get(name) ?? new Set<string>()
          versions.add(version)
          found.set(name, versions)
        }
      } catch {
        // An unreadable manifest is npm's problem, not this test's.
      }
    }

    collectRadixVersions(resolve(path, 'node_modules'), found)
  }
}

describe('@radix-ui resolution', () => {
  const found = new Map<string, Set<string>>()

  beforeAll(() => {
    for (const root of installRoots()) collectRadixVersions(root, found)
  })

  it('finds the Radix packages this suite is meant to guard', () => {
    // Guards the guard: a silent zero-match walk would pass forever.
    expect(found.size).toBeGreaterThan(20)
  })

  it('resolves exactly one version of every @radix-ui package', () => {
    const duplicated = [...found]
      .filter(([, versions]) => versions.size > 1)
      .map(([name, versions]) => `${name}: ${[...versions].sort().join(', ')}`)
      .sort()

    expect(duplicated).toEqual([])
  })
})
