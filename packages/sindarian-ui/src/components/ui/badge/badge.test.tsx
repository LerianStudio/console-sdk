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

describe('Badge token hygiene', () => {
  it('declares no raw palette colors anywhere in the source', () => {
    const source = readFileSync(join(__dirname, 'index.tsx'), 'utf8')

    expect(source).not.toMatch(
      /(?:bg|text|border)-(?:red|green|yellow|amber)-\d/
    )
  })
})
