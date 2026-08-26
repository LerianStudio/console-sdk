'use client'

/**
 * FileUpload — a controlled "pick a file, read it to text, hand back the text"
 * primitive. The defining job: select one file (by click, keyboard, or
 * drag-and-drop), validate it against an accept filter + a byte ceiling, read
 * it as UTF-8 via FileReader.readAsText, and emit `{ file, text }`. Binary/DER
 * (.pfx/.p12) is explicitly OUT of scope — readAsText only.
 *
 * The real `<input type="file">` IS the accessible control: it is `sr-only`
 * (visually hidden) but focusable and labelable — never `aria-hidden`, never
 * `tabIndex={-1}`. The FormControl-injected ARIA (`id`, `aria-invalid`,
 * `aria-required`, `aria-describedby`) flows onto the input via `...rest`, so
 * react-hook-form's `field.ref` (forwarded here) focuses the real control on
 * error and FormLabel's `htmlFor` names it. The styled zone is a plain `<div>`
 * with a click handler, NOT a wrapping `<label>`: a label would contribute its
 * text to the input's accessible name and double-name it alongside a field's
 * own label. Keyboard users Tab to the focusable input and Enter/Space opens
 * the picker natively, so no key proxy is needed. Drag-and-drop is an
 * enhancement layered on the zone.
 *
 * Errors are DUAL by design and both announced: size/type/read failures are
 * the primitive's own concern, surfaced inline via `role="alert"` so it works
 * standalone outside a form; a form wrapper (FileUploadField) adds the
 * react-hook-form validation surface separately. A rejected pick never writes
 * a value, so it cannot masquerade as valid. `accept` is validated against
 * BOTH extension and MIME because the native `accept` attribute is only a
 * browser hint and is bypassable via drag-drop.
 */
import * as React from 'react'
import { Upload, X } from 'lucide-react'

import { IconButton } from '@/components/ui/icon-button'
import { cn } from '@/lib/utils'

export type FileUploadResult = { file: File; text: string }

export type FileUploadError =
  | { kind: 'too-large'; file: File; maxSizeBytes: number }
  | { kind: 'wrong-type'; file: File; accept: string }
  | { kind: 'read-failed'; file: File }

export type FileUploadProps = {
  /** Comma-separated accept filter, e.g. ".pem,.key" or "text/plain". Mirrors the native input accept. */
  accept?: string
  /** Inclusive byte ceiling. A file over this is rejected and announced, never selected. */
  maxSizeBytes?: number
  /** Controlled selection. `null` = empty. The host owns state. */
  value?: FileUploadResult | null
  /** Fires on accept (with {file,text}) or clear (null). Reads UTF-8 via FileReader.readAsText. */
  onSelect: (result: FileUploadResult | null) => void
  /** Fires when a pick is rejected (size/type/read). Optional — the component also shows its own inline error. */
  onError?: (error: FileUploadError) => void
  disabled?: boolean
  id?: string
  className?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
  'aria-describedby'?: string
  'aria-label'?: string
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  // Owned by the primitive — never let a consumer override the input contract.
  | 'type'
  | 'accept'
  | 'value'
  | 'disabled'
  | 'onChange'
  | 'onSelect'
  | 'className'
  // Single-file by contract: the component only ever reads `files[0]`.
  | 'multiple'
>

/**
 * Validate a chosen file against an accept filter and a byte ceiling. Exported
 * so hosts can pre-validate before handing a file over. `accept` is matched
 * against BOTH the filename extension and the MIME type — a `.pem`/`text/plain`
 * style filter passes if EITHER matches a token. When `accept` is omitted, any
 * type passes. Returns the first error, or null when the file is acceptable.
 */
export function validateFile(
  file: File,
  opts: { accept?: string; maxSizeBytes?: number }
): FileUploadError | null {
  const { accept, maxSizeBytes } = opts
  if (typeof maxSizeBytes === 'number' && file.size > maxSizeBytes) {
    return { kind: 'too-large', file, maxSizeBytes }
  }
  if (accept && accept.trim() !== '' && !matchesAccept(file, accept)) {
    return { kind: 'wrong-type', file, accept }
  }
  return null
}

/**
 * Does the file satisfy a comma-separated accept list? Each token is either a
 * dot-extension (`.pem`, case-insensitive against the filename), an exact MIME
 * (`text/plain`), or a MIME wildcard (`text/*`). True if ANY token matches.
 */
function matchesAccept(file: File, accept: string): boolean {
  const name = file.name.toLowerCase()
  const mime = file.type.toLowerCase()
  return accept
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t !== '')
    .some((token) => {
      if (token.startsWith('.')) return name.endsWith(token)
      if (token.endsWith('/*')) return mime.startsWith(token.slice(0, -1))
      return mime === token
    })
}

