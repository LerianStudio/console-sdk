/**
 * gaugeBand — the band classifier. Ported from sindarian-x@0.15.0's
 * `src/components/ledger/threshold-gauge.test.ts`, pinning the STRICT-edge
 * invariant: a value exactly on a threshold stays in the calmer band,
 * escalation needs the value strictly past. The render block covers the sr-only
 * band word (the only NON-chromatic band cue, WCAG 1.4.1) and the readout.
 */
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

import { ThresholdGauge, gaugeBand } from '.'
import type { ThresholdGaugeProps } from '.'

// higher-is-worse: value climbs into danger. warn < breach (e.g. utilization).
const HIGH = { warn: 0.8, breach: 0.9 }
// lower-is-worse: value falls into danger. breach < warn (e.g. coverage ratio).
const LOW = { warn: 1.0, breach: 0.9 }

describe('gaugeBand — strict edges (default)', () => {
  it('higher-is-worse: below warn → low', () => {
    expect(gaugeBand(0.5, HIGH, 'higher-is-worse')).toBe('low')
  })
  it('higher-is-worse: exactly on warn stays low', () => {
    expect(gaugeBand(0.8, HIGH, 'higher-is-worse')).toBe('low')
  })
  it('higher-is-worse: just past warn → warn', () => {
    expect(gaugeBand(0.8001, HIGH, 'higher-is-worse')).toBe('warn')
  })
  it('higher-is-worse: exactly on breach stays warn', () => {
    expect(gaugeBand(0.9, HIGH, 'higher-is-worse')).toBe('warn')
  })
  it('higher-is-worse: just past breach → breach', () => {
    expect(gaugeBand(0.9001, HIGH, 'higher-is-worse')).toBe('breach')
  })

  it('lower-is-worse: above warn → low', () => {
    expect(gaugeBand(1.2, LOW, 'lower-is-worse')).toBe('low')
  })
  it('lower-is-worse: exactly on warn stays low', () => {
    expect(gaugeBand(1.0, LOW, 'lower-is-worse')).toBe('low')
  })
  it('lower-is-worse: just below warn → warn', () => {
    expect(gaugeBand(0.9999, LOW, 'lower-is-worse')).toBe('warn')
  })
  it('lower-is-worse: exactly on breach stays warn', () => {
    expect(gaugeBand(0.9, LOW, 'lower-is-worse')).toBe('warn')
  })
  it('lower-is-worse: just below breach → breach', () => {
    expect(gaugeBand(0.8999, LOW, 'lower-is-worse')).toBe('breach')
  })

  // Degradation: a non-finite reading is not, by itself, an alarm.
  it('degrades a non-finite value to low in both directions', () => {
    expect(gaugeBand(NaN, HIGH, 'higher-is-worse')).toBe('low')
    expect(gaugeBand(Number.POSITIVE_INFINITY, LOW, 'lower-is-worse')).toBe(
      'low'
    )
  })
})

// edges: 'inclusive' — for consumers whose enforcement is inclusive (a quota
// that blocks at `used >= limit`): a value exactly ON a threshold IS already
// past it, so it must escalate. Opt-in; the default stays strict.
const HIGH_IN = { ...HIGH, edges: 'inclusive' } as const
const LOW_IN = { ...LOW, edges: 'inclusive' } as const

describe("gaugeBand — edges: 'inclusive'", () => {
  it('higher-is-worse: exactly on breach → breach', () => {
    expect(gaugeBand(0.9, HIGH_IN, 'higher-is-worse')).toBe('breach')
  })
  it('higher-is-worse: exactly on warn → warn', () => {
    expect(gaugeBand(0.8, HIGH_IN, 'higher-is-worse')).toBe('warn')
  })
  it('higher-is-worse: strictly between warn and breach → warn', () => {
    expect(gaugeBand(0.85, HIGH_IN, 'higher-is-worse')).toBe('warn')
  })
  it('higher-is-worse: below warn → low', () => {
    expect(gaugeBand(0.5, HIGH_IN, 'higher-is-worse')).toBe('low')
  })

  it('lower-is-worse: exactly on breach → breach', () => {
    expect(gaugeBand(0.9, LOW_IN, 'lower-is-worse')).toBe('breach')
  })
  it('lower-is-worse: exactly on warn → warn', () => {
    expect(gaugeBand(1.0, LOW_IN, 'lower-is-worse')).toBe('warn')
  })
  it('lower-is-worse: strictly between breach and warn → warn', () => {
    expect(gaugeBand(0.95, LOW_IN, 'lower-is-worse')).toBe('warn')
  })
  it('lower-is-worse: above warn → low', () => {
    expect(gaugeBand(1.2, LOW_IN, 'lower-is-worse')).toBe('low')
  })

  it('still degrades a non-finite value to low', () => {
    expect(gaugeBand(NaN, HIGH_IN, 'higher-is-worse')).toBe('low')
    expect(gaugeBand(Number.NEGATIVE_INFINITY, LOW_IN, 'lower-is-worse')).toBe(
      'low'
    )
  })
})

