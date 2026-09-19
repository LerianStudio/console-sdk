// Measures the two things a text field has to do at once, and shows that this
// rule set cannot currently do both.
//
//   1. SHRINK, so a row of a definite width that is too narrow for its
//      contents compresses instead of overflowing.
//   2. KEEP ITS WIDTH, so a wrapper sized BY ITS CONTENT — a search box in a
//      `flex gap-4` filter bar, the most common shape in the product console —
//      comes out as a field rather than as a 32px rectangle of padding.
//
// Both are decided by one quantity: the control's min-content contribution,
// which is what every ancestor's automatic minimum size is computed from. An
// `<input>` does not wrap, so its min-content and max-content sizes are the
// same number (~239px here, from the default `size=20`), and a declared
// `width` replaces both at once. `width: 0` therefore buys (1) by giving up
// (2) — measured on six product-console screens: five showed an empty chip at
// every viewport and the sixth, the template builder's name field, only at
// 390px — and `width: auto` buys (2) by giving up (1).
//
// A percentage width is the one value that separates them: it contributes its
// content's max-content size but ZERO min-content, so `width: 100%` keeps the
// field's width wherever there is room and still lets any ancestor compress
// it. That closes every fixture here except one — a content-sized wrapper
// UNDER PRESSURE, the same filter bar on a phone, where wanting the field to
// hold its width and wanting the row to fit are the same question with two
// answers. No candidate in CANDIDATES below closes all of them; the table is
// the evidence, and `--candidate` re-runs any row of it.
//
// `.input-base` carries NO min-width floor, and that is a measured decision
// rather than an omission. A floor in this rule set cannot protect the sites
// that need one: a consumer writing `.input-base` by hand tends to add its own
// `min-w-0`, which sits in Tailwind's `utilities` layer and outranks anything
// declared here in `components`. Measured with `min-w-16` in `.input-base`:
// the same fixture read 64px wide with the hand-written `min-w-0` removed and
// 32px wide with it present. Meanwhile the floor cost real ground elsewhere —
// two inputs sharing a 120px row went from fitting to overflowing by 52px
// (`min-w-16`) or 31px (`min-w-[6ch]`), and a floor small enough to survive
// that row (`min-w-4`, 64px) still leaves the filter bar at 32px of content.
//
// None of it is visible to jest: jsdom computes no layout, and these are CSS
// rules rather than utility classes on the element, so there is nothing to
// assert in the DOM either. This script is the layout check — run it when
// touching `.input-base`, `.input-wrapper` or `.select-trigger`.
//
//   node scripts/measure-input-shrink.mjs                  # table, exits 1 on any failure
//   node scripts/measure-input-shrink.mjs --json           # machine-readable
//   node scripts/measure-input-shrink.mjs --candidate=ID   # measure a rule set that is not committed
//   CHROME_BIN=/path/to/chrome node scripts/…              # non-default browser
//
// Needs a Chromium/Chrome binary; it is a manual tool, not a CI gate, because
// CI runners here carry no browser. It needs no build: the fixtures are plain
// markup carrying the same classes the components emit, which is also what the
// product console writes BY HAND. The fixtures cover three of the four sites;
// the fourth is the same shape on a textarea and is not modelled — its
// intrinsic width comes from `cols` rather than `size`, and it has two call
// sites (text block and comment block).
//
// IT EXITS 0 ON THE COMMITTED STYLESHEET AND STILL PRINTS FINDINGS — twelve of
// them as this is written. Every one is a check a fixture lists under `report`,
// meaning its repair lives in a consumer rather than in this package, and that
// list is the open work rather than a broken harness. A non-zero exit means an
// ENFORCED check failed, and the run says which. This paragraph used to claim
// the opposite: it was written when three of those checks were still enforced,
// and it outlived them.
//
// The absolute pixel numbers depend on the font — an input's intrinsic width
// is text-metric-derived, so the same fixture reads ~40px wider under a
// different stack. The harness therefore pins font-family and font-size below.
// Compare runs of THIS script; do not compare its numbers against a browser
// session that loaded the product's own webfont.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import tailwind from '@tailwindcss/postcss'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PKG = path.resolve(HERE, '..')
const CHROME = process.env.CHROME_BIN || '/usr/bin/chromium'
const JSON_OUT = process.argv.includes('--json')
const CANDIDATE =
  process.argv.find((a) => a.startsWith('--candidate='))?.slice(12) || 'shipped'

/** Pinned so runs are comparable. See the note above. */
const HARNESS_FONT = `font-family: Arial, Helvetica, sans-serif; font-size: 16px;`

const inputHtml = (probe, cls = '', wrapperCls = '') =>
  `<div data-probe="${probe}-box" class="input-wrapper input-wrapper-focus ${wrapperCls}">` +
  `<input data-probe="${probe}" class="input-base input-disabled input-read-only ${cls}" placeholder="Template name" value="1234567.89">` +
  `</div>`

const selectHtml = (probe, cls = '') =>
  `<button data-probe="${probe}" class="select-trigger select-read-only select-disabled ${cls}">` +
  `<span data-slot="select-value">BRL</span>` +
  `<svg class="select-chevron" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>` +
  `</button>`

/**
 * `InputField`/`SelectField` render their control inside `FormItem`, which is a
 * plain `space-y-2` block. In a filter toolbar that block is the flex ITEM, so
 * its width is the field's max-content contribution — the quantity `width: 0`
 * zeroes. Modelled separately from `inputHtml` because the intermediate box is
 * the whole mechanism of the toolbar fixtures.
 */
const formItemHtml = (probe, inner) =>
  `<div data-probe="${probe}-item" class="space-y-2">${inner}</div>`

