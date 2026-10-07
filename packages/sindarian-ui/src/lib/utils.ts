import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * The kit's button variants are component classes in `@layer components`, not
 * Tailwind utilities, so stock tailwind-merge has no group for them: it kept
 * `button-primary button-destructive` together and let stylesheet source order
 * pick the winner. Declaring the group makes the last one win, like every other
 * conflict `cn` resolves.
 *
 * Variant classes only. `button-base`, `button-disabled`, `button-read-only`
 * and `button-small` compose with a variant instead of conflicting with it, so
 * they stay out of the group and are never merged away.
 */
const twMerge = extendTailwindMerge<'sindarian-button-variant'>({
  extend: {
    classGroups: {
      'sindarian-button-variant': [
        'button-plain',
        'button-primary',
        'button-secondary',
        'button-tertiary',
        'button-outline',
        'button-link',
        'button-destructive'
      ]
    }
  }
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Wraps a Radix `onInteractOutside` so a press on a toast never dismisses the layer under it. */
export function keepOpenOnToast<E extends Event>(
  onInteractOutside?: (event: E) => void
) {
  return (event: E) => {
    if (
      (event.target as HTMLElement | null)?.closest('[data-sonner-toaster]')
    ) {
      event.preventDefault()
      return
    }
    onInteractOutside?.(event)
  }
}
