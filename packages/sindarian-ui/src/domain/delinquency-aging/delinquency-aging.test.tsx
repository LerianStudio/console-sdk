/**
 * THIRD RAIL: the delinquency rate is a ratio of two EXACT integer minor-unit
 * totals (overdueMinor / totalMinor), never a float sum of decimals. Ported from
 * sindarian-x@0.15.0's `src/components/credit/delinquency-aging.test.ts`, plus
 * the bucket-band and grand-total math the composite delegates to.
 */
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

import { DelinquencyAging, delinquencyRate } from '.'
import { bucketBand, sumBucketTotals } from './aging-buckets'

const buckets = (...rows: Array<[string, boolean]>) =>
  rows.map(([total, overdue], i) => ({
    label: `b${i}`,
    count: 1,
    total,
    overdue
  }))

describe('delinquencyRate', () => {
  it('is overdue total / portfolio total as a 0..1 ratio', () => {
    // overdue 250.00 of 1000.00 portfolio → 0.25 exactly.
    const r = delinquencyRate(buckets(['750.00', false], ['250.00', true]), 2)
    expect(r.rate).toBe(0.25)
    expect(r.overdueMinor).toBe(25000n)
    expect(r.totalMinor).toBe(100000n)
    expect(r.indeterminate).toBe(false)
  })

  it('sums multiple overdue buckets through minor units, not float decimals', () => {
    // 0.1 + 0.2 in float is 0.30000000000000004; in minor units it is exactly
    // 30 cents. The NUMERATOR is exact BigInt.
    const r = delinquencyRate(
      buckets(['0.70', false], ['0.10', true], ['0.20', true]),
      2
    )
    expect(r.overdueMinor).toBe(30n)
    expect(r.totalMinor).toBe(100n)
    expect(r.rate).toBeCloseTo(0.3, 12)
  })

  it('returns rate null (no NaN) for a zero portfolio', () => {
    const r = delinquencyRate(buckets(['0.00', false], ['0.00', true]), 2)
    expect(r.totalMinor).toBe(0n)
    expect(r.rate).toBeNull()
    expect(r.indeterminate).toBe(false)
  })

  it('returns rate null for an empty bucket list', () => {
    const r = delinquencyRate([], 2)
    expect(r.totalMinor).toBe(0n)
    expect(r.rate).toBeNull()
  })

  it('is indeterminate when any bucket total is unparseable', () => {
    const r = delinquencyRate(buckets(['750.00', false], ['garbage', true]), 2)
    expect(r.indeterminate).toBe(true)
    expect(r.rate).toBeNull()
    expect(r.overdueMinor).toBeNull()
    expect(r.totalMinor).toBeNull()
  })

  it('handles a fully-overdue portfolio (rate 1.0)', () => {
    expect(
      delinquencyRate(buckets(['500.00', true], ['500.00', true]), 2).rate
    ).toBe(1)
  })

  // CodeRabbit #5: converting each total to Number separately overflowed on a
  // large portfolio — past ~1.8e308 each side becomes Infinity and
  // Infinity/Infinity is NaN, so the biggest portfolios reported no rate at all.
  it('computes a correct rate for totals far beyond Number range', () => {
    const huge = '1' + '0'.repeat(320) + '.00' // 1e320, well past Number.MAX_VALUE
    const quarter = '25' + '0'.repeat(318) + '.00' // 2.5e319, exactly a quarter of it
    const r = delinquencyRate(
      [
        { label: 'current', count: 1, total: huge, overdue: false },
        { label: '90+', count: 1, total: quarter, overdue: true }
      ],
      2
    )
    expect(r.indeterminate).toBe(false)
    expect(r.rate).not.toBeNull()
    expect(Number.isFinite(r.rate as number)).toBe(true)
    // 0.25 of 1.25 total = 0.2 exactly
    expect(r.rate).toBeCloseTo(0.2, 10)
  })

  it('never returns NaN or Infinity as a rate', () => {
    const portfolios = [
      [['1' + '0'.repeat(400) + '.00', true] as [string, boolean]],
      [
        ['0.01', false],
        ['1' + '0'.repeat(400) + '.00', true]
      ] as Array<[string, boolean]>
    ]
    for (const rows of portfolios) {
      const r = delinquencyRate(buckets(...rows), 2)
      if (r.rate !== null) expect(Number.isFinite(r.rate)).toBe(true)
    }
  })

  // CodeRabbit round 2 #2: a negative bucket total is parseable but is not a
  // share of a portfolio — the ratio stops being bounded by 0..1 the moment a
  // component goes negative. Legacy divided anyway and printed the result.
  describe('negative bucket totals', () => {
    it('reports no rate instead of an out-of-range percentage', () => {
      // -50 current + 100 overdue: legacy computed 100/50 = 200% delinquent.
      const r = delinquencyRate(buckets(['-50.00', false], ['100.00', true]), 2)
      expect(r.rate).toBeNull()
      expect(r.indeterminate).toBe(true)
      // The sums are still correct and are kept — only the RATIO is refused.
      expect(r.totalMinor).toBe(5000n)
      expect(r.overdueMinor).toBe(10000n)
    })

    it('refuses the rate wherever the negative sits', () => {
      for (const rows of [
        [
          ['-50.00', false],
          ['100.00', true]
        ],
        [
          ['100.00', false],
          ['-50.00', true]
        ],
        [['-1.00', true]],
        [
          ['500.00', false],
          ['500.00', true],
          ['-0.01', true]
        ]
      ] as Array<Array<[string, boolean]>>) {
        const r = delinquencyRate(buckets(...rows), 2)
        expect(r.rate).toBeNull()
        expect(r.indeterminate).toBe(true)
      }
    })

    it('leaves an all-non-negative portfolio untouched', () => {
      // The boundary: exactly zero is not negative, so it still yields a rate.
      const r = delinquencyRate(buckets(['0.00', false], ['100.00', true]), 2)
      expect(r.indeterminate).toBe(false)
      expect(r.rate).toBe(1)
    })

    // The invariant the guard restores: with no negative component the rate is
    // always a real share of the portfolio.
    it('keeps the rate inside 0..1 for every non-negative portfolio', () => {
      const rows: Array<Array<[string, boolean]>> = [
        [
          ['900.00', false],
          ['100.00', true]
        ],
        [
          ['0.00', false],
          ['0.01', true]
        ],
        [
          ['1000.00', false],
          ['0.00', true]
        ],
        [
          ['1.00', true],
          ['1.00', true]
        ]
      ]
      for (const portfolio of rows) {
        const r = delinquencyRate(buckets(...portfolio), 2)
        if (r.rate !== null) {
          expect(r.rate).toBeGreaterThanOrEqual(0)
          expect(r.rate).toBeLessThanOrEqual(1)
        }
      }
    })
  })

  it('handles zero-decimal currencies via scale (JPY scale 0)', () => {
    // No fractional minor unit: 250 of 1000 → 0.25.
    const r = delinquencyRate(buckets(['750', false], ['250', true]), 0)
    expect(r.overdueMinor).toBe(250n)
    expect(r.totalMinor).toBe(1000n)
    expect(r.rate).toBe(0.25)
  })
})

