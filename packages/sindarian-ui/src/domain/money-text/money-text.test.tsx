/**
 * MoneyText: the pure formatting core (ported from sindarian-x@0.15.0's
 * `format.test.ts` money block) plus the render path — negative / positive /
 * zero / multi-currency / no-value.
 */
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

import { NO_VALUE } from '../format'
import { MoneyText, formatMoneyParts, normalizeAmount } from '.'

describe('formatMoneyParts', () => {
  it('returns null for NaN/Infinity (no literal "NaN"/"∞")', () => {
    expect(formatMoneyParts('abc', 2, 'en-US')).toBeNull()
    expect(formatMoneyParts(NaN, 2, 'en-US')).toBeNull()
    expect(formatMoneyParts(Infinity, 2, 'en-US')).toBeNull()
  })

  it('reads the unicode minus U+2212 as a negative', () => {
    expect(formatMoneyParts('−45.5', 2, 'en-US')).toEqual({
      formatted: '-45.50',
      negative: true
    })
  })

  it('reads accounting parens (123.45) as -123.45 negative', () => {
    expect(formatMoneyParts('(123.45)', 2, 'en-US')).toEqual({
      formatted: '-123.45',
      negative: true
    })
  })

  it('treats numeric -0 as non-negative (no credit tone)', () => {
    expect(formatMoneyParts(-0, 2, 'en-US')).toEqual({
      formatted: '0.00',
      negative: false
    })
  })

  it('returns null for whitespace (NO_VALUE upstream)', () => {
    expect(formatMoneyParts('   ', 2, 'en-US')).toBeNull()
  })

  // CodeRabbit #6 — DELIBERATE DIVERGENCE from sindarian-x@0.15.0, which
  // reported these as { formatted: '-0.00', negative: true }, painting a zero
  // balance in the destructive sign color.
  it('normalizes an exact signed zero to unsigned', () => {
    for (const zero of ['-0', '-0.00', '(0)', '(0.00)', '−0.00']) {
      expect(formatMoneyParts(zero, 2, 'en-US')).toEqual({
        formatted: '0.00',
        negative: false
      })
    }
  })

  // The divergence is narrow on purpose: a value BELOW zero that merely rounds
  // to zero at this scale is still negative, and must keep its sign.
  it('keeps the sign on a value that only rounds to zero', () => {
    expect(formatMoneyParts('-0.004', 2, 'en-US')).toEqual({
      formatted: '-0.00',
      negative: true
    })
  })

  // CodeRabbit #7: fractionDigits is caller-supplied and reached Intl raw.
  it('returns null for an out-of-range fractionDigits instead of throwing', () => {
    for (const digits of [-1, 1.5, 101, NaN, Infinity]) {
      expect(() => formatMoneyParts('1.00', digits, 'en-US')).not.toThrow()
      expect(formatMoneyParts('1.00', digits, 'en-US')).toBeNull()
    }
  })

  it('preserves 20+ significant digits', () => {
    expect(
      formatMoneyParts('12345678901234567890.12', 2, 'en-US')?.formatted
    ).toBe('12,345,678,901,234,567,890.12')
  })
})

describe('normalizeAmount', () => {
  it('trims, converts the unicode minus, and unwraps parens', () => {
    expect(normalizeAmount('  12.30 ')).toBe('12.30')
    expect(normalizeAmount('−45.5')).toBe('-45.5')
    expect(normalizeAmount('( 123.45 )')).toBe('-123.45')
  })
  it('returns null for an empty value', () => {
    expect(normalizeAmount('   ')).toBeNull()
  })
})

