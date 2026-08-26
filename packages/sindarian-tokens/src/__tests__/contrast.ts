/**
 * WCAG contrast measurement over the colour tokens declared in palette.css.
 *
 * WHY MEASURE THE TOKENS RATHER THAN A RENDER
 *
 * The obvious alternative is axe-core over a mounted tree, and it does not
 * work: axe resolves contrast by rasterising the element stack onto a canvas,
 * jsdom has no canvas, so `color-contrast` lands in axe's `incomplete` bucket
 * while `toHaveNoViolations()` reads only `violations`. White on white passes
 * such a suite. The other alternative, a Playwright probe, only measures the
 * pairs the visited pages happen to paint — which would miss every status fill.
 *
 * Reading the declarations covers every pair in both themes on every run,
 * including pairs no consumer has built yet. What it does NOT cover is listed
 * in the header of tokens.contrast.test.ts; read that before trusting it.
 *
 * 8-BIT ROUNDING IS DELIBERATE
 *
 * `hslToRgb` rounds each channel before luminance, because a browser resolves
 * `hsl(0 0% 44%)` to `rgb(112, 112, 112)` and paints that — devtools and axe
 * both report the painted value. Unrounded arithmetic drifts from what a
 * reviewer sees in the browser.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { THEMES, THEME_SELECTORS, type Theme } from '../index'

export type Rgb = readonly [number, number, number]

export type TokenSheet = Record<Theme, Readonly<Record<string, string>>>

export { THEMES, THEME_SELECTORS }
export type { Theme }

/**
 * CSS `hsl()` -> the 8-bit sRGB triple a browser paints.
 *
 * Hue is normalised modulo 360 and the two percentages are clamped to [0, 100],
 * both because CSS Color 4 does exactly that before painting. Neither is
 * cosmetic. JavaScript's `%` keeps the sign of its left operand, so an
 * unnormalised `hsl(-120 75% 50%)` computed `[223, 32, 223]` — magenta — where
 * the browser paints `[32, 32, 223]`, blue. An unclamped `hsl(0 150% 50%)`
 * produced channels of 319 and -64, outside the range luminance is defined
 * over. In both cases the instrument returned a wrong colour and returned it
 * silently, which for a gate is the worst failure available: it does not break,
 * it lies.
 */
export function hslToRgb(h: number, s: number, l: number): Rgb {
  const hue = ((h % 360) + 360) % 360
  const sat = Math.min(Math.max(s, 0), 100) / 100
  const light = Math.min(Math.max(l, 0), 100) / 100
  const a = sat * Math.min(light, 1 - light)
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12
    return light - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))
  }
  return [
    Math.round(channel(0) * 255),
    Math.round(channel(8) * 255),
    Math.round(channel(4) * 255)
  ] as const
}

export function hexToRgb(hex: string): Rgb {
  const body = hex.slice(1)
  const full =
    body.length === 3
      ? body
          .split('')
          .map((c) => c + c)
          .join('')
      : body
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16)
  ] as const
}

/** WCAG 2.x relative luminance (sRGB, D65). */
export function relativeLuminance([r, g, b]: Rgb): number {
  const linear = [r, g, b].map((v) => {
    const c = v / 255
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }) as [number, number, number]
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
}

/**
 * WCAG 2.x contrast ratio, in [1, 21]. Order-independent by construction, so a
 * caller cannot get a wrong answer by passing foreground and background the
 * other way round.
 */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la]
  return (lighter + 0.05) / (darker + 0.05)
}

const HSL =
  /^hsl\(\s*(-?[\d.]+)(?:deg)?\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%\s*\)$/
const HEX = /^#(?:[\da-f]{3}|[\da-f]{6})$/i

/**
 * Parse one declaration value into the colour a browser paints.
 *
 * Throws rather than returning null. A token this gate asks for and cannot read
 * is a hole in the gate, and a hole must be loud — that covers the realistic
 * regressions (a token moved to `oklch()`, to a `var()` indirection, or given
 * an alpha channel), each of which would otherwise drop its pair silently.
 */