/**
 * Candidate rule sets, appended UNLAYERED after the compiled stylesheet, so
 * they outrank `@layer components` whatever their source order. This is how
 * the trade between "shrink in a definite row" and "keep an intrinsic width in
 * a content-sized wrapper" was measured; re-run the table before re-opening
 * it rather than arguing from the spec.
 *
 * One run measures one candidate, so a whole table is a shell loop:
 *
 *   for c in width-0 width-auto input-min-w-0 auto-wrapper-min-w-0; do
 *     node scripts/measure-input-shrink.mjs --json --candidate=$c > /tmp/$c.json
 *   done
 *
 * EVERY CANDIDATE RESTATES THE WHOLE RULE SET, both properties on both boxes,
 * and the check below refuses one that does not. A candidate that only
 * declared what it wanted to CHANGE measured the committed stylesheet with a
 * redundant line on top the moment the committed stylesheet grew a
 * declaration of its own: after `min-width: 0` landed on both boxes, every
 * `width`-only override silently became a no-op and ten rows of the table
 * printed the shipped rule's numbers under another rule's name.
 */
const CANDIDATES = {
  /** What the stylesheet declares today. No override. */
  shipped: '',
  /** 2.0.0-beta.10: the input declares `width: 0`, neither box a min-width. */
  'width-0': `.input-wrapper { min-width: auto; } .input-base { width: 0px; min-width: auto; }`,
  /** 2.0.0-beta.9 and earlier: no declared width and no min-width anywhere. */
  'width-auto': `.input-wrapper { min-width: auto; } .input-base { width: auto; min-width: auto; }`,
  /** Lower only the input's own floor, keep its intrinsic contribution. */
  'input-min-w-0': `.input-wrapper { min-width: auto; } .input-base { width: 100%; min-width: 0; }`,
  /** The same, plus the wrapper's own automatic minimum removed. */
  'wrapper-min-w-0': `.input-wrapper { min-width: 0; } .input-base { width: 100%; min-width: 0; }`,
  /** …and the FormItem box between a toolbar row and the wrapper. */
  'form-item-min-w-0': `.input-wrapper { min-width: 0; } .space-y-2 { min-width: 0; } .input-base { width: 100%; min-width: 0; }`,
  /** Carry the default width as a shrinkable flex basis instead of a width. */
  'flex-basis-len': `.input-wrapper { min-width: auto; } .input-base { width: 0px; min-width: 0; flex: 1 1 17.5rem; }`,
  /** Same idea, letting the control's own content supply the basis. */
  'flex-basis-content': `.input-wrapper { min-width: auto; } .input-base { width: 0px; min-width: 0; flex: 1 1 content; }`,
  /** Clip instead of floor: an overflow other than visible also zeroes a flex item's automatic minimum. */
  'wrapper-overflow-hidden': `.input-wrapper { min-width: auto; overflow: hidden; } .input-base { width: 100%; min-width: 0; }`,
  /** Size the control from its own value/placeholder rather than `size=20`. */
  'field-sizing-content': `.input-wrapper { min-width: auto; } .input-base { width: 100%; min-width: 0; field-sizing: content; }`,
  /** Containment, for completeness: it removes the contents from the wrapper's own sizing. */
  'wrapper-contain': `.input-wrapper { min-width: auto; contain: inline-size; } .input-base { width: 100%; min-width: 0; }`,
  /** Is the declared `width: 100%` load-bearing next to `min-width: 0`? */
  'auto-min-w-0': `.input-wrapper { min-width: auto; } .input-base { width: auto; min-width: 0; }`,
  /** A floor that yields to its container rather than flooring it. */
  'min-clamp': `.input-wrapper { min-width: auto; } .input-base { width: 100%; min-width: min(12rem, 100%); }`,
  /** A floor small enough that a crushed field still shows a caret. */
  'floor-4rem': `.input-wrapper { min-width: auto; } .input-base { width: 100%; min-width: 4rem; }`,
  /** The same idea one box out, so a consumer's `min-w-0` cannot outrank it. */
  'wrapper-floor-2_5rem': `.input-wrapper { min-width: 2.5rem; } .input-base { width: 100%; min-width: 0; }`,
  /** What this package ships, restated as an override so the table has its row. */
  'auto-wrapper-min-w-0': `.input-wrapper { min-width: 0; } .input-base { width: auto; min-width: 0; }`,
  /** Is `min-width: 0` load-bearing next to a percentage width, or does the percentage do it alone? */
  'width-100-only': `.input-wrapper { min-width: auto; } .input-base { width: 100%; min-width: auto; }`,
  /** …and the same question for the input half of the shipped arm. */
  'wrapper-only-auto': `.input-wrapper { min-width: 0; } .input-base { width: auto; min-width: auto; }`
}

/**
 * An override that cannot undo what the stylesheet declares measures the
 * stylesheet. Two guards, because each catches what the other cannot.
 *
 * Structural, run on every invocation and cheap: a candidate must set both
 * `width` and `min-width` on `.input-base`, and `min-width` on
 * `.input-wrapper`. Add a declaration to either rule set and this list is what
 * forces the candidates to grow with it.
 */
function assertCandidateIsComplete(id) {
  const css = CANDIDATES[id]
  if (!css) return

  const block = (selector) =>
    css.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
  // `min-width` ends in `width`, so anchor on what precedes the property.
  const declares = (body, property) =>
    new RegExp(`(^|[;{\\s])${property}\\s*:`).test(body)

  const missing = []
  if (!declares(block('.input-base'), 'width'))
    missing.push('width on .input-base')
  if (!declares(block('.input-base'), 'min-width'))
    missing.push('min-width on .input-base')
  if (!declares(block('.input-wrapper'), 'min-width'))
    missing.push('min-width on .input-wrapper')

  if (missing.length) {
    console.error(
      `candidate "${id}" is incomplete and would measure the committed ` +
        `stylesheet instead of itself: no ${missing.join(', no ')}. ` +
        `Every candidate restates the whole rule set.`
    )
    process.exit(2)
  }
}

