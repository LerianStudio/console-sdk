import { cn, LABEL_VOICE_CLASS, SECTION_LABEL_CLASS } from '..'

/**
 * The three highest-frequency non-component imports in the migrating apps.
 * Importing them from the package root (not from their source modules) is the
 * point: this asserts the public barrel actually re-exports them.
 */

describe('utility exports', () => {
  describe('cn', () => {
    it('joins class names', () => {
      expect(cn('a', 'b')).toBe('a b')
    })

    it('drops falsy values', () => {
      expect(cn('a', false, undefined, null, 'b')).toBe('a b')
    })

    it('lets the last conflicting tailwind utility win', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4')
    })
  })

  describe('typography voice constants', () => {
    /**
     * The voice is product-console's table head, not the retired Ledger
     * small-caps: `TableHead` paints `text-muted-foreground … font-medium`
     * inside a `text-sm` `Table` (components/ui/table/index.tsx:20,90), and
     * product-console renders its whole data table through that primitive
     * (src/components/table/data-table.tsx:14). Sentence case, no tracking,
     * no fixed pixel size.
     */
    it('LABEL_VOICE_CLASS is product-console table-head voice', () => {
      expect(LABEL_VOICE_CLASS).toBe(
        'text-sm font-medium text-muted-foreground'
      )
    })

    it('carries no retired Ledger small-caps token', () => {
      expect(LABEL_VOICE_CLASS).not.toMatch(
        /uppercase|tracking-\[|text-\[\d+px\]/
      )
    })

    it('SECTION_LABEL_CLASS shares the label voice', () => {
      expect(SECTION_LABEL_CLASS).toBe(LABEL_VOICE_CLASS)
    })

    it('composes with cn without the voice collapsing', () => {
      expect(cn(LABEL_VOICE_CLASS, 'text-foreground')).toContain(
        'text-foreground'
      )
    })
  })
})