describe('MoneyText', () => {
  it('renders a positive amount with the currency suffix', () => {
    const { container } = render(
      <MoneyText amount="1250.00" currency="BRL" locale="en-US" />
    )
    expect(container.textContent).toBe('1,250.00BRL')
  })

  it('renders a negative amount in the destructive sign color', () => {
    const { container } = render(
      <MoneyText amount="-45.50" currency="BRL" locale="en-US" />
    )
    expect(container.textContent).toBe('-45.50BRL')
    expect(container.firstElementChild).toHaveClass('text-destructive')
  })

  // The load-bearing distinction: sign color and the accounting CREDIT role are
  // two different things. A consumer layers `text-credit` on top (matcher's fork
  // pairs it with signColor={false}); the base must never spend that token on a
  // negative sign, or the two roles collapse into one.
  it('never spends the credit role on the sign color', () => {
    const { container } = render(<MoneyText amount="-45.50" locale="en-US" />)
    expect(container.firstElementChild).not.toHaveClass('text-credit')
  })

  it('does not color a positive amount', () => {
    const { container } = render(<MoneyText amount="45.50" locale="en-US" />)
    expect(container.firstElementChild).not.toHaveClass('text-destructive')
  })

  it('honours signColor={false} on a negative amount', () => {
    const { container } = render(
      <MoneyText amount="-45.50" signColor={false} locale="en-US" />
    )
    expect(container.firstElementChild).not.toHaveClass('text-destructive')
  })

  it('renders zero without the sign color', () => {
    const { container } = render(<MoneyText amount="0.00" locale="en-US" />)
    expect(container.textContent).toBe('0.00')
    expect(container.firstElementChild).not.toHaveClass('text-destructive')
  })

  // Zero is neither positive nor negative, however the caller wrote it.
  it('renders an exact signed zero unsigned and uncolored', () => {
    for (const zero of [-0, '-0', '-0.00', '(0)'] as const) {
      const { container } = render(<MoneyText amount={zero} locale="en-US" />)
      expect(container.textContent).toBe('0.00')
      expect(container.firstElementChild).not.toHaveClass('text-destructive')
    }
  })

  it('degrades to the no-value placeholder on an out-of-range fractionDigits', () => {
    const { container } = render(
      <MoneyText amount="1250.00" fractionDigits={-1} locale="en-US" />
    )
    expect(container.textContent).toBe(NO_VALUE)
  })

  it('renders the no-value placeholder for null/undefined/empty', () => {
    for (const amount of [null, undefined, '']) {
      const { container } = render(<MoneyText amount={amount} currency="BRL" />)
      expect(container.textContent).toBe(NO_VALUE)
    }
  })

  it('renders the no-value placeholder for an unparseable amount', () => {
    const { container } = render(<MoneyText amount="abc" currency="BRL" />)
    expect(container.textContent).toBe(NO_VALUE)
  })

  it('hides the currency when hideCurrency is set', () => {
    const { container } = render(
      <MoneyText amount="10.00" currency="USD" hideCurrency locale="en-US" />
    )
    expect(container.textContent).toBe('10.00')
  })

  it('keeps mixed-currency ledgers unambiguous via the ISO suffix', () => {
    const { container } = render(
      <>
        <MoneyText amount="10.00" currency="BRL" locale="en-US" />
        <MoneyText amount="10.00" currency="USD" locale="en-US" />
        <MoneyText
          amount="1000"
          currency="JPY"
          fractionDigits={0}
          locale="en-US"
        />
      </>
    )
    expect(container.textContent).toBe('10.00BRL10.00USD1,000JPY')
  })

  // A malformed BCP 47 tag makes Intl.NumberFormat throw a RangeError. That
  // escaped formatMoneyParts' null fallback, so MoneyText THREW during render
  // instead of degrading — a blank money surface over a bad locale string.
  it.each([[''], ['en_US'], ['x'], ['123'], ['xx-YY-ZZ-bad--']])(
    'renders the amount despite the malformed locale %p',
    (locale) => {
      // Expected string derived from the HOST locale with MoneyText's own
      // options, never hard-coded: the fallback is "the runtime locale", so a
      // literal '1,234.50' would fail on a host whose default renders
      // non-ASCII digits for output that is perfectly correct.
      const hostAmount = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(1234.5)

      const { container } = render(
        <MoneyText amount="1234.50" currency="BRL" locale={locale} />
      )
      expect(container.textContent).toContain(hostAmount)
      expect(container.textContent).toContain('BRL')
    }
  )

  it('still honours a VALID locale (the fallback is not unconditional)', () => {
    const { container } = render(<MoneyText amount="1234.50" locale="de-DE" />)
    expect(container.textContent).toContain('1.234,50')
  })

  it('always carries tabular figures so columns line up', () => {
    const { container } = render(<MoneyText amount="1.00" locale="en-US" />)
    expect(container.firstElementChild).toHaveClass('tabular-nums')
  })
})
