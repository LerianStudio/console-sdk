import { readFileSync, readdirSync } from 'fs'
import { extname, join, resolve } from 'path'

/**
 * A fill that flips a row light must bring its own ink with it.
 *
 * Two fills in this package are painted under `text-muted-foreground`:
 *
 *  - `bg-accent` is sunglow in both themes (#FEED01 light, #FDCB28 dark). The
 *    kit's secondary grey cannot be read on it from either side: 1.67:1 in
 *    dark while `--muted-foreground` was base/400, 1.07:1 once it was lifted
 *    to clear the dark card.
 *  - `bg-shadcn-100` is the raw hex #F4F4F5 in `@theme inline` with NO dark
 *    variant, so it paints a near-white row in the dark theme too. The dark
 *    grey on it read 2.33:1 at base/400 and 1.50:1 after the lift.
 *
 * Both were live in `ui/dropdown-menu/index.tsx`: the sub-trigger flipped to
 * `bg-accent` when its submenu opened and to `bg-shadcn-100` on focus, the
 * label flipped to `bg-shadcn-100` on hover, and in all three the ink stayed
 * `text-muted-foreground`. The keyboard path was the worst of them, since
 * arrowing onto a sub-trigger paints the focus fill before the submenu opens.
 *
 * The rule is per variant, not per line, because one line can carry several
 * fills under different states and each state paints on its own: for every
 * prefix `v` under which one of these fills appears (`focus`, `hover`,
 * `data-[state=open]`, or no prefix at all) on a line whose base ink is
 * `text-muted-foreground`, `v:text-accent-foreground` must appear too.
 * `DropdownMenuItem` (`:82`) is the pattern this copies.
 *
 * Scoped to these two fills rather than "every fill needs accent ink", so it
 * carries no exception list to rot. Out of scope by construction, and
 * reportable rather than gated:
 *  - `ui/sidebar/sidebar-expand-button.tsx` paints `hover:bg-accent` with
 *    `text-shadcn-400`, and its only child icon overrides to `text-white` on
 *    hover. Different ink token, and an icon answers to the 3:1 non-text floor.
 *    That override is itself only 1.53:1 in dark, which is its own fix.
 *  - `ui/table/index.tsx` paints an active row `bg-accent/50`, an alpha fill
 *    that has to be composited before any ratio means anything.
 */
const SOURCE_DIR = resolve(__dirname, '..')
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.css']

/**
 * Fills that need accent ink under them. Matched as a whole class suffix, so
 * `bg-accent/50`, `bg-accent-mute` and `bg-accent-hover` are excluded by
 * construction rather than by an exception.
 */
const LIGHTENING_FILLS = ['bg-accent', 'bg-shadcn-100']
const BASE_MUTED_INK = 'text-muted-foreground'
const ACCENT_INK = 'text-accent-foreground'

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      return entry.name === 'node_modules' ? [] : sourceFiles(path)
    }
    if (!SOURCE_EXTENSIONS.includes(extname(entry.name))) return []
    if (/\.(test|stories)\.tsx?$/.test(entry.name)) return []

    return [path]
  })
}

/** Class strings are written one per line in this package, so a line is the unit. */
function classTokens(line: string): string[] {
  return line.split(/[\s'"`]+/).filter(Boolean)
}

/**
 * The variant prefix a class carries, given the utility it ends with:
 * `focus:bg-shadcn-100` -> `focus`, `bg-accent` -> `` (the base, no variant).
 */
function variantPrefix(token: string, utility: string): string {
  return token.slice(0, -utility.length).replace(/:$/, '')
}

/** Every (file, line, variant) a lightening fill is painted under. */
function fillSites(): Array<{
  file: string
  line: number
  variant: string
  tokens: string[]
}> {
  return sourceFiles(SOURCE_DIR).flatMap((file) =>
    readFileSync(file, 'utf8')
      .split('\n')
      .flatMap((text, index) => {
        const tokens = classTokens(text)

        return tokens.flatMap((token) => {
          const utility = LIGHTENING_FILLS.find((fill) => token.endsWith(fill))
          if (!utility) return []

          return [
            {
              file: file.slice(SOURCE_DIR.length + 1),
              line: index + 1,
              variant: variantPrefix(token, utility),
              tokens
            }
          ]
        })
      })
  )
}

/** The ink class that has to accompany a fill painted under `variant`. */
function requiredInk(variant: string): string {
  return variant ? `${variant}:${ACCENT_INK}` : ACCENT_INK
}

describe('accent ink pairing', () => {
  const sites = fillSites()

  it('finds the lightening fill call sites', () => {
    // Guards the guard: a walk that matches nothing would pass forever.
    expect(sites.length).toBeGreaterThan(0)
  })

  it('brings accent ink to every variant that paints a lightening fill', () => {
    const unpaired = sites
      .filter(({ tokens, variant }) => {
        if (!tokens.includes(BASE_MUTED_INK)) return false

        return !tokens.includes(requiredInk(variant))
      })
      .map(
        ({ file, line, variant }) =>
          `${file}:${line} needs ${requiredInk(variant)}`
      )

    expect(unpaired).toEqual([])
  })

  // The worked example: one line, two fills, two states, so it has to carry
  // both inks. This is the line the defect shipped on.
  it('pins both sub-trigger states to accent ink', () => {
    const subTrigger = sites.find(
      ({ variant }) => variant === 'data-[state=open]'
    )

    expect(subTrigger).toBeDefined()
    expect(subTrigger?.tokens).toContain(
      'data-[state=open]:text-accent-foreground'
    )
    expect(subTrigger?.tokens).toContain('focus:text-accent-foreground')
  })
})