/**
 * Behavioural, run after the browser: the two candidates the table is read
 * against have to reproduce the defects they are named for. `width-0` is
 * 2.0.0-beta.10, which emptied both filter bars; `width-auto` is beta.9, whose
 * control could not be compressed by a caller's column even after that column
 * asked. A run where those findings are absent is a run whose overrides did
 * not reach the page.
 *
 * A FIXTURE NAMED HERE MUST BE SILENT UNDER THE COMMITTED RULE SET, because
 * the check is satisfied by any finding on it, from `failures` or `reported`
 * alike. `width-auto` used to name `two-up-200`, which stopped discriminating
 * the moment that fixture began reporting its own row and column overflow: an
 * inert override would have found those findings waiting, passed the proof and
 * printed the committed stylesheet's numbers under beta.9's name — the exact
 * false pass this check exists to refuse. Verify a new entry by running the
 * committed rule set and confirming the fixture produces nothing.
 *
 * `two-up-200-caller-min-w-0` is the discriminating sibling: the committed rule
 * set fits that row with 46px of text and prints nothing, while `width-auto`
 * overflows it by 48px and paints 152px across the neighbouring column.
 */
const CANDIDATE_MUST_FIND = {
  'width-0': ['toolbar-803', 'toolbar-390'],
  'width-auto': ['two-up-200-caller-min-w-0']
}

/**
 * Each fixture is a flex row of a fixed width, and every check it runs is a
 * failure unless the fixture says otherwise:
 *
 *   minContent  px of content box the fields must keep (default 8: a field
 *               narrower than its own padding shows no placeholder and no
 *               caret position — a rectangle, not a field). 0 disables it.
 *   report      checks whose findings are printed but never failed on —
 *               'row' (the row overflows), 'escape' (something paints outside
 *               its own box), 'content' (the floor above). Use it only where
 *               the repair lives in the consumer, and say so in the note.
 *   scroller    the row is framed in a box of `width` that scrolls
 *               horizontally, and the row itself is sized by its content.
 *               Models a filter bar on a phone; 'row' is not checked.
 */
