/**
 * Colour-contrast gate for the Lerian internal-console palette.
 *
 * This suite is the reason the palette lives in a package instead of in two
 * app stylesheets. It does not render: it reads the declarations out of
 * palette.css and computes WCAG 2.2 ratios directly, so every pair in both
 * themes is measured on every `npm test`, including pairs on screens that no
 * consumer has built yet.
 *
 * THERE IS NO RATCHET HERE, AND THAT IS THE POINT
 *
 * The gate this one replaces (caradhras `ui/src/styles.contrast.test.ts`)
 * carried a KNOWN_SHORTFALLS list freezing fourteen pairs at the ratios they
 * happened to measure, because fixing them meant changing a palette that lived
 * in someone else's app. The palette lives here now, so every pair is held to
 * its real WCAG floor and there is nothing to exempt. Do not reintroduce an
 * exemption list: lowering a floor to make a build green is the failure mode
 * this file exists to prevent.
 *
 * WHAT THIS GATE DOES NOT COVER — read before trusting it
 *
 *  - Alpha compositing. Consumers paint `bg-success/10`, `bg-muted/30` and
 *    similar tinted fills; a ratio against the flat token is not the ratio
 *    against the blend. Those need a rendered measurement.
 *  - Cascade and specificity. This reads the declared value, not the value that
 *    wins at a given node after a component library's own sheet and Tailwind
 *    utilities.
 *  - Text over images, gradients and shadows.
 *  - Font size and weight. WCAG relaxes to 3:1 for large text (>=18.66px bold /
 *    >=24px), but a colour token carries no size — the same
 *    `--muted-foreground` prints 12px captions and 24px numerals — so every
 *    text pair is held to the stricter 4.5:1.
 */
import {
  THEMES,
  contrastRatio,
  hexToRgb,
  hslToRgb,
  parseTokenSheet,
  readTokenSheet,
  resolveToken,
  tokenContrast,
  type Theme
} from './__tests__/contrast'
import { TOKEN_NAMES } from './index'

/**
 * WCAG 2.2 AA floors.
 *
 * `text` (SC 1.4.3, 4.5:1) applies to every foreground/surface pair.
 * `nonText` (SC 1.4.11, 3:1) applies to pairs that carry no glyphs but do carry
 * information required to identify a component or its state: the focus ring and
 * the field boundary.
 */
const THRESHOLDS = { text: 4.5, nonText: 3 } as const

type Kind = keyof typeof THRESHOLDS

type Pair = {
  fg: string
  bg: string
  kind: Kind
  /** Where this composition actually renders. */
  why: string
}

/**
 * Every foreground/background pair a console composes.
 *
 * Membership is evidence-based, not symmetrical: an `--x` / `--x-foreground`
 * slot earns a row only if something paints the fill solid. Note that
 * `--warning-foreground` is black while several siblings are white — a gate
 * that assumed a uniform near-white ink would measure white-on-amber (2.23:1)
 * and fail a pair that is in fact fine (9.41:1).
 */
