/**
 * AlertBanner — the console's semantic message box. A rounded, hairline-bordered
 * panel with a tinted background whose tone escalates by severity. The title
 * carries the tone color (font-medium); the body stays foreground for
 * readability; an optional `detail` slot renders mono diagnostic text (an error
 * code, a failed id) below the body.
 *
 *   <AlertBanner tone="destructive" title="Import failed">
 *     The file could not be parsed. No rows were ingested.
 *   </AlertBanner>
 *
 * Renders `role="alert"`. Tones map to sindarian-ui's `system-*` semantic token
 * families, so they track the active light/dark palette automatically.
 */
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type AlertBannerTone =
  'destructive' | 'warning' | 'info' | 'success' | 'neutral'

/** Container tint + border per tone. The title color is applied separately so
 *  the body copy stays high-contrast foreground. */
const TONE_CONTAINER: Record<AlertBannerTone, string> = {
  destructive: 'border-system-error-border bg-system-error-surface',
  warning: 'border-system-alert-border bg-system-alert-surface',
  info: 'border-system-info-border bg-system-info-surface',
  success: 'border-system-success-border bg-system-success-surface',
  neutral: 'border-border bg-muted/50'
}

const TONE_TITLE: Record<AlertBannerTone, string> = {
  destructive: 'text-system-error-text',
  warning: 'text-system-alert-text',
  info: 'text-system-info-text',
  success: 'text-system-success-text',
  neutral: 'text-foreground'
}

export type AlertBannerProps = {
  tone?: AlertBannerTone
  /** Bold lead line, carries the tone color. */
  title?: ReactNode
  /** Body copy (foreground, for readability). */
  children?: ReactNode
  /** Optional mono diagnostic detail rendered below the body. */
  detail?: ReactNode
  /** Optional leading icon (e.g. a lucide glyph), aligned to the title. */
  icon?: ReactNode
  className?: string
}

export function AlertBanner({
  tone = 'neutral',
  title,
  children,
  detail,
  icon,
  className
}: AlertBannerProps) {
  return (
    <div
      role="alert"
      data-tone={tone}
      className={cn(
        'flex gap-3 rounded-md border px-4 py-3',
        TONE_CONTAINER[tone],
        className
      )}
    >
      {/* Presence checks are `!= null`, not truthiness: a numeric 0 or an empty
          string is legitimate content and must still render its slot. */}
      {icon != null ? (
        <span className={cn('mt-0.5 shrink-0', TONE_TITLE[tone])} aria-hidden>
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1 space-y-1">
        {title != null ? (
          <p className={cn('text-sm font-medium', TONE_TITLE[tone])}>{title}</p>
        ) : null}
        {children != null ? (
          <div className="text-foreground text-xs leading-relaxed">
            {children}
          </div>
        ) : null}
        {detail != null ? (
          <pre className="text-muted-foreground overflow-x-auto font-mono text-xs break-words whitespace-pre-wrap">
            {detail}
          </pre>
        ) : null}
      </div>
    </div>
  )
}
