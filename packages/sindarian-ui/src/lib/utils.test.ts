import { cn } from './utils'

describe('cn', () => {
  it('still resolves stock Tailwind conflicts later-wins', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('keeps non-conflicting classes', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center')
  })

  it('applies clsx conditionals', () => {
    const isHidden: boolean = false

    expect(cn('flex', isHidden && 'hidden', ['gap-2'])).toBe('flex gap-2')
  })

  describe('the button-* variant group', () => {
    it('resolves two button variants later-wins', () => {
      expect(cn('button-primary', 'button-destructive')).toBe(
        'button-destructive'
      )
    })

    it('resolves every pairing in the group', () => {
      const variants = [
        'button-plain',
        'button-primary',
        'button-secondary',
        'button-tertiary',
        'button-outline',
        'button-link',
        'button-destructive'
      ]

      for (const earlier of variants) {
        for (const later of variants) {
          if (earlier === later) continue
          expect(cn(earlier, later)).toBe(later)
        }
      }
    })

    it('leaves the composing button classes alone', () => {
      // base/disabled/read-only/small compose with a variant; they do not
      // conflict with it, so none of them may be merged away.
      expect(
        cn(
          'button-base button-disabled button-read-only button-small',
          'button-destructive'
        )
      ).toBe(
        'button-base button-disabled button-read-only button-small button-destructive'
      )
    })

    it('does not touch the icon-button classes', () => {
      expect(cn('icon-button-base', 'icon-button-rounded')).toBe(
        'icon-button-base icon-button-rounded'
      )
    })
  })
})
