// Measures whether `.input-base` can shrink inside a narrow flex row.
//
// `.input-base` is `flex-1`, and a flex item never shrinks below its automatic
// minimum size. With no declared width that minimum falls back to the
// control's own intrinsic size, so the input refused to shrink, painted
// outside its own `.input-wrapper` and starved whatever sat beside it. `w-0`
// supplies the specified size the flex algorithm floors at instead.
//
// `.input-base` carries NO min-width floor, and that is a measured decision
// rather than an omission. A floor in this rule set cannot protect the sites
// that need one: a consumer writing `.input-base` by hand tends to add its own
// `min-w-0`, which sits in Tailwind's `utilities` layer and outranks anything
// declared here in `components`. Measured with `min-w-16` in `.input-base`:
// the same fixture read 64px wide with the hand-written `min-w-0` removed and
// 32px wide with it present. Meanwhile the floor cost real ground elsewhere —
// two inputs sharing a 120px row went from fitting to overflowing by 52px
// (`min-w-16`) or 31px (`min-w-[6ch]`). A caller that needs its field to hold
// its width says so on its own wrapper with `shrink-0`.
//
// Neither half is visible to jest: jsdom computes no layout, and these are CSS
// rules rather than utility classes on the element, so there is nothing to
// assert in the DOM either. This script is the layout check — run it when
// touching `.input-base`, `.input-wrapper` or `.select-trigger`.
//
//   node scripts/measure-input-shrink.mjs           # table, exits 1 on overflow
//   node scripts/measure-input-shrink.mjs --json    # machine-readable
//   CHROME_BIN=/path/to/chrome node scripts/…       # non-default browser
//
// Needs a Chromium/Chrome binary; it is a manual tool, not a CI gate, because
// CI runners here carry no browser. It needs no build: the fixtures are plain
// markup carrying the same classes the components emit, which is also what the
// product console writes BY HAND. The fixtures cover three of the four sites;
// the fourth is the same shape on a textarea and is not modelled — its
// intrinsic width comes from `cols` rather than `size`, and it has two call
// sites (text block and comment block).
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
 * Each fixture is a flex row of a fixed width. `expect` says what the row has
 * to do; a fixture that misses it is a failure, not a note.
 */
const FIXTURES = [
  {
    id: 'two-up-200',
    width: 200,
    expect: 'fit',
    note: "console transaction screen: amount + asset, each in the caller's own flex-1 column",
    row: 'flex gap-2',
    html:
      `<div class="flex-1">${inputHtml('amount')}</div>` +
      `<div class="flex-1">${selectHtml('asset')}</div>`
  },
  {
    id: 'direct-200',
    width: 200,
    expect: 'fit',
    note: 'same two controls as direct flex children, no caller column',
    row: 'flex gap-2',
    html: inputHtml('amount') + selectHtml('asset')
  },
  {
    id: 'two-inputs-120',
    width: 120,
    expect: 'fit',
    // Geometry stress, not a product shape: at 120px two fields SHOULD be
    // down to a few pixels of content. Only "does it fit" is asserted here.
    readable: false,
    note: 'two inputs sharing a very narrow row (geometry stress, not a real screen)',
    row: 'flex gap-2',
    html: inputHtml('left') + inputHtml('right')
  },
  {
    id: 'two-up-800',
    width: 800,
    expect: 'fit',
    note: 'desktop width: must be unaffected by any shrink rule',
    row: 'flex gap-2',
    html:
      `<div class="flex-1">${inputHtml('amount')}</div>` +
      `<div class="flex-1">${selectHtml('asset')}</div>`
  },
  {
    id: 'builder-header-390',
    width: 390,
    // Reported, not enforced. This shape is a product-console file writing
    // `.input-base` by hand, and the kit cannot fix it from here: the site
    // declares its own `min-w-0`, which outranks any floor this rule set could
    // add. The console-side repair is `shrink-0` on that `w-48` wrapper, one
    // token, saying the field does not give up space. Kept as a fixture so the
    // blast radius of a change to `.input-base` stays visible.
    expect: 'console-gap',
    note: 'product-console template builder header, written by hand: a w-48 wrapper in a gap-3 row (builder-header.tsx). Needs `shrink-0` on that wrapper console-side; the row also overflows 390px on its own, before and after any kit change, because the tab strip beside it is whitespace-nowrap.',
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
    id: 'palette-header-390',
    width: 390,
    expect: 'fit',
    note: 'product-console command palette, written by hand: the same w-48 wrapper shape (search-command-palette.tsx)',
    row: 'flex shrink-0 items-center gap-3 p-3',
    html:
      inputHtml('search', 'h-full py-0', 'w-48') +
      selectHtml('org', 'w-40') +
      selectHtml('ledger', 'w-40')
  },
  {
    id: 'width-utilities-360',
    width: 360,
    expect: 'fit',
    // max-w-12 clamps on purpose, so a narrow content box is the point.
    readable: false,
    note: 'consumer width classes on the input itself, to show which of them the flex algorithm still honours',
    row: 'flex gap-2',
    html: inputHtml('maxw12', 'max-w-12') + inputHtml('w32', 'w-32')
  }
]