const PAIRS: readonly Pair[] = [
  {
    fg: 'foreground',
    bg: 'background',
    kind: 'text',
    why: 'body copy on the page canvas'
  },
  {
    fg: 'card-foreground',
    bg: 'card',
    kind: 'text',
    why: 'body copy inside Card'
  },
  {
    fg: 'popover-foreground',
    bg: 'popover',
    kind: 'text',
    why: 'body copy inside Popover / DropdownMenu'
  },

  {
    fg: 'muted-foreground',
    bg: 'background',
    kind: 'text',
    why: 'page subtitles and helper text on the canvas'
  },
  {
    fg: 'muted-foreground',
    bg: 'card',
    kind: 'text',
    why: 'secondary text inside Card'
  },
  {
    fg: 'muted-foreground',
    bg: 'muted',
    kind: 'text',
    why: 'secondary text on a muted fill'
  },
  {
    fg: 'muted-foreground',
    bg: 'secondary',
    kind: 'text',
    why: 'secondary text on a secondary fill'
  },
  {
    fg: 'muted-foreground',
    bg: 'sidebar',
    kind: 'text',
    why: 'secondary text in the sidebar'
  },

  {
    fg: 'primary-foreground',
    bg: 'primary',
    kind: 'text',
    why: 'primary Button label'
  },
  {
    fg: 'secondary-foreground',
    bg: 'secondary',
    kind: 'text',
    why: 'secondary Button / Badge label'
  },
  {
    fg: 'accent-foreground',
    bg: 'accent',
    kind: 'text',
    why: 'hovered or selected row and menu item'
  },

  {
    fg: 'destructive-foreground',
    bg: 'destructive',
    kind: 'text',
    why: 'destructive Button / Badge label'
  },
  {
    fg: 'success-foreground',
    bg: 'success',
    kind: 'text',
    why: 'success Badge label'
  },
  {
    fg: 'warning-foreground',
    bg: 'warning',
    kind: 'text',
    why: 'warning Badge label — black ink, unlike some siblings'
  },
  { fg: 'info-foreground', bg: 'info', kind: 'text', why: 'info Badge label' },

  {
    fg: 'sidebar-foreground',
    bg: 'sidebar',
    kind: 'text',
    why: 'navigation item label'
  },
  {
    fg: 'sidebar-accent-foreground',
    bg: 'sidebar-accent',
    kind: 'text',
    why: 'active or hovered navigation item'
  },

  {
    fg: 'ring',
    bg: 'background',
    kind: 'nonText',
    why: 'focus ring on the canvas (SC 1.4.11)'
  },
  {
    fg: 'ring',
    bg: 'card',
    kind: 'nonText',
    why: 'focus ring inside Card (SC 1.4.11)'
  },
  {
    fg: 'ring',
    bg: 'sidebar',
    kind: 'nonText',
    why: 'focus ring in the sidebar (SC 1.4.11)'
  },

  {
    fg: 'input',
    bg: 'background',
    kind: 'nonText',
    why: 'Input / Textarea / Select boundary on the canvas (SC 1.4.11)'
  },
  {
    fg: 'input',
    bg: 'card',
    kind: 'nonText',
    why: 'field boundary inside Card (SC 1.4.11)'
  },
  {
    fg: 'input',
    bg: 'sidebar',
    kind: 'nonText',
    why: 'sidebar search field boundary (SC 1.4.11)'
  },
  {
    fg: 'input',
    bg: 'muted',
    kind: 'nonText',
    why: 'read-only field painted border-input over bg-muted (SC 1.4.11)'
  }
]

/**
 * Boundaries deliberately held BELOW the SC 1.4.11 floor, and why.
 *
 * SC 1.4.11 covers visual information required to identify user interface
 * components and their state. A text field's boundary qualifies: without it a
 * user cannot see where to click, so `--input` is gated at 3:1 above. A card
 * edge, a section divider and a table rule do not — they group content that is
 * already identifiable by the content itself, and shadcn paints `border-border`
 * through a global `*` reset, so raising it to 3:1 would put a mid-grey stroke
 * on every element in the product. That trades a deliberately light, airy
 * identity for a compliance number the criterion never asked for.
 *
 * These pairs are still measured, against a visibility floor rather than a WCAG
 * one: a decorative rule that cannot be seen at all is a bug of a different
 * kind. The completeness check below then guarantees no boundary token can be
 * quietly moved from the gated list into this one, which is the failure mode a
 * documented exception invites.
 */
const DECORATIVE: readonly Pair[] = [
  {
    fg: 'border',
    bg: 'background',
    kind: 'nonText',
    why: 'Card edge and Separator on the canvas'
  },
  {
    fg: 'border',
    bg: 'card',
    kind: 'nonText',
    why: 'boundary between nested surfaces'
  },
  {
    fg: 'sidebar-border',
    bg: 'sidebar',
    kind: 'nonText',
    why: 'sidebar separator'
  }
]

/**
 * A 1px rule below this ratio is invisible rather than subtle. It is a
 * legibility floor of this palette's own choosing, not a WCAG criterion.
 */
const DECORATIVE_VISIBILITY_FLOOR = 1.15

/**
 * Tokens that no pair measures, each with the reason it cannot be measured
 * here. The completeness test below requires every token to be in PAIRS,
 * DECORATIVE or this list, so a new token cannot enter the palette unmeasured
 * and unargued.
 */
