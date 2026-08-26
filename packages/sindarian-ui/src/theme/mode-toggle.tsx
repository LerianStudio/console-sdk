'use client'

/**
 * ModeToggle — compact segmented light/system/dark control.
 *
 * Follows the lib's segmented canon: a `role="group"` with an aria-label, each
 * segment a button carrying `aria-pressed`, the active segment marked with the
 * `bg-secondary` tone. Icon-only segments and the group itself carry
 * plain-English aria-labels by default; pass `labels` to localize them
 * (`labels.group` names the whole control). Theme switches are instant — the
 * 150ms transition is the local color-only hover affordance.
 */
import * as React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useTheme, type ThemePreference } from './theme-provider'

export interface ModeToggleLabels {
  light?: string
  system?: string
  dark?: string
  /** aria-label for the whole control (the `role="group"`); default "Theme". */
  group?: string
}

export interface ModeToggleProps {
  /** aria-label overrides for each segment and the group; default plain English. */
  labels?: ModeToggleLabels
  className?: string
}

const SEGMENTS = [
  { value: 'light', icon: Sun },
  { value: 'system', icon: Monitor },
  { value: 'dark', icon: Moon }
] as const satisfies readonly {
  value: ThemePreference
  icon: typeof Sun
}[]

const DEFAULT_LABELS: Required<ModeToggleLabels> = {
  light: 'Light',
  system: 'System',
  dark: 'Dark',
  group: 'Theme'
}

/**
 * Merge overrides over the defaults, IGNORING blank ones. A plain spread lets
 * `labels={{ light: '' }}` win, and every segment here is icon-only — so a blank
 * override leaves a button (or the whole group) with `aria-label=""`, which names
 * it "" AND suppresses the element's other naming routes. That is strictly worse
 * than the missing translation it came from: an untranslated English label is
 * usable, a nameless button is not. A blank string is a missing value, not a
 * chosen one.
 */
function resolveLabels(labels?: ModeToggleLabels): Required<ModeToggleLabels> {
  const resolved = { ...DEFAULT_LABELS }
  for (const key of Object.keys(DEFAULT_LABELS) as (keyof ModeToggleLabels)[]) {
    const override = labels?.[key]
    if (override?.trim()) resolved[key] = override
  }
  return resolved
}

export function ModeToggle({ labels, className }: ModeToggleProps) {
  const { theme, setTheme } = useTheme()
  const resolved = resolveLabels(labels)

  return (
    <div
      role="group"
      aria-label={resolved.group}
      className={cn(
        'border-input bg-card grid w-fit grid-cols-3 rounded-md border p-0.5 shadow-[var(--shadow-card)]',
        className
      )}
    >
      {SEGMENTS.map(({ value, icon: Icon }) => {
        const active = value === theme
        const label = resolved[value]
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              'focus-visible:ring-ring flex items-center justify-center rounded-sm px-2 py-1.5 transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:outline-none',
              active
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-4" aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
