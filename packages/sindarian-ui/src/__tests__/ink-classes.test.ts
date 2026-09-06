import { readdirSync, readFileSync } from 'fs'
import { join, relative, resolve } from 'path'

/**
 * Which TOKEN a component reaches for when it paints text.
 *
 * The contrast of each token pair is measured in `tokens-contract.test.ts`.
 * This file gates the other half of the same defect: a component that clears
 * the floor on paper and still ships unreadable, because the class it wrote
 * names a token chosen for a different job. Two families keep recurring.
 *
 * Scanning the SOURCE rather than a render, following the precedent in
 * `card/entity-card/entity-card.test.tsx`: these classes hide in branches,
 * variant maps and props that no single render reaches, and a class smuggled
 * into one of those still ships to consumers.
 */
const SRC = resolve(__dirname, '..')

/** Every component source in the kit. Tests and generated output excluded.
 *
 *  `.ts` is in the sweep with `.tsx` and `.css`. A class can be spelled in a
 *  plain module: a variant map, a token table, a `cva` config. A ban that only
 *  reads `.tsx` cannot see any of them. There are zero `.ts` hits today, which
 *  is the point: the first one trips the gate instead of shipping.
 *  `accent-ink-pairing.test.ts` already walks all three extensions. */
function sources(): string[] {
  return readdirSync(SRC, { recursive: true, encoding: 'utf8' })
    .filter((entry) => /\.(ts|tsx|css)$/.test(entry))
    .filter((entry) => !/\.(test|stories)\.tsx?$/.test(entry))
    .filter((entry) => !entry.startsWith('__tests__'))
    .map((entry) => join(SRC, entry))
}

/** Comments are prose, not paint: a note explaining why a component stopped
 *  using a class has to be free to name the class it stopped using. */