const FIXTURES = [
  {
    id: 'two-up-200',
    width: 200,
    // The row overflows, and that is the rule set's deliberate open edge. This
    // package declares no width, so the control contributes its intrinsic size
    // and a caller's `flex-1` column that has NOT said it may shrink refuses
    // to. The caller's one token closes it, measured in
    // `two-up-200-caller-min-w-0`. The alternative rule sets that close it here
    // instead do so by making the field disappear somewhere else.
    //
    // The row check is REPORTED rather than failed, and it was demoted in the
    // commit that shipped this rule set — one of two demotions there, the other
    // being the content floor on `builder-header-390`. Both are checks this
    // rule set fails, so read exit 0 as "every check that is still enforced",
    // and read the two notes for why the repair is a consumer's. Here it is
    // that the shape does not occur: M8 measured the real
    // `/midaz/transactions/create` at 390px and read 180/148 on beta.9 and on
    // beta.10 alike, because that screen stacks before it gets this narrow.
    // The columns are probed, so the overflow is stated in the units a reader
    // can act on — how far each column ends up outside the row — rather than
    // as a scrollWidth the note has to translate. Their escape is reported for
    // the same reason the row is: it is the same fact seen from the other end,
    // and the repair is the caller's.
    report: ['row', 'escape'],
    note: 'console transaction screen: amount + asset, each in a caller flex-1 column that has not said it may shrink. At head the row overflows 200px by 138px, the first column ends 57px outside it and the second 138.13px, while the field keeps 239px of box and 207px of text inside its column.',
    row: 'flex gap-2',
    html:
      `<div data-probe="amount-col" class="flex-1">${inputHtml('amount')}</div>` +
      `<div data-probe="asset-col" class="flex-1">${selectHtml('asset')}</div>`
  },
  {
    id: 'direct-200',
    width: 200,
    note: 'same two controls as direct flex children, no caller column',
    row: 'flex gap-2',
    html: inputHtml('amount') + selectHtml('asset')
  },
  {
    id: 'two-up-200-caller-min-w-0',
    width: 200,
    // The escape hatch a consumer is told to use, measured rather than
    // asserted: `min-w-0` on the consumer's OWN flex item, which is the
    // standard flexbox idiom for "this column may shrink below its contents".
    // It works only if the control inside has no automatic minimum of its own,
    // so this fixture is what proves the kit left the hatch usable.
    // Columns probed here too, and NOT reported: the pair only says anything
    // if the same measurement runs on both sides of the repair, and on this
    // side both columns must sit inside the row.
    note: "the same two controls, with `min-w-0` on the caller's own column — the one-token way a consumer asks for compression. Both columns stay inside the row.",
    row: 'flex gap-2',
    html:
      `<div data-probe="amount-col" class="min-w-0 flex-1">${inputHtml('amount')}</div>` +
      `<div data-probe="asset-col" class="min-w-0 flex-1">${selectHtml('asset')}</div>`
  },
  {
    id: 'two-inputs-120',
    width: 120,
    // Geometry stress, not a product shape: at 120px two fields SHOULD be
    // down to a few pixels of content. Only "does it fit" is asserted here.
    minContent: 0,
    note: 'two inputs sharing a very narrow row (geometry stress, not a real screen)',
    row: 'flex gap-2',
    html: inputHtml('left') + inputHtml('right')
  },
  {
    id: 'two-up-800',
    width: 800,
    note: 'desktop width: must be unaffected by any shrink rule',
    row: 'flex gap-2',
    html:
      `<div class="flex-1">${inputHtml('amount')}</div>` +
      `<div class="flex-1">${selectHtml('asset')}</div>`
  },
  {
    id: 'toolbar-803',
    width: 803,
    // The most common layout in the product console: a filter bar where the
    // field is `InputField` inside `flex … gap-4`, so the flex item is the
    // kit's own `FormItem` block and NOTHING declares a width. The item is
    // therefore sized by the field's max-content contribution, at every
    // viewport — the desktop row has room to spare and still collapsed.
    minContent: 200,
    note: 'product-console filter toolbar (flowker providers/workflows, pix claims/infractions/refund-requests): InputField + SelectFields in `flex gap-4`, nothing declaring a width',
    row: 'flex gap-4',
    html:
      formItemHtml('search', inputHtml('search')) +
      formItemHtml('type', selectHtml('type', 'w-40')) +
      formItemHtml('status', selectHtml('status', 'w-40'))
  },
  {
    id: 'toolbar-390',
    width: 326,
    minContent: 200,
    // The same toolbar on a phone. The row lives in a horizontally scrollable
    // container there, and on 2.0.0-beta.9 it measured 560px inside a 326px
    // box: the fields keep their width and the bar scrolls. That overflow is
    // the console's existing choice, so the fixture frames the row in a
    // scroller and asserts only what belongs to the kit — the field keeps a
    // usable content box and paints nothing across its neighbours.
    scroller: true,
    note: 'the same toolbar at a 390px viewport, inside the horizontally scrollable filter bar',
    row: 'flex grow gap-4',
    html:
      formItemHtml('search', inputHtml('search')) +
      formItemHtml('type', selectHtml('type', 'w-40')) +
      formItemHtml('status', selectHtml('status', 'w-40'))
  },
  {
    id: 'builder-header-390',
    width: 390,
    // Everything reported. Two separate consumer-side facts meet here: the row
    // overflows 390px on its own, because the tab strip beside the field is
    // `whitespace-nowrap`, before and after any kit change; and the `w-48`
    // wrapper gives up its declared width because nothing told it not to. Both
    // are repaired by the same token on that wrapper, `shrink-0`, which the
    // console has written — `builder-header-390-shrink-0` measures it and DOES
    // enforce the floor. Kept unrepaired here so the blast radius of a change
    // to this rule set stays visible on the shape as the console last shipped
    // it.
    //
    // The content floor is REPORTED here, and it was demoted in the commit that
    // shipped this rule set (the other demotion is the row check on
    // `two-up-200`). What that hides is a real trade against beta.10 on this
    // shape and it belongs in the open: beta.10 held this wrapper at 50px with
    // 32px of chip, and this rule set lets it fall to 18px, so the control
    // paints 23px outside it. The repaired fixture is where the floor is
    // enforced, because `shrink-0` is what the console ships.
    report: ['row', 'escape', 'content'],
    minContent: 120,
    note: 'product-console template builder header, written by hand: a w-48 wrapper in a gap-3 row (builder-header.tsx). The row also overflows 390px on its own, before and after any kit change, because the tab strip beside it is whitespace-nowrap; that half needs `shrink-0` on the wrapper console-side.',
    row: 'flex shrink-0 items-center gap-3 p-3',
    html:
      inputHtml('name', 'min-w-0', 'w-48') +
      selectHtml('format', 'w-28') +
      // `.tabs-trigger` is whitespace-nowrap, so this block's min-content is
      // its full label run and it refuses to shrink. Everything the row has to
      // give comes out of the input beside it — which is the whole point of
      // this fixture.
      `<div data-probe="tabs" class="tabs w-auto"><div class="tabs-list">` +
      ['Visual', 'Code', 'Preview']
        .map((t) => `<button class="tabs-trigger">${t}</button>`)
        .join('') +
      `</div></div>`
  },
  {
    id: 'tracer-filter-390',
    width: 262,
    // The shape a caller writes when it DOES declare what it wants: a floor,
    // a ceiling and a share of the row. Measured on /tracer/rules and
    // /tracer/limits at a 390px viewport, where 2.0.0-beta.9 kept the control
    // at its intrinsic 286px inside a 200px box — 95px of it painted across
    // the button beside it. Nothing here may paint outside its own box again.
    // The row overflows by 17px in every arm, and that is the caller's own
    // arithmetic: a 200px floor plus a button that will not wrap does not fit
    // 262px. Reported, not failed. What IS failed here is the control leaving
    // its box, because that is the one the kit decides.
    report: ['row'],
    note: 'product-console tracer filters: a `max-w-sm min-w-[200px] flex-1` column, i.e. a caller that declares its own floor and ceiling. Its 200px floor and the nowrap button beside it overflow 262px on their own, in every arm.',
    row: 'flex items-center justify-between gap-4',
    html:
      `<div class="relative max-w-sm min-w-[200px] flex-1">${inputHtml('filter')}</div>` +
      // Scenery, not a subject: it is here to squeeze the column, and it is
      // left unprobed so the row's own overflow does not read as the kit's.
      `<div class="shrink-0 whitespace-nowrap">New rule</div>`
  },
  {
    id: 'builder-header-390-shrink-0',
    width: 390,
    // The same header with the console-side repair applied: one token on the
    // wrapper saying the field does not give up space. Measured, not assumed —
    // it is the answer to "what must a consumer still do" for every rule set
    // that lets a squeezed wrapper compress.
    report: ['row', 'escape'],
    minContent: 120,
    note: 'the template builder header with `shrink-0` on its w-48 wrapper (the console-side repair). The row still overflows 390px, as it did before any kit change, because of the nowrap tab strip.',
    row: 'flex shrink-0 items-center gap-3 p-3',
    html:
      inputHtml('name', 'min-w-0', 'w-48 shrink-0') +
      selectHtml('format', 'w-28') +
      `<div data-probe="tabs" class="tabs w-auto"><div class="tabs-list">` +
      ['Visual', 'Code', 'Preview']
        .map((t) => `<button class="tabs-trigger">${t}</button>`)
        .join('') +
      `</div></div>`
  },
  {
    id: 'palette-header-390',
    width: 390,
    // The palette is NOT another `w-48` wrapper around a plain input, which is
    // what this fixture used to model — it is the console wrapping the kit's
    // `CommandInput`, so two things sit between the wrapper and the control
    // that no other fixture here has: an intermediate box, and a 16px search
    // glyph with an 8px margin that is `shrink-0` and takes its 24px before
    // the control is offered anything.
    //
    // It also answers a different question, because `CommandInput` declares
    // `w-full` on the control itself. That is a utility, so it outranks this
    // package's rule set whatever the rule set declares: the palette is on the
    // percentage arm in every candidate, and the row is here to show that a
    // change to `.input-base` does not move it.
    note: 'product-console command palette (search-command-palette.tsx): the kit CommandInput inside a hand-written w-48 input-wrapper, with the glyph and the intermediate box the component renders. The control declares w-full itself.',
    row: 'flex shrink-0 items-center gap-3 p-3',
    html:
      `<div data-probe="search-box" class="input-wrapper input-wrapper-focus w-48">` +
      // The console zeroes this box's border and padding from the wrapper,
      // through two `**:data-[slot=command-input-wrapper]:` variants. Modelled
      // as the box those leave behind rather than as the pair of competing
      // class lists, so the fixture does not measure Tailwind's ordering.
      `<div data-probe="cmd-box" class="flex items-center">` +
      `<svg class="mr-2 h-4 w-4 shrink-0 opacity-50" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/></svg>` +
      // The control's class list as `cn` resolves it: the console's `h-full`
      // and `py-0` replace the component's `h-11` and `py-3`, and `w-full`
      // survives from the component.
      `<input data-probe="search" class="input-base flex h-full w-full rounded-md bg-transparent py-0 text-sm outline-hidden" placeholder="Search" value="1234567.89">` +
      `</div></div>` +
      selectHtml('org', 'w-40') +
      selectHtml('ledger', 'w-40')
  },
  {
    id: 'width-utilities-360',
    width: 360,
    // max-w-12 clamps on purpose, so a narrow content box is the point.
    minContent: 0,
    note: 'consumer width classes on the input itself, to show which of them the flex algorithm still honours',
    row: 'flex gap-2',
    html: inputHtml('maxw12', 'max-w-12') + inputHtml('w32', 'w-32')
  },
  {
    id: 'org-form-390',
    width: 258,
    // Everything reported, nothing enforced, and not because it is unimportant
    // — because no rule in this package reaches it. The console's organization
    // form puts its fields inside a card whose padding survives a phone, in a
    // two-column row that does not stack, so the FIELD BOX is 43px before the
    // kit is consulted. Measured on 2.0.0-beta.9 the control painted 232px
    // across its neighbours; on beta.10 it showed 0px of content instead.
    // Both are unusable and both are the console's layout to fix. The fixture
    // exists so a change to this rule set cannot look clean here by accident.
    report: ['row', 'escape', 'content'],
    note: 'product-console organization form at 390px: a `grow space-y-6` column crushed to 154px by a column that will not stack, with a padded card inside it leaving the field box 43px. Out of scope for this package — the repair is the console stacking that row.',
    row: 'mb-16 flex gap-6',
    html:
      // `overflow-hidden` on the column is why it shrinks to 154px at all: it
      // zeroes the column's automatic minimum, so the field box comes out at
      // 42px whatever the control would have contributed. Measured on the real
      // screen at 154px and 43px, on both 2.0.0-beta.9 and beta.10. Only the
      // field's own chain is modelled here; the real card overflows that row
      // by a further 140px with content this fixture does not carry.
      `<div data-probe="left-col" class="grow space-y-6 overflow-hidden"><div class="p-14">` +
      inputHtml('orgname') +
      `</div></div>` +
      `<div data-probe="right-col" class="w-20 shrink-0 whitespace-nowrap">Avatar</div>`
  },
  {
    id: 'dialog-grid-390',
    width: 154,
    // Informational, and deliberately so. The console's create dialogs lay
    // their fields in a two-column grid that does not stack on a phone, so
    // inside a 154px card each column is 43px — a definite width, decided
    // two boxes above the kit. 50 fields on 18 routes look like this at
    // 390px, and none at 1440px.
    //
    // There is no correct number for the kit to hit here. Filling a definite
    // 43px box IS the right behaviour for a control: 2.0.0-beta.9 painted its
    // intrinsic 234px of text across the dialog instead, which was legible
    // only by being in the wrong place. So every check is reported, the row
    // exists to show what each candidate does to the shape, and the repair is
    // the console stacking that grid.
    report: ['row', 'escape', 'content'],
    note: 'product-console create dialogs at 390px: a `grid grid-cols-2` inside a 154px card, so each field box is 43px. Out of scope — filling a definite 43px box is correct; the repair is the console stacking the grid.',
    row: 'grid grid-cols-2 gap-5 p-6',
    html:
      formItemHtml('left', inputHtml('ledgername')) +
      formItemHtml('right', inputHtml('ledgercode'))
  },
  {
    id: 'number-input-squeezed',
    width: 160,
    // The other composer in this package that puts a box of its own between a
    // row and the wrapper: `NumberInput` holds the field in a `w-28` div
    // between two 40px steppers. The root is the consumer's flex item, reached
    // through `className`, so nothing here says this control may compress and
    // the row overflows — the same deliberate open edge as `two-up-200`, and
    // reported for the same reason. What IS this package's to get right is
    // where the space comes from once a consumer does say it, which is the
    // fixture below.
    report: ['row'],
    note: 'this package NumberInput in a 160px row: a w-28 box between two size-10 steppers, all in an inline-flex with gap-1. Nothing declares that it may compress, so it overflows by 40px.',
    row: 'flex',
    html:
      `<div class="inline-flex items-stretch gap-1">` +
      `<button class="icon-button-base icon-button-disabled shrink-0"><span></span></button>` +
      `<div data-probe="numbox" class="w-28 min-w-0">` +
      inputHtml('amount', 'text-right tabular-nums') +
      `</div>` +
      `<button data-probe="plus" class="icon-button-base icon-button-disabled shrink-0"><span></span></button>` +
      `</div>`
  },
  {
    id: 'number-input-squeezed-caller-min-w-0',
    width: 160,
    // The same composer with the token its consumer owns: `className` lands on
    // the root, so `min-w-0` there is the consumer saying the control may
    // compress. The two tokens inside decide where the space then comes from,
    // and this fixture is why they are there. Without them the `w-28` box is a
    // definite width and refuses to give, so the entire shrink came out of the
    // steppers: measured at 20px each, half a tap target, while the field kept
    // its full 112px. With them the field gives — 54px of box, 22px of text —
    // and the steppers stay 40px. Enforced, not reported: this one is ours.
    note: 'the same NumberInput with min-w-0 on its root, the token a consumer writes through className. The field gives, the steppers keep their 40px.',
    row: 'flex',
    html:
      `<div class="inline-flex min-w-0 items-stretch gap-1">` +
      `<button class="icon-button-base icon-button-disabled shrink-0"><span></span></button>` +
      `<div data-probe="numbox" class="w-28 min-w-0">` +
      inputHtml('amount', 'text-right tabular-nums') +
      `</div>` +
      `<button data-probe="plus" class="icon-button-base icon-button-disabled shrink-0"><span></span></button>` +
      `</div>`
  },
  {
    id: 'sheet-right-390',
    width: 390,
    // This package's OWN panel, and the only fixture here that is not a
    // consumer's arithmetic. `sheetVariants` sizes it `w-2/5 p-12` and carries
    // no phone breakpoint, so at a 390px viewport the panel is 156px wide with
    // 59px of content and a form field inside it comes out 41px wide with 9px
    // of text. Measured across the arms: 2.0.0-beta.9 painted 189px of the
    // control across the panel edge here, beta.10 and this rule set both give
    // the same 41/9. So the rule set is not what makes this panel unusable on
    // a phone — the missing breakpoint is, and that is a Sheet defect, not an
    // input one. Everything is reported for that reason, and the numbers are
    // here so the breakpoint can be measured when someone adds it.
    report: ['row', 'escape', 'content'],
    note: 'the right-side SheetContent panel this package ships, at a 390px viewport: `w-2/5 p-12` with no phone breakpoint, so the panel leaves 59px of content and the field inside it 9px of text. The repair is a breakpoint on the Sheet.',
    row: 'flex',
    html:
      // The class list `SheetContent` actually emits, which is not the one its
      // source reads: the content class asks for `px-8 pb-0` and `cn` drops
      // both, tailwind-merge resolving `p-12` from `sheetVariants` as the
      // conflicting shorthand. Verified with `twMerge` on the three lists the
      // component passes. The cascade never sees the padding question.
      //
      // `fixed inset-y-0 right-0` is deliberately not carried over: it would
      // take the panel out of the row and measure it against the window. What
      // is modelled here is the panel's box, which is what the field is inside.
      `<div data-probe="panel" class="flex max-h-screen w-2/5 flex-col gap-4 overflow-x-auto border-l p-12">` +
      formItemHtml('sheetfield', inputHtml('sheetname')) +
      `</div>`
  }
]

