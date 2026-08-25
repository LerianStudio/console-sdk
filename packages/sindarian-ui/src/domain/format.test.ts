/**
 * Money-path correctness checks — the highest-risk logic in a financial UI lib.
 * Ported verbatim (assertions and intent) from sindarian-x@0.15.0's
 * `src/components/ledger/format.test.ts`, minus the number-input cases that
 * belong to another lane. Pure functions only — no rendering.
 */
import {
  NO_VALUE,
  formatCount,
  formatPercent,
  humanizeDurationMs,
  toPercentValue
} from './format'

// --- formatPercent: explicit unit, no magnitude heuristic -------------------
describe('formatPercent', () => {
  it('defaults to unit ratio (0.5 -> 50.0%)', () => {
    expect(formatPercent(0.5, { locale: 'en-US' })).toBe('50.0%')
  })
  it('does NOT re-scale unit:percent (85 -> 85.0%)', () => {
    expect(formatPercent(85, { unit: 'percent', locale: 'en-US' })).toBe(
      '85.0%'
    )
  })
  it('formats ratio 0.85 -> 85.0%', () => {
    expect(formatPercent(0.85, { locale: 'en-US' })).toBe('85.0%')
  })
  it('does not clamp or mis-detect ratio 5 (i.e. 500%)', () => {
    // Old heuristic: 5 > 1 so treated as 5% — WRONG. New: ratio 5 -> 500%.
    expect(formatPercent(5, { locale: 'en-US' })).toBe('500.0%')
  })
  it('uses Intl rounding (0.12345 @3 digits -> 12.345%)', () => {
    expect(formatPercent(0.12345, { digits: 3, locale: 'en-US' })).toBe(
      '12.345%'
    )
  })
  it('rounds the mathematical value, not the IEEE-754 artifact', () => {
    // 0.1265 * 100 = 12.65 in exact math, but IEEE-754 stores 12.649999...;
    // Intl style:percent rounds the mathematical value correctly to 12.7%.
    expect(formatPercent(0.1265, { digits: 1, locale: 'en-US' })).toBe('12.7%')
  })
  it('threads the locale decimal mark (pt-BR uses a comma)', () => {
    expect(formatPercent(0.5, { digits: 1, locale: 'pt-BR' })).toBe('50,0%')
  })
  it('returns NO_VALUE for non-finite input', () => {
    expect(formatPercent(NaN)).toBe(NO_VALUE)
    expect(formatPercent(Infinity)).toBe(NO_VALUE)
    expect(formatPercent(null)).toBe(NO_VALUE)
    expect(formatPercent(undefined)).toBe(NO_VALUE)
  })

  // CodeRabbit #7: `digits` is caller-supplied and reached Intl raw, where an
  // out-of-range count throws a RangeError — a blanked surface, not a number.
  it('returns NO_VALUE for an out-of-range digit count instead of throwing', () => {
    for (const digits of [-1, 1.5, 101, NaN, Infinity]) {
      expect(() =>
        formatPercent(0.5, { digits, locale: 'en-US' })
      ).not.toThrow()
      expect(formatPercent(0.5, { digits, locale: 'en-US' })).toBe(NO_VALUE)
    }
  })

  it('still accepts the legitimate digit range', () => {
    expect(formatPercent(0.5, { digits: 0, locale: 'en-US' })).toBe('50%')
    expect(formatPercent(0.5, { digits: 100, locale: 'en-US' })).toContain(
      '50.'
    )
  })
})

// --- toPercentValue: explicit unit ------------------------------------------
describe('toPercentValue', () => {
  it('defaults to ratio (0.5 -> 50)', () => {
    expect(toPercentValue(0.5)).toBe(50)
  })
  it('passes unit:percent through (85 -> 85)', () => {
    expect(toPercentValue(85, 'percent')).toBe(85)
  })
  it('clamps to 0..100', () => {
    expect(toPercentValue(5, 'ratio')).toBe(100) // 500% clamps to 100
    expect(toPercentValue(-1, 'percent')).toBe(0)
  })
})

// --- formatCount: locale param ----------------------------------------------
describe('formatCount', () => {
  it('threads the locale (1234567 pt-BR -> dotted groups)', () => {
    expect(formatCount(1234567, 'pt-BR')).toBe('1.234.567')
    expect(formatCount(1234567, 'en-US')).toBe('1,234,567')
  })
  it('returns NO_VALUE for non-finite input', () => {
    expect(formatCount(Infinity)).toBe(NO_VALUE)
    expect(formatCount(NaN)).toBe(NO_VALUE)
    expect(formatCount(null)).toBe(NO_VALUE)
  })
})

// --- humanizeDurationMs: non-finite guard + contiguous units ----------------
describe('humanizeDurationMs', () => {
  it('returns NO_VALUE for Infinity/NaN/negative (no "Infinityd")', () => {
    expect(humanizeDurationMs(Infinity)).toBe(NO_VALUE)
    expect(humanizeDurationMs(NaN)).toBe(NO_VALUE)
    expect(humanizeDurationMs(-5)).toBe(NO_VALUE)
  })
  it('keeps the two units CONTIGUOUS ("2d 0h", never "2d 5m")', () => {
    const ms = (2 * 86400 + 0 * 3600 + 5 * 60) * 1000
    expect(humanizeDurationMs(ms)).toBe('2d 0h')
  })
  it('renders 0 as "0s" and sub-minute as seconds', () => {
    expect(humanizeDurationMs(0)).toBe('0s')
    expect(humanizeDurationMs(45_000)).toBe('45s')
  })
  it('starts at the largest non-zero unit (0d 3h 20m -> "3h 20m")', () => {
    const ms = (3 * 3600 + 20 * 60) * 1000
    expect(humanizeDurationMs(ms)).toBe('3h 20m')
  })
})
