# @lerianstudio/sindarian-tokens

The design tokens Lerian internal consoles are converging on: one neutral
colour ladder, in light and dark, gated at WCAG 2.2 AA.

## Why this package exists

The identity lives as ~40 CSS custom properties inside
`backoffice-console/apps/backoffice/src/app/globals.css`, with a hand-made copy
of the same values in `caradhras/ui/src/styles.css`. Two copies and no contract:
a palette tweak on either side diverges silently, and nothing measures either
one. This package is the intended single source for both — the values here are
the gated ones, and the contrast suite below is the contract those two copies
never had.

It is **not** the Lerian-yellow product identity in
`@lerianstudio/sindarian-ui`, which is a separate palette on purpose.

## Adoption status

The package is complete and published. **Neither console imports it yet.**
Consumer wiring was deliberately deferred until the package published, so both
still carry their own copy of the values:

| Console | Where its tokens live today | Imports this package |
| --- | --- | --- |
| `backoffice-console` | `apps/backoffice/src/app/globals.css` | no |
| `caradhras` | `ui/src/styles.css` | no |

Migrating a console means deleting that block and importing `tokens.css` as
shown under [Use](#use), minding the triplet-to-colour change described in
[Values are colours, not triplets](#values-are-colours-not-triplets). Until
that lands, read this README as the target, not as a description of what the
consoles currently render.

## Install

```bash
npm install @lerianstudio/sindarian-tokens
```

## Use

Tailwind v4 (CSS-first), which is what both consoles run — a Next app and a Vite
SPA import it identically:

```css
@import 'tailwindcss';
/* any component library that ships its own @theme goes here */
@import '@lerianstudio/sindarian-tokens/tokens.css';
```

Import order matters: `tokens.css` carries an `@theme inline` block, and the
last `@theme` mapping for a given slot wins. Putting it after the component
library is what makes the console adopt this identity rather than the library's
own.

Then use the ordinary Tailwind utilities — `bg-background`, `text-foreground`,
`text-muted-foreground`, `border-input`, `bg-destructive`, `rounded-lg` — and
toggle dark mode by putting `class="dark"` on `<html>`.

The `dark` variant is declared as `&:where(.dark, .dark *)`, which is the form
Tailwind v4 documents for a class-toggled dark mode. It matches both the element
carrying `.dark` and everything under it, so a `dark:` utility written on `<html>`
itself resolves — `&:is(.dark *)` matches descendants only and silently drops
that case. `:where()` also contributes no specificity, which keeps a `dark:`
utility level with the plain utility it overrides (source order decides, and
Tailwind emits variants last) instead of letting it outrank other variants such
as `hover:`.

### Export surface

| Entry | Contains | Needs Tailwind |
| --- | --- | --- |
| `@lerianstudio/sindarian-tokens/tokens.css` | `palette.css`, `--radius`, the `dark` custom variant, and the `@theme inline` mapping | yes |
| `@lerianstudio/sindarian-tokens/palette.css` | only the `:root` and `.dark` colour declarations | no |
| `@lerianstudio/sindarian-tokens` | `TOKEN_NAMES`, `THEMES`, `THEME_SELECTORS` for tooling and tests | no |

`palette.css` is for a consumer that already owns its `@theme` mapping and wants
only the values.

### Values are colours, not triplets

Each token holds a full colour (`--background: hsl(0 0% 100%)`), not the bare
triplet (`0 0% 100%`) that backoffice stored and re-wrapped at every use site.
The wrapper contract was implicit and unenforceable: forget it once and you get
an invalid colour, and the token could not be used in `color-mix()` or in plain
CSS. Consumers migrating from the triplet form must drop the `hsl(...)` wrapper
from any hand-written `hsl(var(--token))`.

## Accessibility

Eight values deviate from the backoffice originals so that every pair a console
composes clears its WCAG 2.2 AA floor — 4.5:1 for text (SC 1.4.3) and 3:1 for
the focus ring and the field boundary (SC 1.4.11). Each deviation is annotated
inline in `src/palette.css` with its before and after ratio.

`--border` and `--sidebar-border` are deliberately left below 3:1. SC 1.4.11
covers visual information required to identify a component or its state: a text
field's boundary qualifies, so `--input` is gated at 3:1; a card edge, a section
divider and a table rule do not, and shadcn paints `border-border` through a
global `*` reset, so raising it would put a mid-grey stroke on every element in
the product. They are measured against a visibility floor instead.

`src/tokens.contrast.test.ts` re-measures every pair on every `npm test`, with
no exemption list. If you change a value and a pair drops below its floor, fix
the value — the threshold is not the thing to move.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run build` | type-check and emit `dist`, copying the stylesheets |
| `npm run check-types` | type-check without emitting |
| `npm test` | run the contrast gate and the dark-variant check |
| `npm run lint` | ESLint with `--fix` |