const UNPAIRED: Readonly<Record<string, string>> = {
  'shadcn-100':
    'neutral ramp step; composed ad hoc by consumers, no fixed partner',
  'shadcn-200':
    'neutral ramp step; composed ad hoc by consumers, no fixed partner',
  'shadcn-300':
    'neutral ramp step; composed ad hoc by consumers, no fixed partner',
  'shadcn-400':
    'neutral ramp step; composed ad hoc by consumers, no fixed partner',
  'shadcn-500':
    'neutral ramp step; composed ad hoc by consumers, no fixed partner',
  'shadcn-600':
    'neutral ramp step; composed ad hoc by consumers, no fixed partner',
  'shadcn-700':
    'neutral ramp step; composed ad hoc by consumers, no fixed partner',
  'shadcn-800':
    'neutral ramp step; composed ad hoc by consumers, no fixed partner'
}

const sheet = readTokenSheet()

/**
 * Jest's `expect` takes no message argument, and a bare
 * `expect(1.25).toBeGreaterThanOrEqual(3)` tells a reviewer nothing about which
 * pair broke or what to do about it. Assertions below therefore compare an
 * explanation against null: on failure Jest prints the whole explanation as the
 * received value.
 */
function explainIf(failed: boolean, detail: string): string | null {
  return failed ? detail : null
}

describe('contrast instrument', () => {
  it('reproduces the WCAG reference extremes', () => {
    const black = [0, 0, 0] as const
    const white = [255, 255, 255] as const
    expect(contrastRatio(black, white)).toBeCloseTo(21, 5)
    expect(contrastRatio(white, white)).toBeCloseTo(1, 5)
    expect(contrastRatio(black, black)).toBeCloseTo(1, 5)
  })

  it('is order-independent', () => {
    const a = hslToRgb(0, 0, 44)
    const b = hslToRgb(0, 0, 100)
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10)
  })

  it('converts hsl() to the 8-bit triple a browser paints', () => {
    expect(hslToRgb(0, 0, 100)).toEqual([255, 255, 255])
    expect(hslToRgb(0, 0, 0)).toEqual([0, 0, 0])
    expect(hslToRgb(0, 0, 44)).toEqual([112, 112, 112])
    expect(hslToRgb(147, 75, 30)).toEqual([19, 134, 71])
    expect(hslToRgb(37, 95, 49)).toEqual([244, 153, 6])
  })

  it('converts hex to the same triple', () => {
    expect(hexToRgb('#f4f4f5')).toEqual([244, 244, 245])
    expect(hexToRgb('#fff')).toEqual([255, 255, 255])
  })

  /**
   * Pairs whose ratios were computed independently while choosing the palette.
   * If the arithmetic here ever drifts, these break before any palette
   * assertion does — a gate whose ruler is wrong is worse than no gate.
   */
  it.each([
    ['light', 'foreground', 'background', 19.8],
    ['light', 'muted-foreground', 'background', 4.95],
    ['light', 'primary-foreground', 'primary', 17.18],
    ['light', 'warning-foreground', 'warning', 9.41],
    ['dark', 'foreground', 'background', 18.97],
    ['dark', 'muted-foreground', 'background', 7.85],
    ['dark', 'primary-foreground', 'primary', 17.18]
  ] as const)(
    'agrees with the %s %s / %s ratio computed off-line',
    (theme, fg, bg, expected) => {
      expect(tokenContrast(sheet, theme, fg, bg)).toBeCloseTo(expected, 2)
    }
  )

  it('reads the hex ramp steps the palette declares alongside the hsl() tokens', () => {
    expect(resolveToken(sheet, 'light', 'shadcn-100')).toEqual([244, 244, 245])
    expect(resolveToken(sheet, 'dark', 'shadcn-800')).toEqual([250, 250, 250])
  })

  it('refuses a colour space it cannot measure instead of skipping the pair', () => {
    const oklch = parseTokenSheet(
      ':root { --foreground: oklch(0.2 0 0); } .dark { --foreground: hsl(0 0% 98%); }'
    )
    expect(() => resolveToken(oklch, 'light', 'foreground')).toThrow(
      /expected an hsl\(\) literal/
    )
  })

  it('refuses a token that is not declared instead of skipping the pair', () => {
    const partial = parseTokenSheet(
      ':root { --foreground: hsl(0 0% 4%); } .dark { --background: hsl(0 0% 4%); }'
    )
    expect(() => resolveToken(partial, 'dark', 'foreground')).toThrow(
      /not declared in the dark palette/
    )
  })

  it('refuses a stylesheet that declares a theme twice', () => {
    expect(() =>
      parseTokenSheet(
        ':root { --a: hsl(0 0% 0%); } .dark { --a: hsl(0 0% 0%); } :root { --a: hsl(0 0% 100%); }'
      )
    ).toThrow(/exactly one `:root` block/)
  })
})