function paint(path: string): string {
  return readFileSync(path, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[^\n'"`]*\/\/.*$/gm, '')
}

function hits(pattern: RegExp): string[] {
  return sources()
    .filter((path) => pattern.test(paint(path)))
    .map((path) => relative(SRC, path))
}

/**
 * `--destructive` is the FILL token: it is the ground under
 * `--destructive-foreground` on the Critical badge and every destructive
 * button, and it is picked to carry white. Read as ink instead, dark red/400
 * measures 3.80:1 on the container surface, under the AA floor for text, and
 * seven components were reading it that way. The error TEXT token is
 * `--system-error-h1a`, which `FormMessage` and `MoneyText` already use.
 *
 * `text-destructive-foreground` is the other half of the fill pair and stays.
 */
describe('the destructive fill token', () => {
  it('is never used as text ink', () => {
    expect(hits(/(?<![\w-])text-destructive(?!-foreground)(?![\w-])/)).toEqual(
      []
    )
  })
})

/**
 * The placeholder has owned a token since `--input-placeholder` was lifted:
 * it is the one ink that has to stay legible while reading as a hint, and it
 * is positioned per theme for exactly that. Two triggers hard-coded the raw
 * palette step instead, which is 2.56:1 on white and answers to no theme.
 */
describe('the placeholder token', () => {
  it('is never bypassed for a raw palette step', () => {
    expect(hits(/placeholder:text-shadcn-\d/)).toEqual([])
  })
})

/**
 * The system FILL tokens, read as ink.
 *
 * `--system-success` and friends are the ground under `--system-*-foreground`
 * on a solid chip, and they are picked to carry white. Read as ink on the page
 * instead, they measure, in light, on `--card`:
 *
 *   --system-alert    1.78:1
 *   --system-success  3.35:1
 *   --system-error    3.78:1
 *   --system-info     5.20:1
 *   --system-purple   5.39:1
 *
 * The alert one is under even the 3:1 floor a load-bearing GLYPH answers to
 * (SC 1.4.11), which is how it was being spent: as the tint of the band icon
 * that carries the severity. Nine slots across five components read one of
 * these as ink — two gauges painting the tint on their `Figure` text, an aging
 * row painting it on the band glyph, and two confirmation checks.
 *
 * The `-h1a` inks are the replacement, gated against `--background` and
 * `--card` in both themes in `tokens-contract.test.ts`, so this ban cannot be
 * satisfied by a token that is no better.
 *
 * Kit-wide with NO exception list, because there is no ground in this kit where
 * the bare token is safe as ink: the worst of the five is under the non-text
 * floor on every light surface, and the two that clear AA in light, info and
 * purple, drop to 4.14:1 and 3.91:1 on the dark card.
 * `bg-system-*` fills are untouched — a fill answers to no text floor, and the
 * pattern this protects (`bg-system-success text-system-success-foreground`) is
 * exactly what a solid chip should paint.
 */
describe('the system fill tokens', () => {
  it('are never used as text ink', () => {
    // All five families. Purple was omitted while it had no defective site,
    // which is not a reason a ban can hold: `--system-purple` is 3.91:1 as ink
    // on the dark card like the rest of them, and its `-h1a` replacement is
    // gated in `tokens-contract.test.ts` with the other four.
    expect(
      hits(/(?<![\w-])text-system-(success|alert|error|info|purple)(?![\w-])/)
    ).toEqual([])
  })
})

/**
 * Prose ink from a raw palette step, KIT-WIDE.
 *
 * base/400 reads 2.56:1 on `--background` and 2.34:1 on `--body-surface`: it
 * has no theme counterpart and no contrast promise, and fifteen slots were
 * spending it — four on body copy, the rest on glyphs inside interactive
 * controls, which answer to the 3:1 floor of SC 1.4.11 and missed it too.
 *
 * ⛔ THIS WAS PER-SLOT AND THAT WAS THE HOLE. The narrow rule was written
 * because the step IS legitimate on one ground: a fixed-dark fill, where it
 * reads 5.81:1. But that exception is not visible from the class, so it did not
 * stay where it belonged — of the eight slots the per-slot version left alone,
 * six were on ordinary light grounds and only two were on the tooltip fill.
 * A ban with no exception list cannot leak that way: the two legitimate sites
 * moved one step to base/300, which is 10.08:1 on the same fill, and both are
 * measured as a pair in `tokens-contract.test.ts`.
 *
 * `--muted-foreground` is the kit's secondary ink (7.69:1 light, 6.36:1 dark on
 * `--card`) and is gated against every surface in `tokens-contract.test.ts`.
 * The per-slot cases below stay, because they assert the POSITIVE choice — the
 * ban says which token is wrong, not which is right.
 */
describe('the raw base/400 step', () => {
  it('is never used as text ink', () => {
    // The lookbehind admits a variant prefix, so `dark:text-shadcn-400` and
    // `hover:text-shadcn-400` are the same finding as the bare class.
    expect(hits(/(?<![\w-])text-shadcn-400(?![\w-])/)).toEqual([])
  })
})

const PROSE_SLOTS: Array<[string, string, string]> = [
  [
    'components/ui/form.tsx',
    'FormDescription',
    "className={cn('text-muted-foreground text-xs font-medium', className)}"
  ],
  [
    'components/card/entity-card/index.tsx',
    'EntityCardDescription',
    "className={cn('text-muted-foreground text-xs font-medium', className)}"
  ],
  [
    'components/card/entity-card/index.tsx',
    'EntityCardFooter',
    "'text-muted-foreground flex flex-col gap-2 text-xs font-medium',"
  ],
  [
    'components/entity-data-table/index.tsx',
    'EntityDataTableFooterText',
    "'text-muted-foreground text-sm leading-8 italic',"
  ]
]

describe('prose ink', () => {
  describe.each(PROSE_SLOTS)('%s / %s', (file, _slot, expected) => {
    const source = paint(resolve(SRC, file))

    it('reads the semantic secondary token', () => {
      expect(source).toContain(expected)
    })
  })

  // The matching "the old class is gone from this file" cases were folded into
  // the kit-wide ban above, which subsumes them: a slot repaired and then
  // reverted trips that rule from anywhere in `src`, and it cannot be satisfied
  // by a second copy of the old string sitting on a line the per-file
  // assertions did not read.
})

/**
 * The field border. `--input` is a SURFACE token and is white in light, so
 * `border-input` leaves a control with no visible edge next to the Input it
 * sits with (`enterprise/date-range-picker/index.tsx` records the same
 * finding). `--input-border` is the token for this edge, and it resolves to
 * the same step MultipleSelect was hard-coding, so the paint is unchanged and
 * the theme now owns it.
 *
 * Autocomplete drew the same edge and had the same defect from the other
 * direction: it named `border-input` and painted `bg-background` behind it, so
 * in light the border was white on white — the control had no edge at all,
 * next to an `Input` on the same form that does.
 *
 * These are the composed field triggers, the ones that have to sit beside a
 * plain `Input` and look like it. The `Input` itself is not listed: it paints
 * this edge from `components/ui/input/styles.css`, not from a class.
 */
const FIELD_TRIGGERS = [
  'components/ui/multiple-select/index.tsx',
  'components/ui/autocomplete/index.tsx'
]

describe.each(FIELD_TRIGGERS)('the field border in %s', (file) => {
  const source = paint(resolve(SRC, file))

  it('reads the field border token', () => {
    expect(source).toContain('border-input-border')
  })

  // Negative lookahead, or `border-input-border` would answer for
  // `border-input` and the assertion would pass on the defect it is here for.
  it('does not name the surface token instead', () => {
    expect(source).not.toMatch(/(?<![\w-])border-input(?![\w-])/)
  })

  it('names no raw palette step', () => {
    expect(source).not.toContain('border-shadcn-')
  })
})
