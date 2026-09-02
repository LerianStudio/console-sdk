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

/**
 * Class strings captured from the component BEFORE the `size` axis existed.
 * An omitted size — and an explicit `size="default"` — must reproduce them byte
 * for byte; that is the whole guarantee that adding the axis broke no consumer.
 *
 * `cn` runs everything through tailwind-merge (see `src/lib/utils.ts`), which is
 * why the base `border-border` and `px-2.5 py-0.5` are absent from variants that
 * declare their own border color or padding: the merge already dropped them.
 * The same merge is what lets `sm` win over the base `text-sm`.
 */
const BEFORE_SIZE_AXIS = {
  default:
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
  credit:
    'inline-flex items-center rounded-full border text-sm font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 border-credit/30 bg-credit/10 text-credit-foreground px-[10px] py-1',
  outline:
    'inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-sm font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground'
} as const

describe('Badge default size', () => {
  it('renders the pre-size-axis class string when size is omitted', () => {
    render(<Badge>Default</Badge>)

    expect(screen.getByText('Default')).toHaveAttribute(
      'class',
      BEFORE_SIZE_AXIS.default
    )
  })

  it('renders the pre-size-axis class string for a padded system variant', () => {
    render(<Badge variant="credit">Credit</Badge>)

    expect(screen.getByText('Credit')).toHaveAttribute(
      'class',
      BEFORE_SIZE_AXIS.credit
    )
  })

  it('renders the pre-size-axis class string for the outline variant', () => {
    render(<Badge variant="outline">Outline</Badge>)

    expect(screen.getByText('Outline')).toHaveAttribute(
      'class',
      BEFORE_SIZE_AXIS.outline
    )
  })

  it('treats an explicit size="default" as the omitted size', () => {
    render(<Badge size="default">Explicit</Badge>)

    expect(screen.getByText('Explicit')).toHaveAttribute(
      'class',
      BEFORE_SIZE_AXIS.default
    )
  })
})

describe('Badge size="sm"', () => {
  it('applies the 11px micro-badge type size', () => {
    render(<Badge size="sm">Small</Badge>)

    expect(screen.getByText('Small')).toHaveClass('text-[11px]')
  })

  it('drops the base text-sm through tailwind-merge', () => {
    render(<Badge size="sm">Small</Badge>)

    expect(screen.getByText('Small')).not.toHaveClass('text-sm')
  })

  it('changes the type size and nothing else', () => {
    render(<Badge size="sm">Small</Badge>)

    const actual = screen.getByText('Small').className.split(' ')
    const expected = BEFORE_SIZE_AXIS.default
      .split(' ')
      .map((token) => (token === 'text-sm' ? 'text-[11px]' : token))

    expect(new Set(actual)).toEqual(new Set(expected))
  })

  it('composes with a variant that sets its own padding', () => {
    render(
      <Badge variant="credit" size="sm">
        Credit sm
      </Badge>
    )

    const badge = screen.getByText('Credit sm')
    expect(badge).toHaveClass('text-[11px]', 'px-[10px]', 'py-1')
    expect(badge).not.toHaveClass('text-sm')
  })
})
