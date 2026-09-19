// Measures the three things this package gets wrong on a phone, each of which
// is invisible to jest because jsdom computes no layout and evaluates no media
// query.
//
//   1. THE NAVIGATION BAND. `SidebarTrigger` hides itself with a class, and
//      `SidebarProvider` decides whether the rail became a drawer with
//      `matchMedia('(max-width: 767px)')`. If those two flip at different
//      pixels there is a band of viewports with NEITHER a rail NOR a
//      hamburger: no navigation at all. `md:` is 48rem, and rem in a media
//      query resolves against the BROWSER'S DEFAULT FONT SIZE rather than
//      anything the page declares — so at Chrome's "Small" setting (12px)
//      `md:` flips at 576px while the drawer still flips at 768px, and every
//      window in between has no way into the navigation. Measured here across
//      three browser font sizes, which is why this script drives
//      `Page.setFontSizes` rather than writing `font-size` on `html`: the
//      second changes nothing about where a media query flips (verified — the
//      root element reads 12px and `(min-width: 48rem)` still turns over at
//      768px).
//
//   2. THE SHEET'S PHONE WIDTH. `sheetVariants` sizes the left and right
//      panels `w-2/5` with `p-12`, at every viewport, so a 390px phone gets a
//      156px panel with 59px of content and a form field inside it comes out
//      9px wide. product-console has held a rule against the slot since its
//      M10 lane; this measures the panel so the rule can move into the kit.
//
//   3. THE KEBAB'S TOUCH TARGET. `IconButton size="small"` is `size-8`, and a
//      table's row-actions trigger is the one place a 32px control is the only
//      control in the row. The shell uses `size-10` for its icon buttons. The
//      target has to reach 2.5rem WITHOUT the visual box growing, because the
//      box is what sets the table row's height.
//
// Two arms, and the baseline is not decoration: an arm that measures the same
// markup as the shipped one proves nothing, so `--arm=baseline` restates the
// class lists and rules as 2.0.0-beta.11 shipped them and the run REFUSES to
// pass unless the defects it is named for come back. That is the same guard
// `measure-input-shrink.mjs` carries as `CANDIDATE_MUST_FIND`, for the same
// reason: a run that measured the wrong thing looks exactly like a clean one.
//
//   node scripts/measure-phone-shapes.mjs              # table, exits 1 on any failure
//   node scripts/measure-phone-shapes.mjs --json
//   node scripts/measure-phone-shapes.mjs --arm=baseline   # 2.0.0-beta.11, must fail
//   CHROME_BIN=/path/to/chrome node scripts/…
//
// Needs a Chromium/Chrome binary, so it is a manual tool rather than a CI gate
// — the runners here carry no browser, exactly as for the input harness. What
// CI does hold is the token assertions in `sidebar-responsive.test.tsx`,
// `sheet.test.tsx` and `icon-button.test.tsx`; those catch a class going away,
// this catches the geometry that class was there to produce.
//
// The fixtures carry the class lists the components emit, resolved through the
// same `twMerge` the components resolve them through, because `cn` drops
// `px-8 pb-0` against `p-12` before the cascade ever sees them. They are
// duplicated from the source, so `assertSourceStillSays` below refuses to run
// when a literal it copied is no longer in the file it came from.
//
// Pixel numbers move with the font: every size in this package is rem, and rem
// follows the browser's default font size. Sheet and kebab cases are therefore
// measured at 16px only and the band case at 12, 16 and 20. Compare runs of
// this script; do not quote its numbers at a browser session that loaded the
// product's own webfont.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import tailwind from '@tailwindcss/postcss'
import { twMerge } from 'tailwind-merge'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PKG = path.resolve(HERE, '..')
const SRC = path.join(PKG, 'src')
const CHROME = process.env.CHROME_BIN || '/usr/bin/chromium'
const JSON_OUT = process.argv.includes('--json')
const ARM = process.argv.find((a) => a.startsWith('--arm='))?.slice(6) || 'head'

if (ARM !== 'head' && ARM !== 'baseline') {
  console.error(`unknown arm "${ARM}"; one of: head, baseline`)
  process.exit(2)
}

