export const THEMES = ['light', 'dark'] as const

export type Theme = (typeof THEMES)[number]

export const THEME_SELECTORS: Readonly<Record<Theme, string>> = {
  light: ':root',
  dark: '.dark'
}

/**
 * Every colour token palette.css declares, in both themes.
 *
 * This list is the package's public contract, not documentation: the contrast
 * suite asserts it matches the `:root` and `.dark` blocks exactly, in both
 * directions, so a token added to the stylesheet without being added here (or
 * vice versa) fails the build.
 */
export const TOKEN_NAMES = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'success',
  'success-foreground',
  'warning',
  'warning-foreground',
  'info',
  'info-foreground',
  'border',
  'input',
  'ring',
  'sidebar',
  'sidebar-foreground',
  'sidebar-accent',
  'sidebar-accent-foreground',
  'sidebar-border',
  'shadcn-100',
  'shadcn-200',
  'shadcn-300',
  'shadcn-400',
  'shadcn-500',
  'shadcn-600',
  'shadcn-700',
  'shadcn-800'
] as const

export type TokenName = (typeof TOKEN_NAMES)[number]