/**
 * Default content floor: a field narrower than its own horizontal padding
 * shows no placeholder and no caret position — a rectangle, not a field. A
 * fixture raises it with `minContent` where the screen needs a usable field
 * rather than a visible one, and sets it to 0 for deliberate geometry stress.
 */
const READABLE_CONTENT_PX = 8

const floorOf = (f) =>
  f.minContent === undefined ? READABLE_CONTENT_PX : f.minContent
const reports = (f, check) => (f.report || []).includes(check)

const body = FIXTURES.map((f) => {
  const frame = 'outline:1px dashed #f0f'
  // A scroller fixture models a filter bar on a phone: the row keeps its
  // content width and the bar scrolls under it, so the row gets no declared
  // width and the box around it does.
  const row = f.scroller
    ? // `display:flex` on the scroller is what lets the row be wider than the
      // box: the row is `grow`, so it is a flex ITEM here exactly as it is in
      // the console, and its automatic minimum keeps it at its content width
      // while the box scrolls. A plain block scroller would pin the row to the
      // box's width instead and the fields would be measured under pressure
      // that the real screen does not apply.
      `<div style="width:${f.width}px;overflow-x:auto;display:flex;${frame}">` +
      `<div data-case="${f.id}" class="${f.row}">${f.html}</div></div>`
    : `<div data-case="${f.id}" class="${f.row}" style="width:${f.width}px;${frame}">${f.html}</div>`

  return (
    `<section><h2 style="font:12px/1.6 monospace;margin:16px 0 4px">${f.id} — ${f.width}px` +
    `${f.scroller ? ' (scrolls)' : ''}</h2>${row}</section>`
  )
}).join('\n')