describe('bucketBand', () => {
  it('reads a single bucket as current (no escalation to show)', () => {
    expect(bucketBand(0, 1)).toBe('current')
  })
  it('bands by ordinal position: first current, last overdue', () => {
    expect(bucketBand(0, 5)).toBe('current')
    expect(bucketBand(1, 5)).toBe('recent')
    expect(bucketBand(2, 5)).toBe('recent')
    expect(bucketBand(3, 5)).toBe('aging')
    expect(bucketBand(4, 5)).toBe('overdue')
  })
})

describe('sumBucketTotals', () => {
  it('sums the grand total through minor units', () => {
    expect(
      sumBucketTotals(
        [
          { label: 'a', count: 1, total: '0.10' },
          { label: 'b', count: 1, total: '0.20' }
        ],
        2
      )
    ).toBe('0.30')
  })
  it('poisons the total to null when one bucket is unparseable', () => {
    expect(
      sumBucketTotals(
        [
          { label: 'a', count: 1, total: '1.00' },
          { label: 'b', count: 1, total: 'oops' }
        ],
        2
      )
    ).toBeNull()
  })
})

describe('DelinquencyAging', () => {
  const PORTFOLIO = [
    { label: 'A vencer', count: 312, total: '900.00', overdue: false },
    { label: '90+', count: 4, total: '100.00', overdue: true }
  ]

  it('states the rate and names the band with an sr-only word', () => {
    const { container } = render(
      <DelinquencyAging buckets={PORTFOLIO} currency="BRL" locale="en-US" />
    )
    // 100.00 of 1000.00 = 10.0%, exactly on the default breach edge (0.1), so
    // the strict-edge rule keeps it in the calmer band.
    expect(container.textContent).toContain('10.0%')
    expect(container.textContent).toContain('Elevada')
  })

  it('announces a distressed rate as an alert', () => {
    const { container } = render(
      <DelinquencyAging
        buckets={[
          { label: 'A vencer', count: 1, total: '500.00', overdue: false },
          { label: '90+', count: 1, total: '500.00', overdue: true }
        ]}
        currency="BRL"
        locale="en-US"
      />
    )
    expect(container.querySelector('[role="alert"]')).not.toBeNull()
    expect(container.textContent).toContain('Em estresse')
  })

  it('renders an explicit empty readout for a zero portfolio, never NaN%', () => {
    const { container } = render(
      <DelinquencyAging
        buckets={[
          { label: 'A vencer', count: 0, total: '0.00', overdue: false }
        ]}
        currency="BRL"
        locale="en-US"
      />
    )
    expect(container.textContent).toContain('sem carteira')
    expect(container.textContent).not.toContain('NaN')
  })

  it('reads an unparseable total as indeterminate', () => {
    const { container } = render(
      <DelinquencyAging
        buckets={[
          { label: 'A vencer', count: 1, total: 'oops', overdue: false }
        ]}
        currency="BRL"
        locale="en-US"
      />
    )
    expect(container.textContent).toContain('indeterminada')
  })

  it('renders the money-math-exact grand total when showTotal is set', () => {
    const { container } = render(
      <DelinquencyAging
        buckets={PORTFOLIO}
        currency="BRL"
        locale="en-US"
        showTotal
      />
    )
    expect(container.textContent).toContain('Total geral')
    expect(container.textContent).toContain('1,000.00')
  })

  // The fixed pt-BR copy is overridable, so a consumer running in another
  // language can translate the ACCESSIBLE band words and captions — `locale`
  // only ever reached the digits. Every override is optional and defaults to the
  // current value, so nothing moves for an existing caller.
  describe('label overrides', () => {
    const EN = {
      rateBandLabels: {
        low: 'Healthy',
        warn: 'Elevated',
        breach: 'Distressed'
      },
      emptyLabel: 'no portfolio',
      indeterminateLabel: 'undetermined',
      bucketLabels: {
        bands: {
          current: 'Current',
          recent: 'Recently overdue',
          aging: 'Overdue',
          overdue: 'Past due'
        },
        count: 'Items',
        total: 'Total',
        grandTotal: 'Grand total'
      }
    } as const

    it('defaults every string to pt-BR when nothing is passed', () => {
      const { container } = render(
        <DelinquencyAging
          buckets={PORTFOLIO}
          currency="BRL"
          locale="en-US"
          showTotal
        />
      )
      const text = container.textContent ?? ''
      expect(text).toContain('Elevada')
      expect(text).toContain('Itens')
      expect(text).toContain('Total geral')
      expect(text).toContain('Em dia')
    })

    it('replaces the rate band word and the bucket copy', () => {
      const { container } = render(
        <DelinquencyAging
          buckets={PORTFOLIO}
          currency="BRL"
          locale="en-US"
          showTotal
          {...EN}
        />
      )
      const text = container.textContent ?? ''
      expect(text).toContain('Elevated')
      expect(text).toContain('Items')
      expect(text).toContain('Grand total')
      expect(text).toContain('Current')
      expect(text).toContain('Past due')
      expect(text).not.toContain('Elevada')
      expect(text).not.toContain('Itens')
      expect(text).not.toContain('Total geral')
      expect(text).not.toContain('Em dia')
    })

    it('merges shallowly — an unlisted band keeps its pt-BR default', () => {
      const { container } = render(
        <DelinquencyAging
          buckets={PORTFOLIO}
          currency="BRL"
          locale="en-US"
          rateBandLabels={{ breach: 'Distressed' }}
          bucketLabels={{ bands: { overdue: 'Past due' } }}
        />
      )
      const text = container.textContent ?? ''
      // The rate sits in warn and the first bucket is current: both unlisted.
      expect(text).toContain('Elevada')
      expect(text).toContain('Em dia')
      expect(text).toContain('Past due')
    })

    it('replaces the empty-portfolio readout', () => {
      const { container } = render(
        <DelinquencyAging
          buckets={[{ label: 'Current', count: 0, total: '0.00' }]}
          currency="BRL"
          {...EN}
        />
      )
      expect(container.textContent).toContain('no portfolio')
      expect(container.textContent).not.toContain('sem carteira')
    })

    it('replaces the indeterminate readout', () => {
      const { container } = render(
        <DelinquencyAging
          buckets={[{ label: 'Current', count: 1, total: 'oops' }]}
          currency="BRL"
          {...EN}
        />
      )
      expect(container.textContent).toContain('undetermined')
      expect(container.textContent).not.toContain('indeterminada')
    })
  })

  // THIRD RAIL: the printed digits must be the digits that were summed. The
  // arithmetic already ran at the currency's CLDR scale; when that scale was not
  // also handed to MoneyText the readout fell back to two fraction digits, so a
  // zero-decimal currency printed decimals it does not have and a three-decimal
  // currency had its EXACT grand total re-rounded on the way to the screen.
  describe('prints every figure at the currency scale', () => {
    it('gives JPY (scale 0) no decimals in the rows or the grand total', () => {
      const { container } = render(
        <DelinquencyAging
          buckets={[
            { label: 'A vencer', count: 2, total: '1000', overdue: false },
            { label: '90+', count: 1, total: '2000', overdue: true }
          ]}
          currency="JPY"
          locale="en-US"
          showTotal
        />
      )
      const text = container.textContent ?? ''
      expect(text).toContain('1,000')
      expect(text).toContain('2,000')
      expect(text).toContain('3,000')
      // The regression: '1,000.00' / '3,000.00' — two decimals the yen has not
      // had since 1953.
      expect(text).not.toContain('.00')
    })

    it('prints the exact BHD (scale 3) grand total without re-rounding it', () => {
      const { container } = render(
        <DelinquencyAging
          buckets={[
            { label: 'A vencer', count: 1, total: '0.500', overdue: false },
            { label: '90+', count: 1, total: '0.505', overdue: true }
          ]}
          currency="BHD"
          locale="en-US"
          showTotal
        />
      )
      const text = container.textContent ?? ''
      expect(text).toContain('0.500')
      expect(text).toContain('0.505')
      // sumMinor at scale 3 → 1005 fils → the exact '1.005'. The regression
      // printed '1.01', a total that disagreed with its own summands.
      expect(text).toContain('1.005')
      expect(text).not.toContain('1.01')
    })
  })
})