/**
 * A field narrower than its own horizontal padding shows no placeholder and no
 * caret position — a rectangle, not a field. Checked on fixtures that model a
 * real screen; a `console-gap` fixture reports its number instead of failing,
 * and a fixture marked `readable: false` is deliberate geometry stress.
 */
const READABLE_CONTENT_PX = 8

const body = FIXTURES.map(
  (f) =>
    `<section><h2 style="font:12px/1.6 monospace;margin:16px 0 4px">${f.id} — ${f.width}px</h2>` +
    `<div data-case="${f.id}" class="${f.row}" style="width:${f.width}px;outline:1px dashed #f0f">${f.html}</div>` +
    `</section>`
).join('\n')

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
fs.writeFileSync(htmlPath, harnessHtml(css))

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
        return {
          name: el.dataset.probe,
          tag: el.tagName.toLowerCase(),
          width: round(b.width),
          // What is left for text after padding and border. Zero means the box
          // shows nothing at all, however wide it looks.
          content: round(Math.max(0, b.width - padding - border)),
          escapes: round(Math.max(0, b.right - el.parentElement.getBoundingClientRect().right))
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
  // A `console-gap` fixture exists to keep a known consumer-side shape in
  // view. Its numbers are printed and listed, never failed on: the repair is
  // not in this package.
  const sink = f.expect === 'console-gap' ? reported : failures

  if (m.overflow > 0)
    sink.push(
      `${f.id}: row overflows by ${m.overflow}px (scrollWidth ${m.scrollWidth} vs ${m.declared})`
    )
  for (const p of m.probes) {
    if (p.escapes > 0)
      sink.push(`${f.id}: ${p.name} paints ${p.escapes}px outside its own box`)
    if (
      f.readable !== false &&
      p.tag === 'input' &&
      p.content < READABLE_CONTENT_PX
    )
      sink.push(
        `${f.id}: ${p.name} has ${p.content}px of content box (needs >= ${READABLE_CONTENT_PX}); ` +
          `the field collapsed to its own padding`
      )
  }
}

if (JSON_OUT) {
  console.log(JSON.stringify({ measured, failures, reported }, null, 2))
} else {
  for (const f of FIXTURES) {
    const m = byId[f.id]
    console.log(
      `\n${f.id}  (${f.width}px)` +
        (f.expect === 'console-gap' ? '   [reported only — consumer-side]' : '')
    )
    console.log(`  ${f.note}`)
    console.log(
      `  row: scrollWidth ${m.scrollWidth} vs ${m.declared} declared` +
        (m.overflow ? `  OVERFLOW ${m.overflow}px` : '  fits')
    )
    for (const p of m.probes)
      console.log(
        `    ${p.name.padEnd(12)} <${p.tag.padEnd(6)}> width ${String(p.width).padEnd(8)}` +
          ` content ${String(p.content).padEnd(8)}` +
          (p.escapes ? ` ESCAPES ${p.escapes}px` : '')
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
      'PASS: every governed row fits, nothing paints outside its box, no field is pure padding'
    )
  }
}

process.exit(failures.length ? 1 : 0)
