import '@testing-library/jest-dom'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'

import { Badge } from '.'

/**
 * The destructive variant used to hard-code `bg-red-500 text-primary-foreground`,
 * which measured ~3.98:1 in dark (WCAG AA fail) and was one of only three raw
 * palette sites left in the kit. It now reads the `--destructive` token pair by
 * NAME; the dark channel value itself is owned by globals.css.
 */
describe('Badge destructive variant', () => {
  it('reads the destructive token pair instead of a raw palette color', () => {
    render(<Badge variant="destructive">Overdue</Badge>)

    expect(screen.getByText('Overdue')).toHaveClass(
      'bg-destructive',
      'text-destructive-foreground'
    )
  })

  it('keeps the borderless fill of its sibling solid variants', () => {
    render(<Badge variant="destructive">Overdue</Badge>)

    expect(screen.getByText('Overdue')).toHaveClass('border-transparent')
  })
})

/**
 * `credit` is the accounting reading of a credit amount — deliberately NOT an
 * alias of `destructive` (an error/alarm). The credit role is a TINT-and-INK
 * pair: `--credit-foreground` mirrors `--credit` by contract
 * (see src/__tests__/tokens-contract.test.ts), so the red carries the role as
 * text over a tinted surface. A solid `bg-credit` fill under
 * `text-credit-foreground` would render red-on-red and be invisible.
 */
describe('Badge credit variant', () => {
  it('renders a tinted surface with the credit ink, never a solid fill', () => {
    render(<Badge variant="credit">Credit</Badge>)

    const badge = screen.getByText('Credit')
    expect(badge).toHaveClass('bg-credit/10', 'text-credit-foreground')
    // A solid fill would collapse the mirrored token pair into red-on-red.
    expect(badge).not.toHaveClass('bg-credit')
  })

  it('carries a credit-tinted border, not the neutral default', () => {
    render(<Badge variant="credit">Credit</Badge>)

    const badge = screen.getByText('Credit')
    expect(badge).toHaveClass('border-credit/30')
    expect(badge).not.toHaveClass('border-border')
  })

  it('is distinct from the destructive variant', () => {
    const { rerender } = render(<Badge variant="credit">Amount</Badge>)
    const credit = screen.getByText('Amount').className

    rerender(<Badge variant="destructive">Amount</Badge>)
    const destructive = screen.getByText('Amount').className

    expect(credit).not.toBe(destructive)
  })
})

describe('Badge token hygiene', () => {
  it('declares no raw palette colors anywhere in the source', () => {
    const source = readFileSync(join(__dirname, 'index.tsx'), 'utf8')

    expect(source).not.toMatch(
      /(?:bg|text|border)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d/
    )
  })
})