/** Humanize a byte count for the selected-file chip. Binary units, 1 decimal. */
function humanizeSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let size = bytes / 1024
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(1)} ${units[unit]}`
}

/** A human-readable announcement for each rejection kind. */
function errorMessage(error: FileUploadError): string {
  switch (error.kind) {
    case 'too-large':
      return `File is too large (max ${humanizeSize(error.maxSizeBytes)}).`
    case 'wrong-type':
      return `File type not allowed (expected ${error.accept}).`
    case 'read-failed':
      return 'Could not read the file.'
  }
}

export const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  function FileUpload(
    {
      accept,
      maxSizeBytes,
      value,
      onSelect,
      onError,
      disabled = false,
      id,
      className,
      'aria-invalid': ariaInvalid,
      'aria-required': ariaRequired,
      'aria-describedby': ariaDescribedby,
      'aria-label': ariaLabel,
      ...rest
    },
    ref
  ) {
    const internalRef = React.useRef<HTMLInputElement>(null)
    React.useImperativeHandle(
      ref,
      () => internalRef.current as HTMLInputElement
    )

    const reactId = React.useId()
    const inputId = id ?? reactId
    const errorId = `${inputId}-file-upload-error`

    const [dragActive, setDragActive] = React.useState(false)
    const [error, setError] = React.useState<FileUploadError | null>(null)

    // The destructive styling is driven by the consumer's aria-invalid OR the
    // component's own validation/read error — a self-detected bad pick must read
    // as invalid even outside a form.
    const invalid = ariaInvalid || error !== null

    // Radix Slot OVERWRITES aria-describedby (it does not merge), so merge the
    // primitive's own role=alert error id with the FormControl-injected one so
    // both associations coexist on the input. A plain join, never `cn` —
    // tailwind-merge treats these as class names and would drop an id that
    // happens to look like a conflicting utility.
    const describedBy =
      [ariaDescribedby, error ? errorId : undefined]
        .filter(Boolean)
        .join(' ') || undefined

    // Last-resolved-wins: a slow read for pick A must not overwrite a newer
    // pick B. Track the active reader and abort any in-flight read first.
    const readerRef = React.useRef<FileReader | null>(null)

    const handleFile = (file: File | undefined | null) => {
      if (!file) return
      readerRef.current?.abort()
      const validationError = validateFile(file, { accept, maxSizeBytes })
      if (validationError) {
        setError(validationError)
        onError?.(validationError)
        return
      }
      const reader = new FileReader()
      readerRef.current = reader
      reader.onload = () => {
        if (readerRef.current !== reader) return
        readerRef.current = null
        setError(null)
        onSelect({ file, text: String(reader.result ?? '') })
      }
      reader.onerror = () => {
        if (readerRef.current !== reader) return
        readerRef.current = null
        const readError: FileUploadError = { kind: 'read-failed', file }
        setError(readError)
        onError?.(readError)
      }
      reader.readAsText(file)
    }

    const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      // Release the FileList the moment it has been read. The browser fires
      // `change` only when the selection DIFFERS from what the input already
      // holds, so keeping it meant re-picking the same file after a host reset
      // (or retrying a rejected one) was silently a no-op — the picker opened,
      // the user chose the file, and nothing happened.
      event.target.value = ''
      handleFile(file)
    }

    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return
      event.preventDefault()
      setDragActive(true)
    }

    const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setDragActive(false)
    }

    const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
      if (disabled) return
      event.preventDefault()
      setDragActive(false)
      handleFile(event.dataTransfer.files?.[0])
    }

    // Mouse convenience only: clicking the styled zone opens the picker. A
    // click that ORIGINATED on the input already opens it natively and bubbles
    // up to here — re-firing .click() would open the picker twice, so ignore it.
    const openPicker = (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || event.target === internalRef.current) return
      internalRef.current?.click()
    }

    const clear = () => {
      readerRef.current?.abort()
      readerRef.current = null
      setError(null)
      onSelect(null)
      // Reset the native input so re-picking the same filename fires onChange.
      if (internalRef.current) internalRef.current.value = ''
    }

    return (
      <div className={cn('space-y-2', className)}>
        <div
          onClick={openPicker}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            'border-input bg-card focus-within:ring-ring focus-within:ring-offset-background aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-within:ring-destructive flex w-full items-center gap-3 rounded-md border px-3 py-4 text-sm shadow-xs transition-colors focus-within:ring-2 focus-within:ring-offset-1 focus-within:outline-none',
            dragActive &&
              'border-ring ring-ring ring-offset-background ring-2 ring-offset-1',
            disabled
              ? 'border-muted bg-muted/30 cursor-not-allowed shadow-none'
              : 'cursor-pointer'
          )}
          aria-invalid={invalid || undefined}
        >
          {/* The real, labelable file source — visually hidden, focusable,
              the accessible source of truth. */}
          <input
            ref={internalRef}
            id={inputId}
            type="file"
            accept={accept}
            disabled={disabled}
            className="sr-only"
            aria-invalid={invalid || undefined}
            aria-required={ariaRequired || undefined}
            aria-describedby={describedBy}
            aria-label={ariaLabel}
            onChange={onInputChange}
            {...rest}
          />
          <Upload
            className="text-muted-foreground size-4 shrink-0"
            aria-hidden="true"
          />
          {value ? (
            <>
              <span className="min-w-0 flex-1 truncate">
                <span className="text-foreground font-medium">
                  {value.file.name}
                </span>{' '}
                <span className="text-muted-foreground tabular-nums">
                  {humanizeSize(value.file.size)}
                </span>
              </span>
              <IconButton
                type="button"
                variant="plain"
                size="small"
                disabled={disabled}
                aria-label="Remove file"
                onClick={(event) => {
                  // Don't bubble to the zone's openPicker and re-open the dialog.
                  event.stopPropagation()
                  clear()
                }}
              >
                <X className="size-4" aria-hidden="true" />
              </IconButton>
            </>
          ) : (
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">Choose a file</span>{' '}
              or drag and drop
            </span>
          )}
        </div>
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="text-destructive text-xs font-medium"
          >
            {errorMessage(error)}
          </p>
        ) : null}
      </div>
    )
  }
)

FileUpload.displayName = 'FileUpload'