/**
 * A fixture built from a class list the source no longer contains measures a
 * component that no longer exists. Every literal these fixtures copy is listed
 * here against the file it was copied from, and a miss exits 2 rather than
 * printing numbers under the wrong name.
 *
 * `head` entries are the tokens this change introduces; `baseline` entries are
 * the ones it replaces, and they are deliberately NOT asserted — the baseline
 * arm exists to reproduce a release that is already published.
 */
const SOURCE_CONTRACT = [
  ['components/ui/sidebar/sidebar-trigger.tsx', "'min-[768px]:hidden'"],
  ['components/ui/sidebar/sidebar-provider.tsx', "'(max-width: 767px)'"],
  ['components/ui/sheet/index.tsx', 'max-sm:w-full'],
  ['components/ui/sheet/index.tsx', 'max-sm:px-4'],
  ['components/ui/sidebar/sidebar-root.tsx', 'max-sm:w-[var(--sidebar-width)]'],
  ['components/ui/icon-button/styles.css', '.icon-button-small::after']
]

function assertSourceStillSays() {
  if (ARM !== 'head') return
  const missing = SOURCE_CONTRACT.filter(([file, needle]) => {
    const full = path.join(SRC, file)
    return !fs.existsSync(full) || !fs.readFileSync(full, 'utf8').includes(needle)
  })
  if (missing.length) {
    console.error(
      `the fixtures copy class lists out of the components, and ` +
        `${missing.length} of those literals is no longer in the file it came ` +
        `from, so this run would measure markup nothing emits:\n` +
        missing.map(([f, n]) => `  ${n}  (src/${f})`).join('\n')
    )
    process.exit(2)
  }
}

/** The breakpoint the drawer decision subscribes at. `sidebar-provider.tsx`. */
const DRAWER_QUERY = '(max-width: 767px)'

/**
 * `SidebarTrigger`'s display class, both arms. `md:hidden` is 48rem, which is
 * 576px at a 12px browser font; `min-[768px]:hidden` is the complement of
 * `DRAWER_QUERY` at every font, which is the whole point.
 */
const TRIGGER_HIDE = {
  head: 'min-[768px]:hidden',
  baseline: 'md:hidden'
}

/** What `IconButton` emits: `buttonVariants` then `iconButtonVariants`. */
const iconButtonCls = (size) =>
  twMerge(
    'button-base button-outline',
    'icon-button-base icon-button-read-only icon-button-disabled',
    size === 'small' ? 'icon-button-small' : ''
  )

/**
 * What `SheetContent` emits, resolved the way `cn` resolves it: the content
 * list first, then `sheetVariants({ side })`, then the caller's className.
 * `px-8 pb-0` never reaches the cascade — `p-12` is a conflicting shorthand
 * that arrives later — which is why this is run through `twMerge` rather than
 * concatenated.
 */
const SHEET_BASE = 'fixed z-50 gap-4 bg-background p-12 shadow-lg'
const SHEET_SIDE = {
  head: {
    left: 'inset-y-0 left-0 h-full w-2/5 max-sm:w-full border-r',
    right: 'inset-y-0 right-0 h-full w-2/5 max-sm:w-full border-l'
  },
  baseline: {
    left: 'inset-y-0 left-0 h-full w-2/5 border-r',
    right: 'inset-y-0 right-0 h-full w-2/5 border-l'
  }
}
/** The phone padding step, on the base rather than on a side. */
const SHEET_PHONE_PADDING = { head: 'max-sm:px-4', baseline: '' }

const sheetCls = (side, caller = '') =>
  twMerge(
    'flex max-h-screen flex-col overflow-x-auto px-8 pb-0',
    SHEET_BASE,
    SHEET_PHONE_PADDING[ARM],
    SHEET_SIDE[ARM][side],
    caller
  )

/**
 * `SidebarRoot`'s own drawer, which is a `SheetContent side="left"` carrying a
 * width the consumer is allowed to re-point. It is the one panel that must NOT
 * take the phone width: a 244px drawer over a dimmed page is the design, and
 * a full-bleed one takes away the tap-outside-to-close target. The `max-sm:`
 * half is what keeps it, because tailwind-merge only drops a conflicting class
 * that carries the SAME modifiers — a bare `w-[…]` cannot reach `max-sm:w-full`.
 */
