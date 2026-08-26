/**
 * money-math is INTERNAL (not exported from `src/domain/index.ts`) but it is the
 * arithmetic under `moneyDiff` and `DelinquencyAging`, so it keeps its own
 * suite: an internal helper that silently changes rounding is exactly as
 * dangerous as a public one. Ported from sindarian-x@0.15.0's
 * `src/components/ledger/money-math.test.ts` (the parts covering the helpers
 * this lane carries over).
 */
import { minorDigitsOf, minorToDecimal, sumMinor, toMinor } from './money-math'

describe('minorDigitsOf', () => {
  it('reads CLDR with a safe fallback', () => {
    expect(minorDigitsOf('BRL')).toBe(2)
    expect(minorDigitsOf('USD')).toBe(2)
    expect(minorDigitsOf('JPY')).toBe(0)
    expect(minorDigitsOf('BHD')).toBe(3)
    expect(minorDigitsOf('ZZZ')).toBe(2) // unknown -> fallback
  })
})

describe('toMinor', () => {
  it('parses canonical decimal strings losslessly', () => {
    expect(toMinor('1240.00', 2)).toBe(124000n)
    expect(toMinor('0.30', 2)).toBe(30n)
    expect(toMinor('.5', 2)).toBe(50n)
    expect(toMinor('1240', 2)).toBe(124000n)
    expect(toMinor('67.75', 2)).toBe(6775n)
  })

  it('rounds half-away-from-zero on the dropped digit', () => {
    expect(toMinor('1.005', 2)).toBe(101n) // the IEEE-754 trap: Math.round gives 100
    expect(toMinor('1.004', 2)).toBe(100n)
    expect(toMinor('-1.005', 2)).toBe(-101n)
  })

  it('honours scale (JPY 0, BHD 3)', () => {
    expect(toMinor('1000', 0)).toBe(1000n)
    expect(toMinor('1.234', 3)).toBe(1234n)
  })

  it('handles the unicode minus and accounting parens', () => {
    expect(toMinor('−5.00', 2)).toBe(-500n)
    expect(toMinor('(18.40)', 2)).toBe(-1840n)
  })

  it('returns null on garbage / empty', () => {
    for (const bad of [
      '',
      ' ',
      '-',
      '.',
      'abc',
      '1.2.3',
      '$10',
      null,
      undefined
    ]) {
      expect(toMinor(bad, 2)).toBeNull()
    }
  })

  it('stays exact past 2^53', () => {
    expect(toMinor('90071992547409.93', 2)).toBe(9007199254740993n)
  })

  // CodeRabbit #2 — DELIBERATE DIVERGENCE from sindarian-x@0.15.0, which
  // coerced these digitless tokens to an exact 0n (the legacy regex admits a
  // sign and a point with no digits between them). In reconciliation a
  // fabricated zero reads as a perfect tie and hides the bad input, so it is the
  // one wrong answer worse than "unknown".
  it('returns null (never 0n) for a digitless token', () => {
    for (const bad of ['-.', ' -. ', '(.)', '−.']) {
      expect(toMinor(bad, 2)).toBeNull()
    }
  })

  // CodeRabbit #3: scale reaches toFixed / '0'.repeat / BigInt directly.
  it('returns null on an out-of-range scale instead of throwing RangeError', () => {
    for (const scale of [-1, 1.5, 101, NaN, Infinity, -Infinity]) {
      expect(() => toMinor('1.00', scale)).not.toThrow()
      expect(toMinor('1.00', scale)).toBeNull()
      // the numeric path reaches toFixed, which throws on the same inputs
      expect(() => toMinor(1, scale)).not.toThrow()
      expect(toMinor(1, scale)).toBeNull()
    }
  })

  it('still accepts the legitimate scale range', () => {
    expect(toMinor('1', 0)).toBe(1n)
    expect(toMinor('1', 100)).toBe(BigInt('1' + '0'.repeat(100)))
  })
})

describe('sumMinor', () => {
  it('sums exactly and is null if any operand is unparseable', () => {
    expect(sumMinor(['0.10', '0.20'], 2)).toBe(30n) // 0.1 + 0.2 = 0.30 exactly
    expect(sumMinor(['612.00', '348.50', '211.75', '67.75'], 2)).toBe(124000n)
    expect(sumMinor(['1.00', 'oops'], 2)).toBeNull()
  })
})

describe('minorToDecimal', () => {
  it('round-trips toMinor', () => {
    expect(minorToDecimal(124000n, 2)).toBe('1240.00')
    expect(minorToDecimal(-1840n, 2)).toBe('-18.40')
    expect(minorToDecimal(50n, 2)).toBe('0.50')
    expect(minorToDecimal(1000n, 0)).toBe('1000')
    // beyond 2^53
    expect(minorToDecimal(toMinor('99999999999999.99', 2) as bigint, 2)).toBe(
      '99999999999999.99'
    )
  })
})
