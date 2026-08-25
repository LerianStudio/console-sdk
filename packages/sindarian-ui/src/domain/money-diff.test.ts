/**
 * moneyDiff is the third-rail core of a reconciliation pair: left − right on
 * integer minor units, with a tolerance breach test that must never round-trip
 * through float. Ported from sindarian-x@0.15.0's
 * `src/components/recon/match-pair.test.ts`.
 */
import { moneyDiff } from './money-diff'

describe('moneyDiff', () => {
  it('reads an exact tie as a zero diff and never a breach', () => {
    const { decimal, breach } = moneyDiff({
      left: '1250.00',
      right: '1250.00',
      currency: 'BRL',
      tolerance: '0.05'
    })
    expect(decimal).toBe('0.00')
    expect(breach).toBe(false)
  })

  it('reads a nonzero diff within tolerance as calm', () => {
    // |1250.00 − 1249.97| = 0.03 ≤ 0.05 band
    const { decimal, breach } = moneyDiff({
      left: '1250.00',
      right: '1249.97',
      currency: 'BRL',
      tolerance: '0.05'
    })
    expect(decimal).toBe('0.03')
    expect(breach).toBe(false)
  })

  it('breaches on a diff strictly beyond tolerance', () => {
    // |1250.00 − 1246.88| = 3.12 > 0.05 band
    const { decimal, breach } = moneyDiff({
      left: '1250.00',
      right: '1246.88',
      currency: 'BRL',
      tolerance: '0.05'
    })
    expect(decimal).toBe('3.12')
    expect(breach).toBe(true)
  })

  it('puts a diff exactly on the band edge in the calm zone', () => {
    // |1250.05 − 1250.00| = 0.05, NOT strictly greater than 0.05 → calm
    expect(
      moneyDiff({
        left: '1250.05',
        right: '1250.00',
        currency: 'BRL',
        tolerance: '0.05'
      }).breach
    ).toBe(false)
  })

  it('breaches a negative diff on magnitude, not sign', () => {
    // right > left → diff is negative; the breach test is on |diff|
    const { decimal, breach } = moneyDiff({
      left: '980.00',
      right: '9800.00',
      currency: 'BRL',
      tolerance: '0.05'
    })
    expect(decimal).toBe('-8820.00')
    expect(breach).toBe(true)
  })

  it('treats any nonzero difference as the breach when no tolerance is given', () => {
    expect(
      moneyDiff({ left: '100.00', right: '100.00', currency: 'BRL' }).breach
    ).toBe(false)
    expect(
      moneyDiff({ left: '100.01', right: '100.00', currency: 'BRL' }).breach
    ).toBe(true)
  })

  it('stays exact past IEEE-754 — string operands, no float subtraction', () => {
    // 0.1 + 0.2 in float ≠ 0.3; via minor units the diff is exact.
    const { decimal, breach } = moneyDiff({
      left: '0.30',
      right: '0.10',
      currency: 'BRL',
      tolerance: '0.05'
    })
    expect(decimal).toBe('0.20')
    expect(breach).toBe(true)
    // a 16+ significant-digit magnitude stays exact (no double round-trip)
    const big = moneyDiff({
      left: '12345678901234.56',
      right: '12345678901234.55',
      currency: 'BRL'
    })
    expect(big.decimal).toBe('0.01')
    expect(big.breach).toBe(true)
  })

  it('normalizes the unicode minus and accounting parens like money-math', () => {
    const uni = moneyDiff({
      left: '−5.00',
      right: '0.00',
      currency: 'BRL',
      tolerance: '0.05'
    })
    expect(uni.decimal).toBe('-5.00')
    expect(uni.breach).toBe(true)
    const parens = moneyDiff({ left: '0.00', right: '(5.00)', currency: 'BRL' })
    expect(parens.decimal).toBe('5.00')
  })

  it('surfaces null for an unparseable operand, never a fabricated zero', () => {
    expect(
      moneyDiff({ left: 'abc', right: '100.00', currency: 'BRL' })
    ).toEqual({
      decimal: null,
      breach: false
    })
    expect(moneyDiff({ left: '100.00', right: '', currency: 'BRL' })).toEqual({
      decimal: null,
      breach: false
    })
  })

  it('lets minorDigits override the scale of the diff', () => {
    // JPY-style zero-scale: a sub-unit difference rounds to the integer scale.
    expect(
      moneyDiff({ left: '100', right: '99', currency: 'JPY', minorDigits: 0 })
        .decimal
    ).toBe('1')
  })

  it('derives the scale from the currency when minorDigits is omitted', () => {
    // No explicit minorDigits: JPY (0-scale via CLDR) yields an integer diff '1',
    // never the old hardcoded-2 '1.00'.
    expect(
      moneyDiff({ left: '100', right: '99', currency: 'JPY' }).decimal
    ).toBe('1')
    // BHD is a 3-scale currency: the diff carries three fraction digits.
    expect(
      moneyDiff({ left: '100.000', right: '99.000', currency: 'BHD' }).decimal
    ).toBe('1.000')
  })
})
