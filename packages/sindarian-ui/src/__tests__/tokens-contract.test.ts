import { readFileSync } from 'fs'
import { resolve } from 'path'

/**
 * Executable form of the senior rule: sindarian-ui's visual identity is frozen
 * for existing consumers, and the sindarian-x absorption only adds to it.
 *
 * Two halves:
 *  - the new (FC-2) token names must exist in `:root`, `.dark` and the
 *    `@theme inline` map, so ported components can rely on them;
 *  - a handful of pre-existing sentinel tokens must still carry their exact
 *    current values. Sentinels rather than a whole-file hash: a hash trips on
 *    every legitimate edit, sentinels only trip when someone rewrites the
 *    identity itself.
 */

const css = readFileSync(resolve(__dirname, '..', 'globals.css'), 'utf8')

/** Extract a brace-balanced block, given the text that opens it. */
function block(opener: string): string {
  const start = css.indexOf(opener)
  if (start === -1) throw new Error(`block not found: ${opener}`)

  let depth = 0
  for (let i = start + opener.length - 1; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0)
      return css.slice(start + opener.length, i)
  }
  throw new Error(`unbalanced block: ${opener}`)
}

const root = block(':root {')
const dark = block('.dark {')
const themeInline = block('@theme inline {')

const FC2_TOKENS = [
  'credit',
  'credit-foreground',
  'matched-surface',
  'unmatched-surface',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'chart-6',
  'chart-7',
  'chart-8'
]

/** Pre-existing values, copied verbatim. Changing one here is the whole point. */
const SENTINELS: Array<[string, string, string]> = [
  ['--primary', '240 4% 16%', root],
  ['--background', '0 0% 100%', root],
  ['--system-success', '142 76% 36%', root],
  ['--color-sunglow-500', '#edac05', themeInline],
  ['--radius', '0.5rem', root]
]

describe('design token contract', () => {
  describe.each(FC2_TOKENS)('--%s', (token) => {
    it('is defined in :root', () => {
      expect(root).toMatch(new RegExp(`^\\s*--${token}:\\s*\\S`, 'm'))
    })

    it('is defined in .dark', () => {
      expect(dark).toMatch(new RegExp(`^\\s*--${token}:\\s*\\S`, 'm'))
    })

    it('is mapped in @theme inline', () => {
      expect(themeInline).toMatch(
        new RegExp(
          `^\\s*--color-${token}:\\s*hsl\\(var\\(--${token}\\)\\)`,
          'm'
        )
      )
    })
  })

  // FC-2 semantics, not just presence. `--credit-foreground` MIRRORS `--credit`
  // (legacy contract: the red itself carries the role as text, so components
  // write `bg-credit/10` + `text-credit`, never a solid fill with contrasting
  // text). A foreground that drifts to white would silently turn every credit
  // reading unreadable on its own tinted surface.
  describe.each([
    ['light', root],
    ['dark', dark]
  ])('--credit-foreground in %s', (_theme, scope: string) => {
    it('mirrors --credit', () => {
      const read = (token: string) =>
        scope.match(new RegExp(`^\\s*--${token}:\\s*([^;]+);`, 'm'))?.[1].trim()

      const credit = read('credit')
      expect(credit).toBeDefined()
      expect(read('credit-foreground')).toBe(credit)
    })
  })

  describe.each(SENTINELS)('pre-existing %s', (token, value, scope: string) => {
    it(`still resolves to ${value}`, () => {
      const match = scope.match(new RegExp(`^\\s*${token}:\\s*([^;]+);`, 'm'))
      expect(match?.[1].trim()).toBe(value)
    })
  })
})
