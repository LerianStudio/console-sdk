'use client'

import * as React from 'react'
import { Check, Copy, Eye, EyeOff } from 'lucide-react'

import { IconButton } from '@/components/ui/icon-button'
import { useToast } from '@/hooks/use-toast'

export type CopyFieldProps = {
  /**
   * The string shown and copied verbatim (e.g. a TOTP manual-entry secret or a
   * single recovery code). Copy always uses this raw value, even while masked.
   */
  value: string
  /**
   * Optional visible label rendered above the field and associated with the
   * input via `htmlFor`/`id`.
   */
  label?: string
  /**
   * When true the displayed value is obscured (native password dots) while the
   * underlying `value` stays copyable. A reveal toggle is offered.
   * @defaultValue false
   */
  masked?: boolean
  /**
   * i18n message used as the success toast text. Falls back to a sensible
   * default when omitted.
   */
  onCopyLabel?: string
  /**
   * Accessible name for the reveal toggle when the value is hidden. Override
   * for localization. Defaults to English.
   * @defaultValue 'Show value'
   */
  revealLabel?: string
  /**
   * Accessible name for the reveal toggle when the value is shown. Override
   * for localization. Defaults to English.
   * @defaultValue 'Hide value'
   */
  hideLabel?: string
  /**
   * Accessible name for the input when no visible `label` is provided. Override
   * for localization. Defaults to English.
   * @defaultValue 'Value to copy'
   */
  valueLabel?: string
  /**
   * Milliseconds after a *successful* copy before the clipboard is wiped, for
   * sensitive values that shouldn't linger there (TOTP secrets, recovery
   * codes). Omit — or pass a non-positive number — to never clear.
   *
   * The clear is best-effort and never destructive: before wiping, the
   * clipboard is read back and left untouched unless it still holds exactly
   * the value this field wrote, so a copy the user made in the meantime
   * survives. Browsers without `clipboard.readText` (Firefox, Safari) or that
   * deny the read can't be verified, so nothing is cleared there.
   */
  clearClipboardAfter?: number
}

const DEFAULT_COPY_LABEL = 'Copied to clipboard!'
const FALLBACK_COPY_LABEL =
  'Copy not available — text selected, press Ctrl/Cmd+C'
const COPIED_ICON_TIMEOUT = 1500

const isClipboardAvailable = () =>
  typeof navigator !== 'undefined' &&
  typeof navigator.clipboard?.writeText === 'function'

const isClipboardReadable = () =>
  typeof navigator !== 'undefined' &&
  typeof navigator.clipboard?.readText === 'function'

/**
 * Wipes the clipboard, but only if it still holds `copiedValue` — the user may
 * have copied something else in the meantime, and clobbering that would be
 * worse than leaving the secret behind. Unverifiable (no `readText`, permission
 * denied, unfocused document) means "leave it alone".
 */
const clearClipboardIfUnchanged = async (copiedValue: string) => {
  if (!isClipboardReadable()) {
    return
  }
  try {
    if ((await navigator.clipboard.readText()) !== copiedValue) {
      return
    }
    await navigator.clipboard.writeText('')
  } catch {
    // Read or write refused; the clipboard stays as-is.
  }
}

