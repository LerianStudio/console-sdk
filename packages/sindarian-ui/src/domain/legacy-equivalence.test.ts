/**
 * OUTPUT-EQUIVALENCE vs @lerianstudio/sindarian-x@0.15.0.
 *
 * The port of the money and format grammar has to be byte-identical, not merely
 * "behaviourally similar": matcher, lender, consignado and the cockpit print
 * these strings on reconciliation screens, and a changed grouping mark or a
 * shifted rounding boundary is a wrong number on a financial surface.
 *
 * Every expected value below was PRODUCED BY RUNNING the legacy sources
 * (`src/components/ledger/{format.ts,money-text.tsx,money-math.ts}` and
 * `src/components/recon/match-pair.tsx` from lib-sindarian-ui) over this fixed
 * input corpus, then pasted here verbatim. A failure means the port drifted
 * from the artifact the apps are migrating off — never that the expectation
 * needs updating.
 */
import {
  NO_VALUE,
  formatCount,
  formatPercent,
  humanizeDurationMs,
  toPercentValue
} from './format'
import type { PercentUnit } from './format'
import { moneyDiff } from './money-diff'
import { formatMoneyParts } from './money-text'

type MoneyParts = { formatted: string; negative: boolean } | null

// [value, digits, unit, en-US, pt-BR]
const PERCENT: Array<
  [number | null | undefined, number, PercentUnit, string, string]
> = [
  [0, 1, 'ratio', '0.0%', '0,0%'],
  [0.5, 1, 'ratio', '50.0%', '50,0%'],
  [0.85, 1, 'ratio', '85.0%', '85,0%'],
  [0.1265, 1, 'ratio', '12.7%', '12,7%'],
  [0.12345, 3, 'ratio', '12.345%', '12,345%'],
  [5, 1, 'ratio', '500.0%', '500,0%'],
  [-0.075, 2, 'ratio', '-7.50%', '-7,50%'],
  [85, 1, 'percent', '85.0%', '85,0%'],
  [99.99, 2, 'percent', '99.99%', '99,99%'],
  [0.000049, 4, 'ratio', '0.0049%', '0,0049%'],
  [NaN, 1, 'ratio', NO_VALUE, NO_VALUE],
  [Infinity, 1, 'ratio', NO_VALUE, NO_VALUE],
  [null, 1, 'ratio', NO_VALUE, NO_VALUE],
  [undefined, 1, 'ratio', NO_VALUE, NO_VALUE]
]

// [value, en-US, pt-BR]
const COUNT: Array<[number | null | undefined, string, string]> = [
  [0, '0', '0'],
  [7, '7', '7'],
  [1234567, '1,234,567', '1.234.567'],
  [-98765, '-98,765', '-98.765'],
  [1e21, '1,000,000,000,000,000,000,000', '1.000.000.000.000.000.000.000'],
  [2.6, '3', '3'],
  [NaN, NO_VALUE, NO_VALUE],
  [Infinity, NO_VALUE, NO_VALUE],
  [null, NO_VALUE, NO_VALUE],
  [undefined, NO_VALUE, NO_VALUE]
]

const DURATION: Array<[number | null | undefined, string]> = [
  [0, '0s'],
  [999, '1s'],
  [45_000, '45s'],
  [59_499, '59s'],
  [59_500, '1m'],
  [60_000, '1m'],
  [3_600_000, '1h 0m'],
  [12_300_000, '3h 25m'],
  [173_100_000, '2d 0h'],
  [12_000_000, '3h 20m'],
  [34_560_000_000, '400d 0h'],
  [-5, NO_VALUE],
  [NaN, NO_VALUE],
  [Infinity, NO_VALUE],
  [null, NO_VALUE],
  [undefined, NO_VALUE]
]

const TO_PERCENT: Array<[number | null | undefined, PercentUnit, number]> = [
  [0.5, 'ratio', 50],
  [5, 'ratio', 100],
  [-1, 'percent', 0],
  [85, 'percent', 85],
  [0.999, 'ratio', 99.9],
  [NaN, 'ratio', 0],
  [null, 'ratio', 0],
  [undefined, 'percent', 0]
]

