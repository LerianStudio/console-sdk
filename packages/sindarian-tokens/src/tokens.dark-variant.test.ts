/**
 * @jest-environment jsdom
 *
 * The `dark` variant has to reach the element that carries the class.
 *
 * `@custom-variant dark (…)` in tokens.css is the condition Tailwind splices
 * under every `dark:` utility, so it is the whole contract for dark mode: a
 * console toggles the theme with `class="dark"` on `<html>`, and a `dark:`
 * utility written on that same element resolves only if the condition matches
 * the element itself and not merely its descendants. `&:is(.dark *)` matches
 * descendants only, which drops that case with no error anywhere.
 *
 * This reads the condition out of the stylesheet and runs it through a real
 * selector engine instead of comparing it against an expected string, so it
 * holds for any condition that covers the three cases below rather than for one
 * spelling of it.
 *
 * WHAT THIS DOES NOT COVER
 *
 * The variant's specificity. `:where()` adds none while `:is()` adds that of its
 * most specific argument, and the difference decides whether a `dark:` utility
 * outranks a competing variant such as `hover:`. jsdom's cascade does not model
 * it — both forms resolve to the same winner under `getComputedStyle` — so an
 * assertion here would stay green through a regression. Tailwind's generated
 * output is the only honest reference for that property.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const TOKENS_PATH = join(__dirname, 'tokens.css')

const PROBE = 'probe'

/**
 * The `dark` condition from tokens.css, with `&` bound to a probe class so the
 * result is the selector a `dark:` utility actually resolves against.
 */
function darkVariantSelector(): string {
  const css = readFileSync(TOKENS_PATH, 'utf8')
  const declaration = /@custom-variant\s+dark\s+\(([\s\S]+?)\);/.exec(css)

  if (declaration === null) {
    throw new Error('tokens.css declares no `dark` custom variant')
  }

  const condition = declaration[1].trim()

  if (!condition.startsWith('&')) {
    throw new Error(
      `expected a nested \`&\` condition, got: ${condition} — rewrite this test for that form`
    )
  }

  return `.${PROBE}${condition.slice(1)}`
}

function probeElement(): Element {
  const element = document.querySelector(`.${PROBE}`)

  if (element === null) {
    throw new Error('fixture built no probe element')
  }

  return element
}

describe('the dark custom variant', () => {
  const selector = darkVariantSelector()

  beforeEach(() => {
    document.documentElement.className = ''
    document.body.innerHTML = ''
  })

  it('matches the element carrying the class, as `<html class="dark">` does', () => {
    document.documentElement.className = `dark ${PROBE}`

    expect(document.documentElement.matches(selector)).toBe(true)
  })

  it('matches a descendant of the element carrying the class', () => {
    document.documentElement.classList.add('dark')
    document.body.innerHTML = `<div><span class="${PROBE}"></span></div>`

    expect(probeElement().matches(selector)).toBe(true)
  })

  it('does not match when no ancestor carries the class', () => {
    document.body.innerHTML = `<div><span class="${PROBE}"></span></div>`

    expect(probeElement().matches(selector)).toBe(false)
  })
})
