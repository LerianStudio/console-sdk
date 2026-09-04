/**
 * StatusBadge maps a status/severity string to a Badge variant and a humanized
 * label. Unknown values fall back to a neutral "outline" badge with a
 * title-cased label, so new server enum values never render raw or crash.
 *
 * The variant map is injectable (`variantMap`) and shallow-merges over a
 * generic lifecycle default, so apps extend it with their own domain statuses
 * without forking the component.
 *
 * INVARIANT (WCAG 1.4.1): the bare badge is color-only — the variant tint is the
 * sole carrier of severity. That is a non-color-cue failure for a severity badge
 * (a CRITICAL risk band must read as critical in grayscale and to a color-blind
 * reader). `withIcon` opts the badge into the non-color canon: a leading
 * severity GLYPH plus an sr-only severity word, with the tint as reinforcement
 * only. It is opt-in so existing color-only usage is unaffected.
 *
 * Pure display: no directive, no interactivity. A leading lucide glyph is
 * server-safe, so the component stays RSC-safe for the consuming Next.js app.
 */
import { Check, Minus, OctagonX, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Badge, type BadgeProps } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type BadgeVariant = NonNullable<BadgeProps['variant']>

/**
 * Generic lifecycle defaults — extend per-app via the `variantMap` prop.
 *
 * The KEYS are the frozen legacy contract (apps merge their own domain statuses
 * into this map). The VALUES are sindarian-ui Badge variants: sindarian-ui is
 * senior, so the legacy `muted`/`warning` variants resolve to sindarian-ui's
 * `inactive`/`alert`.
 */
export const DEFAULT_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  DRAFT: 'inactive',
  ACTIVE: 'success',
  ENABLED: 'success',
  INACTIVE: 'inactive',
  DISABLED: 'inactive',
  PAUSED: 'alert',
  ARCHIVED: 'inactive',
  QUEUED: 'secondary',
  PENDING: 'alert',
  PROCESSING: 'alert',
  RUNNING: 'alert',
  COMPLETE: 'success',
  COMPLETED: 'success',
  SUCCEEDED: 'success',
  SUCCESS: 'success',
  FAILED: 'destructive',
  ERROR: 'destructive',
  CANCELED: 'inactive',
  CANCELLED: 'inactive',
  EXPIRED: 'inactive',
  OPEN: 'alert',
  RESOLVED: 'success',
  REJECTED: 'destructive',
  CONFIRMED: 'success',
  LOW: 'inactive',
  MEDIUM: 'secondary',
  HIGH: 'alert',
  CRITICAL: 'destructive'
}

/**
 * Variant → non-color severity cue: a distinct glyph + an sr-only severity word.
 * This is the load-bearing cue when `withIcon` is set; the Badge's own tint only
 * reinforces it, so severity survives grayscale and color-vision deficiency.
 *
 * A constant lookup keyed on the Badge variant — the variant already encodes the
 * severity, so the glyph follows the variant rather than re-deriving severity
 * from the raw status. `secondary` is a neutral bucket (e.g. MEDIUM/QUEUED) and,
 * like `inactive`, carries the calm dash glyph. The pure color-carrier variants
 * and the unknown `outline` fallback have no severity semantics, so they render
 * no glyph.
 */
const SEVERITY_CUE: Partial<
  Record<BadgeVariant, { Icon: LucideIcon; word: string }>
> = {
  success: { Icon: Check, word: 'OK' },
  alert: { Icon: TriangleAlert, word: 'Warning' },
  destructive: { Icon: OctagonX, word: 'Critical' },
  inactive: { Icon: Minus, word: 'Neutral' },
  secondary: { Icon: Minus, word: 'Neutral' }
}

/**
 * Merge a caller's map over the defaults, upper-casing its KEYS.
 *
 * Lookup has always upper-cased the incoming `status`, but sindarian-x merged
 * `variantMap` verbatim — so `{ reconciled: 'success' }` could never match and
 * fell through to the neutral `outline` badge, silently. That was an unstated
 * requirement rather than a design choice: lender's own call sites work around
 * it by hand (`variantMap={{ [reason.toUpperCase()]: 'destructive' }}`).
 * Normalising here is strictly additive — already-uppercase keys are unchanged.
 */
function mergeVariants(
  variantMap: Record<string, BadgeVariant> | undefined
): Record<string, BadgeVariant> {
  if (!variantMap) return DEFAULT_STATUS_VARIANTS
  const merged: Record<string, BadgeVariant> = { ...DEFAULT_STATUS_VARIANTS }
  for (const [key, variant] of Object.entries(variantMap)) {
    merged[key.toUpperCase()] = variant
  }
  return merged
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

export type StatusBadgeProps = {
  /** Raw status/severity value (case-insensitive). */
  status: string | null | undefined
  /** Override the displayed label; defaults to a humanized form. */
  label?: string
  /** Shallow-merged over DEFAULT_STATUS_VARIANTS to add/override mappings. */
  variantMap?: Record<string, BadgeVariant>
  /**
   * Render the non-color severity cue: a leading glyph + an sr-only severity
   * word, so the badge does not carry meaning by tint alone (WCAG 1.4.1).
   * Opt-in; defaults to false to keep existing color-only usage unchanged.
   */
  withIcon?: boolean
  /** Label shown when `status` is empty. */
  unknownLabel?: string
  className?: string
}

export function StatusBadge({
  status,
  label,
  variantMap,
  withIcon = false,
  unknownLabel = 'Unknown',
  className
}: StatusBadgeProps) {
  if (!status) {
    return (
      <Badge
        variant="outline"
        className={cn('text-muted-foreground', className)}
      >
        {label ?? unknownLabel}
      </Badge>
    )
  }

  const variant = mergeVariants(variantMap)[status.toUpperCase()] ?? 'outline'

  // The glyph follows the resolved variant; an unknown/non-severity variant has
  // no cue, so the badge gracefully renders label-only even with withIcon set.
  const cue = withIcon ? SEVERITY_CUE[variant] : undefined

  return (
    <Badge variant={variant} className={className}>
      {cue ? (
        <>
          <cue.Icon aria-hidden className="size-3.5 shrink-0" />
          <span className="sr-only">{cue.word}: </span>
        </>
      ) : null}
      {label ?? humanize(status)}
    </Badge>
  )
}