describe("gaugeBand — explicit edges: 'strict' equals the omitted default", () => {
  const HIGH_STRICT = { ...HIGH, edges: 'strict' } as const
  const LOW_STRICT = { ...LOW, edges: 'strict' } as const

  it('agrees with the default in both directions', () => {
    expect(gaugeBand(0.9, HIGH_STRICT, 'higher-is-worse')).toBe('warn')
    expect(gaugeBand(0.8, HIGH_STRICT, 'higher-is-worse')).toBe('low')
    expect(gaugeBand(0.9, LOW_STRICT, 'lower-is-worse')).toBe('warn')
    expect(gaugeBand(1.0, LOW_STRICT, 'lower-is-worse')).toBe('low')
  })
})

/** A count-format gauge on a 0..100 track: warn 80, breach 90, higher-is-worse. */
function gaugeHtml(props: Partial<ThresholdGaugeProps>): string {
  const { container } = render(
    <ThresholdGauge
      value={62}
      max={100}
      warn={80}
      breach={90}
      direction="higher-is-worse"
      format="count"
      locale="en-US"
      {...props}
    />
  )
  return container.innerHTML
}

describe('ThresholdGauge render', () => {
  // The defaults are pt-BR and STAY pt-BR — changing them would change every
  // existing consumer's rendered output.
  it('defaults the band words to pt-BR (all three bands)', () => {
    expect(gaugeHtml({ value: 62 })).toMatch(/Dentro do limite/)
    expect(gaugeHtml({ value: 85 })).toMatch(/Próximo do limite/)
    expect(gaugeHtml({ value: 95 })).toMatch(/Limite ultrapassado/)
  })

  it('lets bandLabels override the sr-only band word', () => {
    const html = gaugeHtml({
      value: 95,
      bandLabels: {
        low: 'Within limit',
        warn: 'Near limit',
        breach: 'Limit exceeded'
      }
    })
    expect(html).toMatch(/Limit exceeded/)
    expect(html).not.toMatch(/Limite ultrapassado/)
  })

  it('merges bandLabels shallowly — an unlisted band keeps its pt-BR default', () => {
    expect(
      gaugeHtml({ value: 62, bandLabels: { breach: 'Limit exceeded' } })
    ).toMatch(/Dentro do limite/)
  })

  it('reaches every band with bandLabels', () => {
    const bandLabels = {
      low: 'Within limit',
      warn: 'Near limit',
      breach: 'Limit exceeded'
    }
    expect(gaugeHtml({ value: 62, bandLabels })).toMatch(/Within limit/)
    expect(gaugeHtml({ value: 85, bandLabels })).toMatch(/Near limit/)
    expect(gaugeHtml({ value: 95, bandLabels })).toMatch(/Limit exceeded/)
  })

  // displayValue — a consumer keeping `aria-valuenow` inside [min, max] has to
  // clamp `value`; the readout must still be able to state the TRUE figure.
  it('follows value in the readout when displayValue is omitted', () => {
    const html = gaugeHtml({
      value: 1_000_000,
      max: 1_000_000,
      warn: 800_000,
      breach: 900_000
    })
    expect(html).toMatch(/>1,000,000</)
    expect(html).toMatch(/aria-valuenow="1000000"/)
  })

  it('lets displayValue drive the readout while value keeps band and ARIA', () => {
    const html = gaugeHtml({
      value: 1_000_000, // clamped to max, so aria-valuenow stays in range
      displayValue: 1_100_000, // the true consumed figure, past the cap
      max: 1_000_000,
      warn: 800_000,
      breach: 900_000
    })
    // The readout states the true figure…
    expect(html).toMatch(/>1,100,000</)
    expect(html).not.toMatch(/>1,000,000</)
    // …while every ARIA attribute and the track still describe the clamped value.
    expect(html).toMatch(/aria-valuenow="1000000"/)
    expect(html).toMatch(/aria-valuemax="1000000"/)
    expect(html).toMatch(/width: 100%/)
  })

  it('does not let displayValue move the band', () => {
    // value sits in warn; a breach-sized displayValue must NOT escalate the band.
    const html = gaugeHtml({ value: 85, displayValue: 200 })
    expect(html).toMatch(/Próximo do limite/)
    expect(html).not.toMatch(/Limite ultrapassado/)
    expect(html).toMatch(/>200</)
  })

  it('routes format="money" through MoneyText', () => {
    const html = gaugeHtml({
      value: 1250,
      max: 5000,
      warn: 4000,
      breach: 4500,
      format: 'money',
      currency: 'BRL'
    })
    expect(html).toMatch(/1,250\.00/)
    expect(html).toMatch(/BRL/)
  })
})
