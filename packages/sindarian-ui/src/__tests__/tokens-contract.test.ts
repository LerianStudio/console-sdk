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

  // The custom properties theme what we paint; `color-scheme` themes what the
  // user agent paints for us — form controls, scrollbars, the autofill overlay.
  // Without it those stay light under `.dark`, and no token can reach them.
  describe.each([
    ['light', root],
    ['dark', dark]
  ])('%s theme block', (scheme, scope: string) => {
    it(`declares color-scheme: ${scheme}`, () => {
      expect(scope).toMatch(new RegExp(`^\\s*color-scheme:\\s*${scheme};`, 'm'))
    })
  })

  describe.each(SENTINELS)('pre-existing %s', (token, value, scope: string) => {
    it(`still resolves to ${value}`, () => {
      const match = scope.match(new RegExp(`^\\s*${token}:\\s*([^;]+);`, 'm'))
      expect(match?.[1].trim()).toBe(value)
    })
  })
})

/**
 * A sonner toast paints ink on a solid token fill, so its legibility is decided
 * by two token values that live far apart in this file and are edited for
 * unrelated reasons. That already shipped broken twice — white ink measured
 * 3.35:1 on the light success fill — because the ratio was only ever computed
 * by hand, in a comment, at the moment of the edit.
 *
 * This reads the pairs out of the toast rules themselves rather than hardcoding
 * them, so swapping either the ink token or the fill token is re-measured, not
 * re-trusted.
 */
const AA_NORMAL_TEXT = 4.5

/** Resolve a token to its declared channels, following `var()` indirection. */
function tokenValue(name: string, theme: 'light' | 'dark'): string {
  const seen = new Set<string>()
  let current = name

  for (;;) {
    if (seen.has(current)) throw new Error(`token cycle at --${current}`)
    seen.add(current)

    const read = (scope: string) =>
      scope.match(new RegExp(`^\\s*--${current}:\\s*([^;]+);`, 'm'))?.[1].trim()

    // Dark only redefines what it changes; anything else it inherits from :root.
    const value = theme === 'dark' ? (read(dark) ?? read(root)) : read(root)
    if (!value) throw new Error(`--${current} is undefined in ${theme}`)

    const indirect = value.match(/^var\(--([\w-]+)\)$/)
    if (!indirect) return value
    current = indirect[1]
  }
}

/** `H S% L%` to sRGB in 0..1. Alpha is rejected: WCAG contrast for a
 * translucent color depends on what sits behind it, so it must be composited
 * before it reaches this gate — a silent strip would report a wrong ratio. */
function toRgb(declaration: string): [number, number, number] {
  if (declaration.includes('/')) {
    throw new Error(
      `alpha channels require composited contrast: ${declaration}`
    )
  }

  const [h, s, l] = declaration
    .trim()
    .split(/\s+/)
    .map((part) => parseFloat(part))

  if ([h, s, l].some(Number.isNaN)) {
    throw new Error(`not an hsl channel triplet: ${declaration}`)
  }

  const saturation = s / 100
  const lightness = l / 100
  const a = saturation * Math.min(lightness, 1 - lightness)
  const k = (n: number) => (n + h / 30) % 12
  const channel = (n: number) =>
    lightness - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))

  return [channel(0), channel(8), channel(4)]
}

/** WCAG 2.x relative luminance. */
function luminance(declaration: string): number {
  const [r, g, b] = toRgb(declaration).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  )

  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)

  return (hi + 0.05) / (lo + 0.05)
}

/** The token pair each toast type actually paints with, read from its rule. */
function toastPair(type: string): { fill: string; ink: string } {
  const rule = block(`[data-sonner-toast][data-type='${type}'] {`)
  const pick = (property: string) =>
    rule.match(new RegExp(`${property}:\\s*hsl\\(var\\(--([\\w-]+)\\)\\)`))?.[1]

  const fill = pick('--normal-bg')
  const ink = pick('--normal-text')
  if (!fill || !ink) throw new Error(`toast '${type}' has no token pair`)

  return { fill, ink }
}

const TOAST_TYPES = ['success', 'error', 'warning', 'info']

describe('sonner toast ink', () => {
  describe.each(TOAST_TYPES)('%s', (type) => {
    it.each(['light', 'dark'] as const)(
      'clears AA for body text in %s',
      (theme) => {
        const { fill, ink } = toastPair(type)
        const ratio = contrast(tokenValue(fill, theme), tokenValue(ink, theme))

        expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
      }
    )
  })
})