describe('palette shape', () => {
  it.each(THEMES)(
    '%s declares exactly the tokens index.ts publishes',
    (theme: Theme) => {
      const declared = Object.keys(sheet[theme])
        .map((name) => name.replace(/^--/, ''))
        .sort()
      expect(declared).toEqual([...TOKEN_NAMES].sort())
    }
  )

  it('declares every token in both themes', () => {
    const light = Object.keys(sheet.light).sort()
    const dark = Object.keys(sheet.dark).sort()
    expect(
      explainIf(
        JSON.stringify(dark) !== JSON.stringify(light),
        `a token declared in one theme only silently falls back in the other. ` +
          `light: [${light.join(', ')}] dark: [${dark.join(', ')}]`
      )
    ).toBeNull()
  })

  it('measures or explicitly excuses every token', () => {
    const measured = new Set(
      [...PAIRS, ...DECORATIVE].flatMap((pair) => [pair.fg, pair.bg])
    )
    const unmeasured = TOKEN_NAMES.filter(
      (token) => !measured.has(token) && UNPAIRED[token] === undefined
    )
    expect(
      explainIf(
        unmeasured.length > 0,
        `every token must appear in a measured pair or carry a written reason in UNPAIRED — ` +
          `an unlisted token is a hole in the gate, not a passing token. Unlisted: ` +
          `[${unmeasured.join(', ')}]`
      )
    ).toBeNull()
  })

  it('excuses no token that a pair already measures', () => {
    const measured = new Set(
      [...PAIRS, ...DECORATIVE].flatMap((pair) => [pair.fg, pair.bg])
    )
    const stale = Object.keys(UNPAIRED).filter((token) => measured.has(token))
    expect(
      explainIf(
        stale.length > 0,
        `delete these from UNPAIRED — they are measured, so the excuse is dead: ` +
          `[${stale.join(', ')}]`
      )
    ).toBeNull()
  })

  it('keeps the gated and decorative boundary lists disjoint', () => {
    const gated = new Set(PAIRS.map((pair) => `${pair.fg}|${pair.bg}`))
    const overlap = DECORATIVE.filter((pair) =>
      gated.has(`${pair.fg}|${pair.bg}`)
    )
    expect(
      explainIf(
        overlap.length > 0,
        `a pair cannot be both held to SC 1.4.11 and excused from it: ` +
          `[${overlap.map((pair) => `${pair.fg} on ${pair.bg}`).join(', ')}]`
      )
    ).toBeNull()
  })
})

describe.each(THEMES)('%s palette contrast', (theme: Theme) => {
  it.each(PAIRS.map((pair) => [`${pair.fg} on ${pair.bg}`, pair] as const))(
    '%s clears its WCAG floor',
    (label, pair) => {
      const floor = THRESHOLDS[pair.kind]
      const ratio = tokenContrast(sheet, theme, pair.fg, pair.bg)
      expect(
        explainIf(
          ratio < floor,
          `${label} (${theme}) — ${pair.why}. WCAG requires ${floor}:1, measured ` +
            `${ratio.toFixed(2)}:1. Adjust the token in src/palette.css; do not relax the ` +
            `threshold and do not add an exemption list.`
        )
      ).toBeNull()
    }
  )
})

describe.each(THEMES)('%s decorative boundaries', (theme: Theme) => {
  it.each(
    DECORATIVE.map((pair) => [`${pair.fg} on ${pair.bg}`, pair] as const)
  )('%s stays visible', (label, pair) => {
    const ratio = tokenContrast(sheet, theme, pair.fg, pair.bg)
    expect(
      explainIf(
        ratio < DECORATIVE_VISIBILITY_FLOOR,
        `${label} (${theme}) — ${pair.why}. Held to a ${DECORATIVE_VISIBILITY_FLOOR}:1 ` +
          `visibility floor rather than SC 1.4.11's 3:1, because it identifies no component; ` +
          `measured ${ratio.toFixed(2)}:1, which is invisible.`
      )
    ).toBeNull()
  })
})
