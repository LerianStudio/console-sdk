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

/** `H S% L%` or `#rrggbb` to sRGB in 0..1. The sheet carries both shapes: the
 * semantic tokens are bare HSL channels behind `hsl(var(--x))`, while the raw
 * palette scales (`--color-shadcn-*` and the named ramps) are flat hex in
 * `@theme`, which is what makes them theme-independent.
 *
 * Alpha is rejected: WCAG contrast for a translucent color depends on what sits
 * behind it, so it must be composited before it reaches this gate — a silent
 * strip would report a wrong ratio. */
function toRgb(declaration: string): [number, number, number] {
  if (declaration.includes('/')) {
    throw new Error(
      `alpha channels require composited contrast: ${declaration}`
    )
  }

  const hex = declaration.trim().match(/^#([0-9a-f]{6})$/i)
  if (hex) {
    return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16) / 255) as [
      number,
      number,
      number
    ]
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

/**
 * The five tinted-pill families paint `text-system-<family>-text` on
 * `bg-system-<family>-surface`. The `@theme inline` map used to hand the ink
 * out at 70% opacity, which dropped every pill to between 3.1:1 and 3.5:1 —
 * under AA — while the raw `--system-*-text` channels underneath were already
 * chosen to clear it. The opacity was the whole defect, so the gate is two
 * halves: the map must not dim the ink, and the resulting pair must clear AA.
 */
const SYSTEM_FAMILIES = ['success', 'alert', 'error', 'info', 'purple']

describe('system text tokens', () => {
  describe.each(SYSTEM_FAMILIES)('--color-system-%s-text', (family) => {
    it('is mapped at full opacity', () => {
      expect(themeInline).toMatch(
        new RegExp(
          `^\\s*--color-system-${family}-text:\\s*hsl\\(var\\(--system-${family}-text\\)\\);`,
          'm'
        )
      )
    })

    it.each(['light', 'dark'] as const)(
      'clears AA over its own surface in %s',
      (theme) => {
        const ratio = contrast(
          tokenValue(`system-${family}-text`, theme),
          tokenValue(`system-${family}-surface`, theme)
        )

        expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
      }
    )
  })
})

/**
 * The `-h1a` inks on the PLAIN grounds, which is a different pairing from the
 * one above: `--system-*-text` is measured against its own tinted surface,
 * because a pill brings its own fill. The `-h1a` ink is what a component reads
 * when there is no pill — a band glyph, a gauge figure, a copied-state check —
 * so the ground is the page or the card, and nothing else in this file measured
 * that.
 *
 * It is the destination of every site the kit-wide ban in
 * `__tests__/ink-classes.test.ts` moved, so the two gates are halves of one
 * rule: that file says the bare fill token is never ink, this one says the ink
 * it must be replaced with is readable. Without this, the ban could be
 * satisfied by a token that is no better.
 *
 * The bare fills are why the ban exists. As ink on `--card` in light they read
 * 1.78:1 (`--system-alert`), 3.35:1 (`--system-success`), 3.78:1
 * (`--system-error`), 5.20:1 (`--system-info`) and 5.39:1
 * (`--system-purple`). The alert one is under even the 3:1 floor a load-bearing
 * glyph answers to, and the two that clear AA in light drop to 4.14:1 and
 * 3.91:1 on the dark card.
 *
 * ALL FIVE FAMILIES, purple included. It was the one exception here, and it had
 * no measurement behind it: purple's `-h1a` is in fact the strongest of the
 * five (7.75:1 at its worst ground). The only thing the exception tracked was
 * that no site had been moved to it yet, which is the reason an exception rots.
 * The family list now matches the ban in `__tests__/ink-classes.test.ts` on
 * both sides.
 */
const H1A_GROUNDS = ['background', 'card']

describe('system h1a ink', () => {
  describe.each(SYSTEM_FAMILIES)('--system-%s-h1a', (family) => {
    describe.each(H1A_GROUNDS)('over --%s', (surface) => {
      it.each(['light', 'dark'] as const)(
        'clears AA for normal text in %s',
        (theme) => {
          const ratio = contrast(
            tokenValue(`system-${family}-h1a`, theme),
            tokenValue(surface, theme)
          )

          expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
        }
      )
    })
  })
})

/**
 * The tooltip is the kit's one INVERTED surface, and the only pair in this file
 * where neither half is a theme token: `--color-shadcn-600` is flat hex in
 * `@theme`, so the fill stays #27272A under both themes and the ink has to be
 * theme-independent with it. That rules out the obvious light inks —
 * `--primary-foreground` and `--background` both invert, and both land on
 * 1.00:1 against this fill in dark.
 *
 * Both halves are READ OUT OF THE COMPONENT rather than named here, so swapping
 * either class is re-measured instead of re-trusted, and the extraction
 * throwing is what guards the guard.
 */
function tooltipPair(): { fill: string; ink: string } {
  const source = readFileSync(
    resolve(__dirname, '..', 'components', 'ui', 'tooltip', 'index.tsx'),
    'utf8'
  )

  const content = source.match(
    /data-slot="tooltip-content"[\s\S]*?className=\{cn\(\s*'([^']+)'/
  )?.[1]
  if (!content) throw new Error('TooltipContent paints no class string')

  const pick = (prefix: string) => {
    const step = content.match(
      new RegExp(`(?<![\\w-])${prefix}-(shadcn-\\d+)(?![\\w-])`)
    )?.[1]
    if (!step) throw new Error(`TooltipContent paints no ${prefix}-shadcn-*`)

    const value = themeInline.match(
      new RegExp(`^\\s*--color-${step}:\\s*([^;]+);`, 'm')
    )?.[1]
    if (!value) throw new Error(`--color-${step} is undefined`)

    return value.trim()
  }

  return { fill: pick('bg'), ink: pick('text') }
}

describe('tooltip ink', () => {
  const { fill, ink } = tooltipPair()

  // One assertion, not one per theme: both halves are flat hex, so the pair
  // does not move between themes. Asserting it twice would only pretend to
  // measure something the values cannot express.
  it('clears AA for normal text on its own fill', () => {
    expect(contrast(ink, fill)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })

  // The pair is only theme-independent while BOTH halves are raw steps. A half
  // that resolved through `hsl(var(--x))` would invert with the theme and the
  // single assertion above would be measuring one theme and reporting two.
  it.each([
    ['fill', fill],
    ['ink', ink]
  ])('takes its %s from a theme-independent step', (_half, value) => {
    expect(value).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

/**
 * The destructive pair is the loudest fill in the kit: the Critical status
 * badge and every `variant="destructive"` button paint
 * `text-destructive-foreground` on `bg-destructive`, and the field/form error
 * messages paint `--destructive` as plain body ink on `--card`. The dark theme
 * was corrected to red/400 + red/950; light was left on red/500 with white,
 * which is 3.78:1 — under AA in both roles. Both roles are gated here, in both
 * themes, so a future hue tweak is re-measured rather than re-trusted.
 */
describe('destructive pair', () => {
  it.each(['light', 'dark'] as const)(
    'clears AA for its own foreground on its fill in %s',
    (theme) => {
      const ratio = contrast(
        tokenValue('destructive', theme),
        tokenValue('destructive-foreground', theme)
      )

      expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
    }
  )

  /**
   * `--destructive` is also read as plain body ink — the field error message
   * (`ui/field/index.tsx:219`), the form message (`ui/form.tsx:123`), the
   * upload error (`ui/file-upload/index.tsx:337`). A negative `MoneyText` was
   * on that list and left it: its sign ink is `--system-error-h1a` now, gated
   * just below.
   *
   * Dark `--card` is deliberately absent: red/400 on the dark container
   * surface measures 3.80:1, still under AA. That is NOT fixed by moving the
   * token — `ui/form.tsx:204` already records the kit's rule that error TEXT
   * belongs to `--system-error-text` and `--destructive` is the badge/fill
   * token, so the dark gap is a call-site drift to migrate, not a hue to
   * re-pick. Gating it here would freeze the wrong half of the pair.
   */
  it.each([
    ['light', 'card'],
    ['light', 'background'],
    ['dark', 'background']
  ] as const)('clears AA as body ink in %s over --%s', (theme, surface) => {
    const ratio = contrast(
      tokenValue('destructive', theme),
      tokenValue(surface, theme)
    )

    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
  })
})

/**
 * A negative amount is TEXT, so its sign color answers to the AA text floor on
 * whatever ground holds it. It used to be painted `text-destructive`, which is
 * the FILL family: dark red/400 reads 3.80:1 on `--card`, and an axe crawl of
 * a consumer console (br-sfn cockpit, `/slc/clearing`) found exactly that on
 * `.text-destructive.tabular-nums`. Three consoles had already routed around
 * it by hand rather than fixing the kit.
 *
 * The token is READ OUT OF THE COMPONENT rather than named here, so a future
 * edit that swaps the class is re-measured instead of silently escaping the
 * gate, and the extraction throwing is what guards the guard.
 */
const MONEY_TEXT_SOURCE = resolve(
  __dirname,
  '..',
  'domain',
  'money-text',
  'index.tsx'
)
const moneyText = readFileSync(MONEY_TEXT_SOURCE, 'utf8')

/** The token behind the `text-*` class MoneyText applies under `negative`. */
function signInkToken(): string {
  for (const line of moneyText.split('\n')) {
    if (!/\bnegative\s*&&/.test(line)) continue

    const ink = line.match(/'text-([\w-]+)'/)
    if (ink) return ink[1]
  }

  throw new Error('MoneyText applies no `text-*` class under `negative`')
}

describe('MoneyText sign ink', () => {
  const ink = signInkToken()

  describe.each(['card', 'background'])('over --%s', (surface) => {
    it.each(['light', 'dark'] as const)(
      'clears AA for normal text in %s',
      (theme) => {
        const ratio = contrast(
          tokenValue(ink, theme),
          tokenValue(surface, theme)
        )

        expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
      }
    )
  })

  // The fill token cannot come back through any other line either: a tinted
  // chip or a border on this component would reintroduce the same 3.80:1 ink.
  it('spends no `text-destructive` anywhere in the component', () => {
    expect(moneyText).not.toContain('text-destructive')
  })
})

/**
 * Text ink over the surfaces it is designed to sit on, both themes.
 *
 * This exists because the dark secondary ink shipped under AA to every console
 * on this library and was only caught by an axe crawl of a consumer (br-sfn
 * cockpit, 2026-09-06): `--muted-foreground` at base/400 read 4.09:1 on
 * `--container-surface` and 3.01:1 on `--muted`. Nothing in the kit measured
 * it, because the surrounding gates each own one narrow pairing (a toast fill,
 * a tinted pill, the destructive pair) and the plain body inks had none.
 *
 * Two shapes:
 *  - generic ink, read across the whole kit, gated against every generic
 *    surface a component actually puts it on;
 *  - ink that names its own surface, gated against that surface.
 *
 * Deliberate absences, each a call-site pairing rather than a value to re-pick,
 * so gating them would freeze the wrong half:
 *
 *  - `--muted-foreground` over `--accent`. Sunglow is not a surface this grey
 *    can be read on from either side: 1.67:1 in dark at base/400, 1.07:1 after
 *    the lift. The one call site that paired them, the open dropdown
 *    sub-trigger, now pairs `bg-accent` with `text-accent-foreground` instead
 *    (12.97:1 dark, 16.38:1 light), matching every other `bg-accent` in the
 *    kit. `__tests__/accent-ink-pairing.test.ts` keeps that pairing from
 *    regressing; the pair stays out of this gate because the answer is the ink
 *    the call site picks, not the value of `--muted-foreground`.
 *  - `--body-text` and `--container-text` over `--muted`. 3.98:1 in light, and
 *    clearing it would take five more notches off base/500, visibly darkening
 *    tabs, breadcrumbs and steppers. No component in THIS kit paints either
 *    token on that fill. That is not a clean bill for the fleet: a consumer
 *    that pairs them is a call-site fix on its side, and product-console's
 *    `extract-table.tsx:254` does exactly that (`bg-muted text-body-text`,
 *    3.98:1 light).
 *  - `--card-foreground` over `--muted`. 3.84:1 in light, but no kit component
 *    renders it there: the data table pins its own inks instead of inheriting
 *    this one (`ui/table/index.tsx:118` cells take `text-foreground`, `:91`
 *    heads take `text-muted-foreground`), so the hovered-row fill never sits
 *    under this token.
 */
const GENERIC_SURFACES = [
  'background',
  'card',
  'popover',
  'muted',
  'container-surface',
  'body-surface'
]

const WITHOUT_MUTED = GENERIC_SURFACES.filter((s) => s !== 'muted')

const GENERIC_INKS: Array<[string, string[]]> = [
  ['foreground', GENERIC_SURFACES],
  ['muted-foreground', GENERIC_SURFACES],
  ['body-title', GENERIC_SURFACES],
  ['container-title', GENERIC_SURFACES],
  ['body-text', WITHOUT_MUTED],
  ['container-text', WITHOUT_MUTED]
]

/**
 * Ink that names the surface it belongs to.
 *
 * `--input-placeholder` is deliberately NOT gated against `--input`. The field
 * paints no fill of its own (`ui/input/styles.css`: `.input-wrapper` is
 * border-only, `.input-base` is `bg-transparent`), so `--input` is a value
 * nothing renders and gating it would have measured a pair no user can see.
 * The hint sits on whatever ground contains the form, so it is gated against
 * `--body-surface` (the page ground) and `--background` (white in light).
 *
 * A form inside a Card sits on `--card`, so the hint is gated against it too:
 * dark `--input-placeholder` was base/400 and read 4.07:1 there, the same
 * defect at the same value as `--muted-foreground`, and it moved with it.
 */
const OWN_SURFACE_PAIRS: Array<[string, string]> = [
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['accent-foreground', 'accent'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['button-primary-text', 'button-primary-surface'],
  ['input-placeholder', 'body-surface'],
  ['input-placeholder', 'background'],
  ['input-placeholder', 'card']
]

describe('text ink over its surfaces', () => {
  const generic = GENERIC_INKS.flatMap(([ink, surfaces]) =>
    surfaces.map((surface) => [ink, surface] as [string, string])
  )

  describe.each([...generic, ...OWN_SURFACE_PAIRS])(
    '--%s on --%s',
    (ink, surface) => {
      it.each(['light', 'dark'] as const)(
        'clears AA for normal text in %s',
        (theme) => {
          const ratio = contrast(
            tokenValue(ink, theme),
            tokenValue(surface, theme)
          )

          expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT)
        }
      )
    }
  )
})

/**
 * Every animation the kit ships carries a `motion-safe:` variant, but that
 * variant only becomes `@media (prefers-reduced-motion: no-preference)` after
 * the CONSUMER compiles Tailwind over the kit's dist — a consumer whose content
 * globs miss a file, or who writes `animate-in` itself, gets no guard at all.
 * This sheet ships verbatim, so the floor belongs here: plain CSS, no variant,
 * no build step between it and the reader who asked the OS to stop moving
 * things.
 */
describe('reduced-motion floor', () => {
  const guard = css.match(
    /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/
  )?.[0]

  it('declares a plain-CSS reduce block', () => {
    expect(guard).toBeDefined()
  })

  // Plain attribute/substring selectors, not Tailwind variants: the point of
  // this block is to work without a Tailwind pass over the kit.
  it.each([
    "class\\*='animate-'",
    "\\[data-state='open'\\]",
    "\\[data-state='closed'\\]"
  ])('neutralises %s', (selector) => {
    expect(guard).toMatch(new RegExp(selector))
  })

  it('zeroes the animation rather than only shortening it', () => {
    expect(guard).toMatch(/animation:\s*none/)
  })
})

/**
 * The focus ring is a non-text indicator, so it answers to the 3:1 floor of
 * SC 1.4.11 against whatever it sits on, not to the 4.5:1 text floor.
 *
 * It shipped at base/400 for both themes, which reads 2.55:1 on white and
 * 2.33:1 on `--body-surface`: under the floor on every light ground, for the
 * one token that tells a keyboard user where they are. Two of the kit's own
 * focus treatments put the ring straight onto the page ground with nothing
 * between: `ui/input/styles.css` paints `border-ring` on `:focus-within` and
 * applies its ring at `ring-offset-0`.
 *
 * No single value clears both themes with margin, and none is a palette step.
 * base/500 fixes light (4.84:1 on white) and fails dark (2.16:1 on the
 * container surface); base/400 is the reverse. An off-scale 240 5% 57% does
 * clear 3:1 on all four grounds, but by 0.04 on two of them. So the value is
 * per theme, sitting at 4.4+ light and 4.0+ dark, and this gate measures each
 * one against the grounds a focused control actually sits on.
 *
 * `--muted` is left out on purpose: it is a disabled/skeleton fill, and
 * SC 1.4.11 exempts inactive controls. Gating it would freeze a pair no
 * focused element renders.
 */
const NON_TEXT_CONTRAST = 3

const FOCUS_GROUNDS = ['background', 'card', 'popover', 'body-surface']

describe('focus ring', () => {
  describe.each(FOCUS_GROUNDS)('over --%s', (surface) => {
    it.each(['light', 'dark'] as const)(
      'clears the non-text indicator floor in %s',
      (theme) => {
        const ratio = contrast(
          tokenValue('ring', theme),
          tokenValue(surface, theme)
        )

        expect(ratio).toBeGreaterThanOrEqual(NON_TEXT_CONTRAST)
      }
    )
  })

  // The themes disagree, so the dark block must carry its own declaration
  // rather than inherit: `tokenValue` falls back to `:root` silently, and that
  // fallback is exactly how the light-only value would slip back in.
  it('is declared separately in each theme', () => {
    expect(root).toMatch(/^\s*--ring:\s*\S/m)
    expect(dark).toMatch(/^\s*--ring:\s*\S/m)
  })
})