const harnessHtml = (css) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style>` +
  `<style>body{margin:0;padding:16px;background:#fff;${HARNESS_FONT}}</style>` +
  `</head><body>${body}</body></html>`

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'input-shrink-'))
const htmlPath = path.join(tmp, 'harness.html')

// Tailwind v4 generates only the utilities it finds in scanned sources, and
// the harness page is generated at run time, so a class appearing ONLY in a
// fixture would resolve to nothing and that fixture would measure a rule which
// was never emitted. Two independent routes prevent it: this explicit
// `@source`, and Tailwind's own scan of the package, which reaches the fixture
// class names in THIS file. Verified separately — excluding this file from the
// scan still generates everything, and only removing both routes trips the
// check below. Do not read that redundancy as "the @source line is spare": it
// is the one that survives this script moving out of the package.
fs.writeFileSync(htmlPath, harnessHtml(''))
const entry = `@import './src/globals.css';\n@source '${htmlPath}';\n`
const { css } = await postcss([tailwind()]).process(entry, {
  from: path.join(PKG, 'measure-entry.css')
})
if (!(CANDIDATE in CANDIDATES)) {
  console.error(
    `unknown candidate "${CANDIDATE}"; one of: ${Object.keys(CANDIDATES).join(', ')}`
  )
  process.exit(2)
}
assertCandidateIsComplete(CANDIDATE)
// Appended INTO `@layer components`, where this package's own rule set lives:
// later in the same layer, so it replaces the committed rule, and still under
// `@layer utilities`, so a caller's `w-32` or `w-full` outranks the candidate
// exactly as it outranks the shipped rule. Unlayered — which is what this line
// used to do — outranks every layer, so a candidate silently beat the width
// utility the fixture was there to measure: `width-utilities-360` and the
// command palette both read the candidate's width where the real cascade gives
// the caller's.
fs.writeFileSync(
  htmlPath,
  harnessHtml(
    css +
      (CANDIDATES[CANDIDATE]
        ? `\n@layer components { ${CANDIDATES[CANDIDATE]} }`
        : '')
  )
)