const DRAWER_CALLER = {
  head: 'w-[var(--sidebar-width)] max-sm:w-[var(--sidebar-width)] max-w-full gap-0 p-0',
  baseline: 'w-[var(--sidebar-width)] max-w-full gap-0 p-0'
}

/**
 * product-console's own rule, unlayered, as `globals.css` has carried it since
 * its M10 lane. Measured as an arm of its own so the report can say what the
 * console is holding today and what it gets back when it deletes it.
 */
const CONSOLE_RULE = `@media (width < 40rem) { [data-slot='sheet-content'] { width: 100%; padding-inline: 1rem; } }`

/**
 * The baseline restates two of the three defects through the fixtures' class
 * lists, which is all a class change needs. The kebab's is a STYLESHEET rule,
 * so undoing it takes a rule: appended INTO `@layer components`, later than
 * this package's own rule set and still under `@layer utilities`, exactly as
 * `measure-input-shrink.mjs` injects its candidates. Appended unlayered it
 * would outrank a caller's utility and stop modelling the real cascade.
 *
 * Without this the baseline measured the SHIPPED small icon button and passed
 * the kebab case — which the arm's own proof list caught, and which is the
 * reason that list exists.
 */
const ARM_CSS = {
  head: '',
  baseline: `@layer components { .icon-button-small::after { content: none; } }`
}

const field = (probe) =>
  `<div class="space-y-2">` +
  `<div class="input-wrapper input-wrapper-focus">` +
  `<input data-probe="${probe}" class="input-base input-disabled input-read-only" placeholder="Ledger name" value="1234567.89">` +
  `</div></div>`

const TRIGGER_WIDTHS = [320, 390, 575, 576, 640, 700, 767, 768, 900, 1024, 1440]
const SHEET_WIDTHS = [320, 390, 640, 1024]

/**
 * A case is one iframe. Media queries inside an iframe evaluate against the
 * iframe's own width, and the browser's default font size reaches it like any
 * other renderer preference, so a viewport sweep is a row of frames rather
 * than a reload per width. Verified against `Emulation.setDeviceMetricsOverride`
 * on the same widths.
 */
const CASES = []

for (const width of TRIGGER_WIDTHS) {
  CASES.push({
    id: `band-${width}`,
    group: 'band',
    width,
    height: 120,
    fonts: [12, 16, 20],
    // The rail is not a CSS decision — `SidebarRoot` renders a drawer instead
    // of it when the provider's media query matches — so the measurement asks
    // the frame's own `matchMedia` for that half and computed style for the
    // trigger's. Both halves read the way the components read them.
    drawerQuery: DRAWER_QUERY,
    html:
      `<div class="flex items-start gap-2">` +
      `<nav data-probe="rail" data-slot="sidebar-root" class="w-[var(--sidebar-width)] shrink-0">rail</nav>` +
      `<button data-probe="trigger" data-slot="sidebar-trigger" class="${twMerge(
        iconButtonCls('default'),
        TRIGGER_HIDE[ARM]
      )}"><span></span></button>` +
      `</div>`
  })
}

for (const width of SHEET_WIDTHS) {
  for (const fields of [1, 9]) {
    CASES.push({
      id: `sheet-${fields}f-${width}`,
      group: 'sheet',
      width,
      height: 700,
      fonts: [16],
      // The panel is `fixed inset-y-0 right-0`, so the frame IS its containing
      // block and this is the real geometry rather than a model of it.
      panelFloor: 0.75,
      html:
        `<div data-probe="panel" data-slot="sheet-content" class="${sheetCls('right')}">` +
        Array.from({ length: fields }, (_, i) => field(`f${i + 1}`)).join('') +
        `</div>`
    })
  }
}

CASES.push({
  id: 'sheet-console-rule-390',
  group: 'sheet',
  width: 390,
  height: 700,
  fonts: [16],
  // The same one-field panel with product-console's unlayered rule on top, so
  // the report can say whether the console's rule and this package's step
  // produce the same panel. If they do, the console can delete its rule.
  extraCss: CONSOLE_RULE,
  panelFloor: 0.75,
  html:
    `<div data-probe="panel" data-slot="sheet-content" class="${sheetCls('right')}">` +
    field('f1') +
    `</div>`
})