// [amount, fractionDigits, en-US parts, pt-BR parts]
const MONEY: Array<[string | number, number, MoneyParts, MoneyParts]> = [
  [
    '0',
    2,
    { formatted: '0.00', negative: false },
    { formatted: '0,00', negative: false }
  ],
  [
    '0.00',
    2,
    { formatted: '0.00', negative: false },
    { formatted: '0,00', negative: false }
  ],
  [
    -0,
    2,
    { formatted: '0.00', negative: false },
    { formatted: '0,00', negative: false }
  ],
  [
    '-0',
    2,
    { formatted: '-0.00', negative: true },
    { formatted: '-0,00', negative: true }
  ],
  [
    '(0)',
    2,
    { formatted: '-0.00', negative: true },
    { formatted: '-0,00', negative: true }
  ],
  [
    '1250.00',
    2,
    { formatted: '1,250.00', negative: false },
    { formatted: '1.250,00', negative: false }
  ],
  [
    '-45.5',
    2,
    { formatted: '-45.50', negative: true },
    { formatted: '-45,50', negative: true }
  ],
  [
    '−45.5',
    2,
    { formatted: '-45.50', negative: true },
    { formatted: '-45,50', negative: true }
  ],
  [
    '(123.45)',
    2,
    { formatted: '-123.45', negative: true },
    { formatted: '-123,45', negative: true }
  ],
  [
    '1234567.891',
    2,
    { formatted: '1,234,567.89', negative: false },
    { formatted: '1.234.567,89', negative: false }
  ],
  [
    '12345678901234567890.12',
    2,
    { formatted: '12,345,678,901,234,567,890.12', negative: false },
    { formatted: '12.345.678.901.234.567.890,12', negative: false }
  ],
  [
    '0.005',
    2,
    { formatted: '0.01', negative: false },
    { formatted: '0,01', negative: false }
  ],
  [
    '1000',
    0,
    { formatted: '1,000', negative: false },
    { formatted: '1.000', negative: false }
  ],
  [
    '1.2345',
    3,
    { formatted: '1.235', negative: false },
    { formatted: '1,235', negative: false }
  ],
  ['   ', 2, null, null],
  ['abc', 2, null, null],
  [NaN, 2, null, null],
  [Infinity, 2, null, null]
]

type DiffInput = Parameters<typeof moneyDiff>[0]

const DIFF: Array<[DiffInput, string | null, boolean]> = [
  [
    { left: '1250.00', right: '1250.00', currency: 'BRL', tolerance: '0.05' },
    '0.00',
    false
  ],
  [
    { left: '1250.00', right: '1249.97', currency: 'BRL', tolerance: '0.05' },
    '0.03',
    false
  ],
  [
    { left: '1250.00', right: '1246.88', currency: 'BRL', tolerance: '0.05' },
    '3.12',
    true
  ],
  [
    { left: '1250.05', right: '1250.00', currency: 'BRL', tolerance: '0.05' },
    '0.05',
    false
  ],
  [
    { left: '980.00', right: '9800.00', currency: 'BRL', tolerance: '0.05' },
    '-8820.00',
    true
  ],
  [{ left: '100.01', right: '100.00', currency: 'BRL' }, '0.01', true],
  [
    { left: '0.30', right: '0.10', currency: 'BRL', tolerance: '0.05' },
    '0.20',
    true
  ],
  [
    { left: '12345678901234.56', right: '12345678901234.55', currency: 'BRL' },
    '0.01',
    true
  ],
  [
    { left: '−5.00', right: '0.00', currency: 'BRL', tolerance: '0.05' },
    '-5.00',
    true
  ],
  [{ left: '0.00', right: '(5.00)', currency: 'BRL' }, '5.00', true],
  [{ left: 'abc', right: '100.00', currency: 'BRL' }, null, false],
  [{ left: '100.00', right: '', currency: 'BRL' }, null, false],
  [{ left: '100', right: '99', currency: 'JPY' }, '1', true],
  [{ left: '100', right: '99', currency: 'JPY', minorDigits: 0 }, '1', true],
  [{ left: '100.000', right: '99.000', currency: 'BHD' }, '1.000', true],
  [{ left: '1.005', right: '0', currency: 'BRL' }, '1.01', true]
]

describe('legacy output equivalence (sindarian-x@0.15.0)', () => {
  it('NO_VALUE is the same placeholder glyph', () => {
    expect(NO_VALUE).toBe('·')
  })

  it.each(PERCENT)(
    'formatPercent(%p, digits %p, %p)',
    (value, digits, unit, en, ptBr) => {
      expect(formatPercent(value, { digits, unit, locale: 'en-US' })).toBe(en)
      expect(formatPercent(value, { digits, unit, locale: 'pt-BR' })).toBe(ptBr)
    }
  )

  it.each(COUNT)('formatCount(%p)', (value, en, ptBr) => {
    expect(formatCount(value, 'en-US')).toBe(en)
    expect(formatCount(value, 'pt-BR')).toBe(ptBr)
  })

  it.each(DURATION)('humanizeDurationMs(%p)', (value, expected) => {
    expect(humanizeDurationMs(value)).toBe(expected)
  })

  it.each(TO_PERCENT)('toPercentValue(%p, %p)', (value, unit, expected) => {
    expect(toPercentValue(value, unit)).toBe(expected)
  })

  it.each(MONEY)(
    'formatMoneyParts(%p, digits %p)',
    (amount, digits, en, ptBr) => {
      expect(formatMoneyParts(amount, digits, 'en-US')).toEqual(en)
      expect(formatMoneyParts(amount, digits, 'pt-BR')).toEqual(ptBr)
    }
  )

  it.each(DIFF)('moneyDiff(%p)', (input, decimal, breach) => {
    expect(moneyDiff(input)).toEqual({ decimal, breach })
  })
})