export function CopyField({
  value,
  label,
  masked = false,
  onCopyLabel,
  revealLabel = 'Show value',
  hideLabel = 'Hide value',
  valueLabel = 'Value to copy',
  clearClipboardAfter
}: CopyFieldProps) {
  const { toast } = useToast()
  const generatedId = React.useId()
  const inputId = `${generatedId}-copy-field`
  const inputRef = React.useRef<HTMLInputElement>(null)
  const copiedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const clearTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const [revealed, setRevealed] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const showAsText = !masked || revealed
  const copyAccessibleName = label ? `Copy ${label}` : 'Copy value'

  React.useEffect(() => {
    return () => {
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current)
      }
      // The clipboard-clear timer is deliberately *not* cancelled here: it
      // touches no state (so it can't warn about an unmounted update) and the
      // secret must still leave the clipboard when the dialog holding this
      // field closes before the timeout elapses.
    }
  }, [])

  const selectFieldText = () => {
    const input = inputRef.current
    if (!input) {
      return
    }
    // Reveal so the user can copy the selection manually. Flip the DOM `type`
    // imperatively *before* select(): `setRevealed` is batched, so a plain
    // state update would leave the input as type="password" at select() time,
    // and React's subsequent type -> "text" re-render clears the selection —
    // the fallback would then select nothing. We still push the state update so
    // the re-render stays consistent with the DOM we just mutated.
    if (masked) {
      input.type = 'text'
      setRevealed(true)
    }
    input.focus()
    input.select()
  }

  const handleFallback = () => {
    selectFieldText()
    toast({ title: FALLBACK_COPY_LABEL })
  }

  const handleCopy = async () => {
    if (!isClipboardAvailable()) {
      handleFallback()
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      toast({ variant: 'success', title: onCopyLabel ?? DEFAULT_COPY_LABEL })
      setCopied(true)
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current)
      }
      copiedTimerRef.current = setTimeout(
        () => setCopied(false),
        COPIED_ICON_TIMEOUT
      )

      // Only a confirmed write earns a clear — the fallback path never wrote to
      // the clipboard, so it has nothing of ours to wipe. `value` is captured
      // per copy so a later prop change can't make us clear the wrong string.
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current)
      }
      if (clearClipboardAfter !== undefined && clearClipboardAfter > 0) {
        const copiedValue = value
        clearTimerRef.current = setTimeout(() => {
          void clearClipboardIfUnchanged(copiedValue)
        }, clearClipboardAfter)
      }
    } catch {
      handleFallback()
    }
  }

  return (
    <div data-slot="copy-field" className="flex w-full flex-col gap-2">
      {label ? (
        <label
          htmlFor={inputId}
          className="text-muted-foreground text-sm font-semibold"
        >
          {label}
        </label>
      ) : null}

      {/* Explicit 40px flex row rather than the `.input-wrapper`/`.input-base`
          pair: those are tuned for text inputs (padding + read-only dimming) and
          leave a full-size `size-10` IconButton flush against the border, so its
          round hover gets clipped top/bottom. A fixed-height `items-center` row
          with `size="small"` (32px) buttons keeps the hover circle ~3px inside
          the border and vertically centers the value. */}
      <div
        data-slot="input-wrapper"
        className="border-input-border focus-within:border-ring flex h-10 w-full cursor-text items-center gap-1 rounded-md border pr-1 pl-4 transition-[color,box-shadow]"
      >
        <input
          ref={inputRef}
          id={inputId}
          data-slot="input"
          data-testid="copy-field-input"
          type={showAsText ? 'text' : 'password'}
          value={value}
          readOnly
          aria-label={label ? undefined : valueLabel}
          // `min-w-0` lets this flex item shrink below its content width so a
          // long value (e.g. a UUID recovery code) scrolls inside the field
          // instead of overflowing its container. No `font-mono`: the value
          // inherits the app sans font (Inter) so it matches every other field.
          className="text-input-foreground h-full min-w-0 flex-1 cursor-text border-none bg-transparent text-sm outline-none select-text focus:ring-0 focus:ring-offset-0"
        />

        {masked ? (
          <IconButton
            type="button"
            variant="outline"
            size="small"
            rounded
            aria-pressed={revealed}
            aria-label={revealed ? hideLabel : revealLabel}
            onClick={() => setRevealed((prev) => !prev)}
          >
            {revealed ? <EyeOff /> : <Eye />}
          </IconButton>
        ) : null}

        <IconButton
          type="button"
          variant="outline"
          size="small"
          rounded
          aria-label={copyAccessibleName}
          onClick={handleCopy}
        >
          {copied ? <Check /> : <Copy />}
        </IconButton>
      </div>
    </div>
  )
}