export function parseColor(value: string, context: string): Rgb {
  const raw = value.trim()
  const hsl = HSL.exec(raw)
  if (hsl) {
    const [h, s, l] = [Number(hsl[1]), Number(hsl[2]), Number(hsl[3])]
    // `[\d.]+` matches `1.2.3`, which `Number` turns into NaN. NaN survives the
    // whole pipeline — luminance, ratio, comparison — and `NaN < floor` is
    // false, so a malformed literal would turn the gate green rather than red.
    if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) {
      throw new Error(
        `${context}: "${raw}" parses to a non-numeric channel (h=${h}, s=${s}, l=${l}). ` +
          `A NaN here silences the gate instead of failing it.`
      )
    }
    return hslToRgb(h, s, l)
  }
  if (HEX.test(raw)) {
    return hexToRgb(raw)
  }
  throw new Error(
    `${context}: expected an hsl() literal or a hex colour this gate can measure, got "${raw}". ` +
      `If the palette moved to another colour space, teach src/__tests__/contrast.ts to read it — ` +
      `do not drop the pair from the gate.`
  )
}

/**
 * Pull the `:root` and `.dark` declaration blocks out of a stylesheet.
 *
 * Neither block nests, so a flat `selector { body }` scan suffices; blocks that
 * do nest never produce a chunk whose selector is exactly `:root` or `.dark`.
 * Comments are stripped first — palette.css carries long prose comments that
 * mention selectors and colour functions.
 *
 * Exactly one block per theme is required: two `:root` blocks would mean later
 * declarations silently win over the ones this gate measured.
 */
export function parseTokenSheet(css: string): TokenSheet {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const found: Record<string, Record<string, string>[]> = {
    ':root': [],
    '.dark': []
  }

  for (const [, selector = '', body = ''] of stripped.matchAll(
    /([^{}]*)\{([^{}]*)\}/g
  )) {
    const name = (selector.split(';').pop() ?? '').trim()
    const bucket = found[name]
    if (!bucket) continue
    const declarations: Record<string, string> = {}
    // CSS makes the final `;` of a block optional; requiring it dropped that
    // declaration from the sheet entirely.
    for (const [, token = '', value = ''] of body.matchAll(
      /(--[\w-]+)\s*:\s*([^;]+?)\s*(?:;|$)/g
    )) {
      declarations[token] = value.trim()
    }
    bucket.push(declarations)
  }

  const sheet = {} as Record<Theme, Record<string, string>>
  for (const theme of THEMES) {
    const selector = THEME_SELECTORS[theme]
    const blocks = found[selector] ?? []
    if (blocks.length !== 1) {
      throw new Error(
        `expected exactly one \`${selector}\` block in the stylesheet, found ${blocks.length}`
      )
    }
    sheet[theme] = blocks[0] as Record<string, string>
  }
  return sheet
}

export const PALETTE_PATH = join(__dirname, '..', 'palette.css')

export function readTokenSheet(path: string = PALETTE_PATH): TokenSheet {
  return parseTokenSheet(readFileSync(path, 'utf8'))
}

/**
 * Resolve a bare token name (`foreground`, not `--foreground`) to a colour.
 * A token missing from a theme throws: deleting a declaration does not break a
 * build, the slot just falls back to whatever the consuming component library
 * defines — unmeasured and unreviewed.
 */
export function resolveToken(
  sheet: TokenSheet,
  theme: Theme,
  token: string
): Rgb {
  const value = sheet[theme][`--${token}`]
  if (value === undefined) {
    throw new Error(
      `--${token} is not declared in the ${theme} palette (${THEME_SELECTORS[theme]}). ` +
        `Without a declaration the slot falls back to the consuming library's default, ` +
        `which this gate never sees.`
    )
  }
  return parseColor(value, `--${token} (${theme})`)
}

export function tokenContrast(
  sheet: TokenSheet,
  theme: Theme,
  fg: string,
  bg: string
): number {
  return contrastRatio(
    resolveToken(sheet, theme, fg),
    resolveToken(sheet, theme, bg)
  )
}