// A fixture whose utility was never emitted compares a rule against its own
// absence and passes for the wrong reason — the false pass this script exists
// to have eliminated. So it FAILS the run, in both output modes, rather than
// printing a warning that `--json` would swallow.
const preflight = []
for (const cls of ['max-w-12', 'w-32']) {
  if (!css.includes(`.${cls.replace(/([:[\]/.])/g, '\\$1')}`)) {
    const message =
      `utility .${cls} was not generated, so the width-utilities-360 fixture ` +
      `measured nothing; check the @source line above still resolves and that ` +
      `this script still sits inside the scanned package`
    preflight.push(message)
    if (!JSON_OUT) console.warn(`warning: ${message}`)
  }
}

const port = 9500 + (Number(process.env.PORT_OFFSET) || 0)
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'input-shrink-chrome-'))
const chrome = spawn(CHROME, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1200,900',
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${port}`,
  'about:blank'
])
chrome.on('error', (e) => {
  console.error(`cannot start ${CHROME}: ${e.message}`)
  console.error('set CHROME_BIN to a Chromium or Chrome binary')
  process.exit(2)
})
chrome.stderr.on('data', () => {})

async function waitFor(fn, ms = 20000) {
  const t0 = Date.now()
  for (;;) {
    try {
      return await fn()
    } catch (e) {
      if (Date.now() - t0 > ms) throw e
      await new Promise((r) => setTimeout(r, 150))
    }
  }
}

const version = await waitFor(async () => {
  const r = await fetch(`http://127.0.0.1:${port}/json/version`)
  if (!r.ok) throw new Error('devtools not ready')
  return r.json()
})
const ws = new WebSocket(version.webSocketDebuggerUrl)
await new Promise((res, rej) => {
  ws.onopen = res
  ws.onerror = rej
})
let seq = 0
const pending = new Map()
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data)
  const entry = pending.get(msg.id)
  if (!entry) return
  pending.delete(msg.id)
  if (msg.error) entry.rej(new Error(JSON.stringify(msg.error)))
  else entry.res(msg.result)
}
const send = (method, params = {}, sessionId) =>
  new Promise((res, rej) => {
    const id = ++seq
    pending.set(id, { res, rej })
    ws.send(JSON.stringify({ id, method, params, sessionId }))
  })

const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
const { sessionId } = await send('Target.attachToTarget', {
  targetId,
  flatten: true
})
const evaluate = (expression) =>
  send(
    'Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise: true },
    sessionId
  ).then((r) => {
    if (r.exceptionDetails)
      throw new Error(JSON.stringify(r.exceptionDetails.exception))
    return r.result.value
  })

await send('Page.enable', {}, sessionId)
await send('Page.navigate', { url: 'file://' + htmlPath }, sessionId)
await waitFor(async () => {
  if ((await evaluate('document.readyState')) !== 'complete')
    throw new Error('loading')
})
await evaluate(
  'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))'
)