CASES.push({
  id: 'drawer-390',
  group: 'sheet',
  width: 390,
  height: 700,
  fonts: [16],
  // NOT the phone width: this is the navigation drawer, and 244px over a
  // dimmed page is what it is for. Enforced as an exact width.
  drawerWidth: 244,
  html:
    `<div data-probe="panel" data-slot="sheet-content" class="${sheetCls(
      'left',
      DRAWER_CALLER[ARM]
    )}"><nav class="h-full w-full">nav</nav></div>`
})

CASES.push({
  id: 'drawer-390-console-rule',
  group: 'sheet',
  width: 390,
  height: 700,
  fonts: [16],
  // What product-console ships TODAY. Its rule is unlayered, so it outranks
  // the drawer's own width utility and the navigation drawer is full-bleed on
  // every phone. Reported rather than failed — it is the console's rule, and
  // the point of measuring it here is that deleting it is a fix, not a risk.
  extraCss: CONSOLE_RULE,
  report: ['drawer'],
  drawerWidth: 244,
  html:
    `<div data-probe="panel" data-slot="sheet-content" class="${sheetCls(
      'left',
      DRAWER_CALLER[ARM]
    )}"><nav class="h-full w-full">nav</nav></div>`
})

CASES.push({
  id: 'kebab-row-390',
  group: 'target',
  width: 390,
  height: 300,
  fonts: [16],
  // product-console's `ActionCell`: `IconButton variant="secondary"
  // size="small"` inside a `TableCell`, which is this package's `px-6 py-4`.
  // The row height is measured because the repair must not move it — a taller
  // row is fewer rows on a phone, which is a worse trade than the small target
  // it bought.
  target: { probe: 'kebab', minRem: 2.5 },
  // 64.5px is what this row measures on 2.0.0-beta.11: `py-4` either side of a
  // `size-8` control, plus the border. The repair must leave it there, which
  // is what an absolutely positioned target buys and what a bigger button
  // would have cost.
  rowHeight: { probe: 'row', max: 64.5 },
  html:
    `<table class="w-full caption-bottom text-sm"><tbody>` +
    `<tr data-probe="row" class="border-b">` +
    `<td class="px-6 py-4 align-middle text-sm font-normal">Ledger A</td>` +
    `<td class="px-6 py-4 text-center align-middle text-sm font-normal">` +
    `<button data-probe="kebab" class="${iconButtonCls('small')}"><span></span></button>` +
    `</td></tr></tbody></table>`
})

CASES.push({
  id: 'copy-field-360',
  group: 'target',
  width: 360,
  height: 200,
  fonts: [16],
  // The only place in this package where two `size="small"` icon buttons sit
  // side by side, and the reason the expansion is a quarter of a rem rather
  // than a half: `gap-1` is 0.25rem, so each grown target stops exactly at its
  // neighbour's visible edge and NEITHER LOSES A PIXEL OF ITS OWN GLYPH. What
  // they do share is the 4px of empty gap between them, which the later one
  // paints over and therefore takes — so the first button answers five of the
  // eight perimeter points rather than eight. That is reported rather than
  // failed: it is a 32x32 control becoming roughly 36x40, which is the whole
  // improvement available in a cluster this tight, and the enforced half is
  // that neither target reaches over the other's box.
  target: { probe: 'reveal', minRem: 2.5 },
  report: ['target'],
  pairs: [
    ['reveal', 'copy'],
    ['copy', 'reveal']
  ],
  html:
    `<div class="border-input-border flex h-10 w-full items-center gap-1 rounded-md border pr-1 pl-4">` +
    `<input class="h-full min-w-0 flex-1 border-none bg-transparent text-sm outline-none" value="ABCD-EFGH-IJKL" readonly>` +
    `<button data-probe="reveal" class="${twMerge(iconButtonCls('small'), 'icon-button-rounded')}"><span></span></button>` +
    `<button data-probe="copy" class="${twMerge(iconButtonCls('small'), 'icon-button-rounded')}"><span></span></button>` +
    `</div>`
})

