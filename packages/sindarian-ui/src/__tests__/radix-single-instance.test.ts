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
const PACKAGE_DIR = resolve(__dirname, '../..')

/** A directory that owns the npm workspace this package belongs to. */
function isWorkspaceRoot(dir: string): boolean {
  const manifest = resolve(dir, 'package.json')
  if (!existsSync(manifest)) return false
  try {
    return 'workspaces' in JSON.parse(readFileSync(manifest, 'utf8'))
  } catch {
    return false
  }
}

/**
 * The install roots that belong to THIS repository: the package's own
 * `node_modules`, plus any hoisted ones up to and including the workspace root.
 *
 * The walk used to continue to the FILESYSTEM root, which made the result depend
 * on where the checkout happens to live. A stray `node_modules` in a parent
 * directory of the clone (`/srv/node_modules` on a build box, a developer's home
 * directory) got scanned as if it were ours: unrelated packages could report a
 * duplicate Radix version this package has no say over, and could satisfy the
 * "did we find anything" guard entirely on their own while our real tree went
 * unscanned.
 */
function installRoots(): string[] {
  const roots: string[] = []
  let dir = PACKAGE_DIR

  for (;;) {
    const candidate = resolve(dir, 'node_modules')
    if (existsSync(candidate)) roots.push(candidate)

    // The workspace root is the last install that is ours.
    if (isWorkspaceRoot(dir)) return roots

    const parent = dirname(dir)
    if (parent === dir) return roots
    dir = parent
  }
}

/**
 * The `@radix-ui/*` packages this package DECLARES. Derived from the manifest so
 * the guard cannot silently outdate itself — the previous `found.size > 20`
 * threshold was pinned to a transitive dependency count, so a legitimate Radix
 * update that merged or dropped one internal package would have failed this test
 * before the duplicate check it protects ever ran.
 */
function declaredRadixPackages(): string[] {
  const manifest = JSON.parse(
    readFileSync(resolve(PACKAGE_DIR, 'package.json'), 'utf8')
  )
  return Object.keys({
    ...manifest.dependencies,
    ...manifest.peerDependencies
  })
    .filter((name) => name.startsWith('@radix-ui/'))
    .sort()
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

  it('finds every @radix-ui package this package declares', () => {
    // Guards the guard: a silent zero-match walk would pass forever. Derived
    // from the manifest rather than a hard-coded count, so it tracks the tree.
    const declared = declaredRadixPackages()
    expect(declared.length).toBeGreaterThan(0)
    expect(declared.filter((name) => !found.has(name))).toEqual([])
  })

  it('resolves exactly one version of every @radix-ui package', () => {
    const duplicated = [...found]
      .filter(([, versions]) => versions.size > 1)
      .map(([name, versions]) => `${name}: ${[...versions].sort().join(', ')}`)
      .sort()

    expect(duplicated).toEqual([])
  })
})