const measured = await evaluate(`(() => {
  const round = (n) => Math.round(n * 100) / 100
  return [...document.querySelectorAll('[data-case]')].map((row) => {
    const rect = row.getBoundingClientRect()
    return {
      id: row.dataset.case,
      declared: round(rect.width),
      scrollWidth: row.scrollWidth,
      overflow: Math.max(0, row.scrollWidth - Math.ceil(rect.width)),
      probes: [...row.querySelectorAll('[data-probe]')].map((el) => {
        const b = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        const padding = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
        const border = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth)
        const box = el.parentElement.getBoundingClientRect()
        return {
          name: el.dataset.probe,
          tag: el.tagName.toLowerCase(),
          width: round(b.width),
          // What is left for text after padding and border. Zero means the box
          // shows nothing at all, however wide it looks.
          content: round(Math.max(0, b.width - padding - border)),
          // Both edges. A right-edge-only probe reads zero on every shape that
          // pushes the control the other way: a row that justifies its items
          // to the end, and every one of these fixtures mirrored into RTL,
          // which is this page with the axis reversed. The rule set is
          // direction-agnostic; a probe that only looks right is not.
          // (No backticks in this comment — it lives inside a template
          // literal, and one would end the string.)
          escapes: round(Math.max(0, b.right - box.right)),
          escapesLeft: round(Math.max(0, box.left - b.left))
        }
      })
    }
  })
})()`)

ws.close()
chrome.kill('SIGTERM')
try {
  fs.rmSync(profile, { recursive: true, force: true })
  fs.rmSync(tmp, { recursive: true, force: true })
} catch {
  // Chromium can still be releasing its profile; the OS reaps /tmp anyway.
}

const byId = Object.fromEntries(measured.map((m) => [m.id, m]))
const failures = [...preflight]
const reported = []

for (const f of FIXTURES) {
  const m = byId[f.id]
  if (!m) {
    failures.push(`${f.id}: fixture did not render`)
    continue
  }
  // A check a fixture lists under `report` is printed and listed, never failed
  // on: the repair for it lives in the consumer, and the fixture's note says
  // which one.
  const sink = (check) => (reports(f, check) ? reported : failures)
  const floor = floorOf(f)

  // A scroller fixture has no row width to overflow — the box around it
  // scrolls by design.
  if (!f.scroller && m.overflow > 0)
    sink('row').push(
      `${f.id}: row overflows by ${m.overflow}px (scrollWidth ${m.scrollWidth} vs ${m.declared})`
    )
  for (const p of m.probes) {
    if (p.escapes > 0)
      sink('escape').push(
        `${f.id}: ${p.name} paints ${p.escapes}px outside its own box, past the right edge`
      )
    if (p.escapesLeft > 0)
      sink('escape').push(
        `${f.id}: ${p.name} paints ${p.escapesLeft}px outside its own box, past the left edge`
      )
    if (floor > 0 && p.tag === 'input' && p.content < floor)
      sink('content').push(
        `${f.id}: ${p.name} has ${p.content}px of content box (needs >= ${floor}); ` +
          (p.content < READABLE_CONTENT_PX
            ? 'the field collapsed to its own padding'
            : 'the field is too narrow to use')
      )
  }
}

// The structural guard above reads the candidate's text; this one reads the
// browser. A complete override can still measure the committed stylesheet —
// wrong cascade layer, an `@source` that stopped resolving, a selector the
// stylesheet renamed — and the only proof that it reached the page is that the
// defect it is named for came back. A missing finding here is never a passing
// candidate, it is a run that measured something else.
const missingProof = (CANDIDATE_MUST_FIND[CANDIDATE] || []).filter(
  (id) => ![...failures, ...reported].some((f) => f.startsWith(`${id}:`))
)

if (JSON_OUT) {
  console.log(
    JSON.stringify(
      {
        candidate: CANDIDATE,
        css: CANDIDATES[CANDIDATE],
        measured,
        failures,
        reported
      },
      null,
      2
    )
  )
} else {
  if (CANDIDATE !== 'shipped')
    console.log(`candidate ${CANDIDATE}: ${CANDIDATES[CANDIDATE]}`)
  for (const f of FIXTURES) {
    const m = byId[f.id]
    const reportedChecks = f.report || []
    console.log(
      `\n${f.id}  (${f.width}px)` +
        (reportedChecks.length
          ? `   [${reportedChecks.join('+')} reported only — consumer-side]`
          : '')
    )
    console.log(`  ${f.note}`)
    console.log(
      f.scroller
        ? `  row: ${m.declared} wide inside a ${f.width}px scroller`
        : `  row: scrollWidth ${m.scrollWidth} vs ${m.declared} declared` +
            (m.overflow ? `  OVERFLOW ${m.overflow}px` : '  fits')
    )
    for (const p of m.probes)
      console.log(
        `    ${p.name.padEnd(12)} <${p.tag.padEnd(6)}> width ${String(p.width).padEnd(8)}` +
          ` content ${String(p.content).padEnd(8)}` +
          (p.escapes ? ` ESCAPES-RIGHT ${p.escapes}px` : '') +
          (p.escapesLeft ? ` ESCAPES-LEFT ${p.escapesLeft}px` : '')
      )
  }
  console.log('')
  if (reported.length) {
    console.log(
      `REPORTED (${reported.length}) — known consumer-side, not this package's to fail on`
    )
    for (const r of reported) console.log(`  - ${r}`)
    console.log('')
  }
  if (failures.length) {
    console.log(`FAIL (${failures.length})`)
    for (const f of failures) console.log(`  - ${f}`)
  } else {
    console.log(
      'PASS: every enforced check holds — every governed row fits, no governed ' +
        'control paints outside its box, no governed field is pure padding. ' +
        'The reported rows above are not covered by that sentence.'
    )
  }
}

if (missingProof.length) {
  console.error(
    `candidate "${CANDIDATE}" did not reproduce the defect it is named for: ` +
      `no finding on ${missingProof.join(', ')}. The override is inert — it ` +
      `is outranked, or it never reached the page — so every number this run ` +
      `printed belongs to the committed stylesheet, not to this candidate.`
  )
  process.exit(2)
}

process.exit(failures.length ? 1 : 0)
