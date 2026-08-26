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
    it('LABEL_VOICE_CLASS is the quiet uppercase label cluster', () => {
      expect(LABEL_VOICE_CLASS).toBe(
        'text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground'
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