CASES.push({
  id: 'search-input-360',
  group: 'target',
  width: 360,
  height: 200,
  fonts: [16],
  // `SearchInput`'s clear control, inside an `input-adornment`. The adornment
  // is a 2.5rem absolutely-positioned box and `.input-adornment > *` sizes its
  // child 4px smaller, so this control is 36px rather than 32px and its box
  // already covers the field's last 2.5rem. Reported, not enforced: what the
  // expansion adds here is the 2px the adornment was already holding on each
  // side, and the number is printed so that stays true.
  target: { probe: 'clear', minRem: 2.5 },
  report: ['overlap'],
  pairs: [['clear', 'searchfield']],
  html:
    `<div class="input-wrapper input-wrapper-focus">` +
    `<input data-probe="searchfield" class="input-base input-end" value="ledger" placeholder="Search">` +
    `<span data-slot="input-adornment" class="input-adornment input-adornment-end">` +
    `<button data-probe="clear" class="${iconButtonCls('small')}"><span></span></button>` +
    `</span></div>`
})

/**
 * The findings each arm has to reproduce. A baseline that prints nothing is a
 * baseline that never reached the page — wrong cascade layer, an `@source`
 * that stopped resolving, a class list the fixtures no longer carry — and its
 * silence would read exactly like a fix.
 */
const ARM_MUST_FIND = {
  baseline: ['band-576', 'band-700', 'sheet-1f-390', 'kebab-row-390']
}

const FONTS = [...new Set(CASES.flatMap((c) => c.fonts))].sort((a, b) => a - b)

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'phone-shapes-'))
const htmlPath = path.join(tmp, 'harness.html')

const pageFor = (font, css) =>
  `<!doctype html><html><head><meta charset="utf-8">` +
  `<style id="kit">${css}</style>` +
  `<style>body{margin:0;padding:0;background:#fff}iframe{border:0;display:block}</style>` +
  `</head><body>` +
  CASES.filter((c) => c.fonts.includes(font))
    .map(
      (c) =>
        `<iframe data-case="${c.id}" style="width:${c.width}px;height:${c.height}px" ` +
        `srcdoc="${escapeAttr(
          `<!doctype html><html><head><meta charset="utf-8">` +
            `<style>body{margin:0;background:#fff}</style>` +
            (c.extraCss ? `<style data-extra>${c.extraCss}</style>` : '') +
            `</head><body>${c.html}</body></html>`
        )}"></iframe>`
    )
    .join('\n') +
  `</body></html>`

