'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorColor?: string
}

/**
 * `value` and `max` are Radix's own props, so the bar reports `aria-valuenow` /
 * `aria-valuemax` and flips `data-state` between `loading` and `complete`.
 * Omitting `value`, or passing `null`, is Radix's indeterminate state and draws
 * an empty track.
 *
 * Both numbers are BOUNDED BEFORE THE ROOT SEES THEM, so the drawn width and
 * the announced value can never disagree. Radix accepts a value only inside
 * `[0, max]`: hand it one outside and the root drops `aria-valuenow`, sticks
 * `data-state` on `indeterminate` and logs an error, while the indicator here
 * goes on drawing the clamped bar. Substituting 100 for a non-positive max is
 * Radix's own fallback, and is also what keeps a `max` of 0 from dividing by
 * zero.
 */
function Progress({
  className,
  value,
  max,
  indicatorColor = 'bg-primary',
  ...props
}: ProgressProps) {
  const scale = Number.isFinite(max) && max! > 0 ? max! : 100
  // Bound against `scale`, not against the rejected `max`: with `max={0}` the
  // scale is already 100, and clamping to 0 would report a finished bar empty.
  // Non-finite values are indeterminate, matching Radix without producing an
  // invalid CSS transform.
  const bounded = Number.isFinite(value)
    ? Math.min(scale, Math.max(0, value!))
    : null
  const percent = ((bounded ?? 0) / scale) * 100

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={bounded}
      max={scale}
      className={cn(
        'bg-primary/20 relative h-4 w-full overflow-hidden rounded-full',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn('h-full w-full flex-1 transition-all', indicatorColor)}
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