function escapeAttr(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

assertSourceStillSays()

// Tailwind v4 emits only the utilities it finds in a scanned source, and this
// page is generated at run time, so a class that appears ONLY in a fixture
// would resolve to nothing and the fixture would measure a rule that was never
// written. The `@source` below reaches the generated file; this script's own
// text is inside the scanned package, which is the second route. The preflight
// after the compile is what refuses a run where neither worked.
fs.writeFileSync(htmlPath, pageFor(16, ''))
const entry = `@import './src/globals.css';\n@source '${htmlPath}';\n`
const { css } = await postcss([tailwind()]).process(entry, {
  from: path.join(PKG, 'measure-phone-entry.css')
})

// Tailwind v4 emits range syntax (`@media (width >= 48rem)`), so the preflight
// anchors on the generated SELECTOR rather than on a media text this version
// does not write. A fixture whose utility was never emitted compares a rule
// against its own absence and passes for the wrong reason.
const preflight = []
const required = [
  ['.' + TRIGGER_HIDE[ARM].replace(/([:[\]])/g, '\\$1'), "the trigger's hide class"],
  ['.max-sm\\:w-full', "the sheet's phone width"],
  ['.icon-button-small', 'the small icon button']
]
for (const [needle, what] of required) {
  // The phone width only exists on the head arm; the baseline is a release
  // that shipped without it.
  if (ARM === 'baseline' && needle === '.max-sm\\:w-full') continue
  if (!css.includes(needle))
    preflight.push(
      `${what} (${needle}) was not generated, so its fixture measured ` +
        `nothing; check the @source line still resolves and that this script ` +
        `still sits inside the scanned package`
    )
}

const port = 9600 + (Number(process.env.PORT_OFFSET) || 0)
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'phone-shapes-chrome-'))
const chrome = spawn(CHROME, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1600,1000',
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

/** The measurement, run inside the top document once per browser font size. */
const MEASURE = `(() => {
  const round = (n) => Math.round(n * 100) / 100
  const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize)
  return {
    rootPx,
    cases: [...document.querySelectorAll('iframe[data-case]')].map((frame) => {
      const win = frame.contentWindow
      const doc = frame.contentDocument
      const probes = {}
      for (const el of doc.querySelectorAll('[data-probe]')) {
        const b = el.getBoundingClientRect()
        const cs = win.getComputedStyle(el)
        const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
        const bordX = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth)
        probes[el.dataset.probe] = {
          tag: el.tagName.toLowerCase(),
          display: cs.display,
          width: round(b.width),
          height: round(b.height),
          left: round(b.left),
          right: round(b.right),
          top: round(b.top),
          bottom: round(b.bottom),
          paddingInline: round(padX),
          content: round(Math.max(0, b.width - padX - bordX))
        }
      }
      // The trigger and the rail are decided by different machinery — a class
      // and a media query the provider subscribes to — so both halves are read
      // the way their own code reads them.
      const drawer = frame.dataset.drawerQuery
        ? win.matchMedia(frame.dataset.drawerQuery).matches
        : null
      // The real hit area, not the declared one: walk the perimeter of the box
      // the target is supposed to reach and ask the document what is there.
      const hit = (probe, sizePx) => {
        const el = doc.querySelector('[data-probe="' + probe + '"]')
        if (!el) return null
        const b = el.getBoundingClientRect()
        const cx = b.left + b.width / 2
        const cy = b.top + b.height / 2
        const h = sizePx / 2 - 0.5
        const points = [
          [cx - h, cy - h], [cx, cy - h], [cx + h, cy - h],
          [cx - h, cy], [cx + h, cy],
          [cx - h, cy + h], [cx, cy + h], [cx + h, cy + h]
        ]
        const misses = points.filter(([x, y]) => {
          const at = doc.elementFromPoint(x, y)
          return !(at === el || el.contains(at))
        })
        return { points: points.length, misses: misses.length }
      }
      // Does one control's target reach over ANOTHER control's visible box?
      // Asked of the document rather than computed from an assumed expansion,
      // so the answer belongs to whatever the stylesheet actually renders:
      // sample a grid inside the neighbour's own box and count the points that
      // answer to the other element.
      const steal = (thief, victim) => {
        const a = doc.querySelector('[data-probe="' + thief + '"]')
        const b = doc.querySelector('[data-probe="' + victim + '"]')
        if (!a || !b) return null
        const r = b.getBoundingClientRect()
        let taken = 0
        let total = 0
        // Sampled a whole pixel inside the box, because the outermost column
        // is the edge the two controls SHARE and Chromium snaps a pseudo
        // element's hit rect to whole pixels: at half a pixel inside the first
        // button, the second one already answers. Nobody taps a half-pixel
        // seam; what this has to catch is a target reaching into the glyph.
        for (let i = 0; i <= 20; i++) {
          for (let j = 0; j <= 4; j++) {
            const x = r.left + 1 + ((r.width - 2) * i) / 20
            const y = r.top + 1 + ((r.height - 2) * j) / 4
            total++
            const at = doc.elementFromPoint(x, y)
            if (at === a || a.contains(at)) taken++
          }
        }
        return { taken, total }
      }
      return {
        id: frame.dataset.case,
        viewport: win.innerWidth,
        drawerMatches: drawer,
        probes,
        hit: frame.dataset.target
          ? hit(frame.dataset.target, parseFloat(frame.dataset.targetPx))
          : null,
        steals: frame.dataset.pair
          ? frame.dataset.pair.split(',').map((p) => {
              const [x, y] = p.split('>')
              return { thief: x, victim: y, ...steal(x, y) }
            })
          : null
      }
    })
  }
})()`

const runs = {}
for (const font of FONTS) {
  fs.writeFileSync(htmlPath, pageFor(font, css + ARM_CSS[ARM]))
  await send(
    'Page.setFontSizes',
    { fontSizes: { standard: font, fixed: font } },
    sessionId
  )
  await send('Page.navigate', { url: 'file://' + htmlPath }, sessionId)
  await waitFor(async () => {
    if ((await evaluate('document.readyState')) !== 'complete')
      throw new Error('loading')
    const ready = await evaluate(
      `[...document.querySelectorAll('iframe[data-case]')].every(f => f.contentDocument && f.contentDocument.body && f.contentDocument.body.firstElementChild)`
    )
    if (!ready) throw new Error('frames')
  })
  // srcdoc frames are same-origin, so the compiled stylesheet is cloned into
  // each of them rather than inlined 20 times into the page.
  await evaluate(`(() => {
    const kit = document.getElementById('kit')
    for (const f of document.querySelectorAll('iframe[data-case]')) {
      const d = f.contentDocument
      if (d.getElementById('kit')) continue
      const s = d.createElement('style')
      s.id = 'kit'
      s.textContent = kit.textContent
      d.head.insertBefore(s, d.head.firstChild)
    }
  })()`)
  // The measurement reads two per-case knobs off the frame element, set here
  // rather than in the markup so the page stays pure data.
  await evaluate(
    `(() => { const cfg = ${JSON.stringify(
      Object.fromEntries(
        CASES.map((c) => [
          c.id,
          {
            drawerQuery: c.drawerQuery || '',
            target: c.target?.probe || '',
            targetRem: c.target?.minRem || 0,
            pair: (c.pairs || []).map(([a, b]) => `${a}>${b}`).join(',')
          }
        ])
      )
    )}
    const root = parseFloat(getComputedStyle(document.documentElement).fontSize)
    for (const f of document.querySelectorAll('iframe[data-case]')) {
      const c = cfg[f.dataset.case]
      if (c.drawerQuery) f.dataset.drawerQuery = c.drawerQuery
      if (c.pair) f.dataset.pair = c.pair
      if (c.target) { f.dataset.target = c.target; f.dataset.targetPx = String(c.targetRem * root) }
    } })()`
  )
  await evaluate(
    'new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))'
  )
  runs[font] = await evaluate(MEASURE)
}

ws.close()
chrome.kill('SIGTERM')
try {
  fs.rmSync(profile, { recursive: true, force: true })
  fs.rmSync(tmp, { recursive: true, force: true })
} catch {
  // Chromium can still be releasing its profile; the OS reaps /tmp anyway.
}

const failures = [...preflight]
const reported = []
const reportsCheck = (c, check) => (c.report || []).includes(check)

for (const font of FONTS) {
  const rootPx = runs[font].rootPx
  const byId = Object.fromEntries(runs[font].cases.map((m) => [m.id, m]))
  for (const c of CASES) {
    if (!c.fonts.includes(font)) continue
    const m = byId[c.id]
    if (!m) {
      failures.push(`${c.id}: fixture did not render at ${font}px`)
      continue
    }
    const sink = (check) => (reportsCheck(c, check) ? reported : failures)

    if (c.group === 'band') {
      const railOnScreen = m.drawerMatches === false
      const triggerShown = m.probes.trigger.display !== 'none'
      if (!railOnScreen && !triggerShown)
        failures.push(
          `${c.id} @${font}px: NO NAVIGATION — the rail is a drawer ` +
            `(${DRAWER_QUERY} matches) and the trigger is display:none`
        )
      else if (railOnScreen && triggerShown)
        failures.push(
          `${c.id} @${font}px: two navigations — the rail is on screen and ` +
            `the trigger is still shown`
        )
    }

    // Only below the `sm` breakpoint, because that is the boundary the step
    // is declared at: `max-sm:` is `not (min-width: 40rem)`, so a 640px
    // viewport is a tablet and keeps the two-fifths panel on purpose. Its
    // numbers are still printed above; they are simply not a failure.
    if (c.panelFloor !== undefined && c.width < 640) {
      const share = m.probes.panel.width / c.width
      if (share < c.panelFloor)
        sink('panel').push(
          `${c.id}: panel is ${m.probes.panel.width}px of a ${c.width}px ` +
            `viewport (${Math.round(share * 100)}%, needs >= ${c.panelFloor * 100}%)`
        )
      const f1 = m.probes.f1
      if (f1 && f1.content < 120)
        sink('panel').push(
          `${c.id}: the first field has ${f1.content}px of content box ` +
            `(needs >= 120) inside a ${m.probes.panel.width}px panel`
        )
    }

    if (c.drawerWidth !== undefined && m.probes.panel.width !== c.drawerWidth)
      sink('drawer').push(
        `${c.id}: the navigation drawer is ${m.probes.panel.width}px, not ` +
          `${c.drawerWidth}px — a full-bleed drawer has no tap-outside target`
      )

    if (c.target) {
      const need = c.target.minRem * rootPx
      if (m.hit && m.hit.misses > 0)
        sink('target').push(
          `${c.id}: ${c.target.probe} answers ${m.hit.points - m.hit.misses}/` +
            `${m.hit.points} points of a ${need}px target (box is ` +
            `${m.probes[c.target.probe].width}x${m.probes[c.target.probe].height})`
        )
    }

    if (c.rowHeight) {
      const h = m.probes[c.rowHeight.probe].height
      if (h > c.rowHeight.max + 0.01)
        failures.push(
          `${c.id}: the table row is ${h}px tall (max ${c.rowHeight.max}) — ` +
            `the target grew the row`
        )
    }

    // The hazard is a grown target reaching over a NEIGHBOUR'S VISIBLE BOX,
    // which is where a tap lands on the wrong control. Two grown targets
    // sharing the empty gap between them is not that: whichever paints later
    // takes the gap, and neither loses a pixel of its own glyph.
    for (const s of m.steals || []) {
      if (s.taken > 0)
        sink('overlap').push(
          `${c.id}: ${s.taken} of ${s.total} points sampled inside ` +
            `${s.victim}'s own box answer to ${s.thief}`
        )
    }
  }
}

const missingProof = (ARM_MUST_FIND[ARM] || []).filter(
  (id) => ![...failures, ...reported].some((f) => f.startsWith(`${id}`))
)

if (JSON_OUT) {
  console.log(JSON.stringify({ arm: ARM, runs, failures, reported }, null, 2))
} else {
  console.log(`arm: ${ARM}`)
  for (const font of FONTS) {
    const byId = Object.fromEntries(runs[font].cases.map((m) => [m.id, m]))
    const band = CASES.filter((c) => c.group === 'band' && c.fonts.includes(font))
    if (band.length) {
      console.log(
        `\nnavigation band — browser font ${font}px (root computes ${runs[font].rootPx}px)`
      )
      console.log(`  width  rail on screen?  trigger shown?  reachable?`)
      for (const c of band) {
        const m = byId[c.id]
        const rail = m.drawerMatches === false
        const trig = m.probes.trigger.display !== 'none'
        console.log(
          `  ${String(c.width).padStart(5)}  ${(rail ? 'yes' : 'no').padEnd(15)}  ` +
            `${(trig ? 'yes' : 'no').padEnd(14)}  ${rail || trig ? 'yes' : 'NO'}`
        )
      }
    }
    for (const c of CASES) {
      if (c.group === 'band' || !c.fonts.includes(font)) continue
      const m = byId[c.id]
      console.log(`\n${c.id}  (${c.width}px viewport, font ${font}px)`)
      for (const [name, p] of Object.entries(m.probes))
        console.log(
          `    ${name.padEnd(12)} <${p.tag.padEnd(6)}> ${String(p.width).padEnd(8)}x ` +
            `${String(p.height).padEnd(7)} padding-inline ${String(p.paddingInline).padEnd(6)} ` +
            `content ${p.content}`
        )
      if (m.hit)
        console.log(
          `    target       ${m.hit.points - m.hit.misses}/${m.hit.points} perimeter ` +
            `points answer`
        )
    }
  }
  console.log('')
  if (reported.length) {
    console.log(
      `REPORTED (${reported.length}) — measured, not this package's to fail on`
    )
    for (const r of reported) console.log(`  - ${r}`)
    console.log('')
  }
  if (failures.length) {
    console.log(`FAIL (${failures.length})`)
    for (const f of failures) console.log(`  - ${f}`)
  } else {
    console.log(
      'PASS: every viewport reaches the navigation at every browser font, ' +
        'the phone sheet fills its screen while the navigation drawer keeps ' +
        'its width, and the row kebab answers a 2.5rem target without moving ' +
        'the row.'
    )
  }
}

if (missingProof.length) {
  console.error(
    `arm "${ARM}" did not reproduce the defects it is named for: no finding ` +
      `on ${missingProof.join(', ')}. The arm is inert — it never reached the ` +
      `page — so every number this run printed belongs to the other one.`
  )
  process.exit(2)
}

process.exit(failures.length ? 1 : 0)
