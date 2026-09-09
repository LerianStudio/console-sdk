'use client'

/**
 * FileUpload — a controlled "pick a file, hand it back" primitive. The defining
 * job: select one file (by click, keyboard, or drag-and-drop), validate it
 * against an accept filter + a byte ceiling, and emit `{ file, text }`.
 *
 * `readAs` decides whether the bytes are decoded on the way through. `'text'`
 * (the default) reads UTF-8 via FileReader.readAsText, which is what a PEM/CSV
 * host wants. `'none'` hands the `File` over untouched and is the only mode a
 * BINARY file can use: a PDF, XLSX or PFX put through readAsText decodes into
 * replacement-character garbage, and that garbage string is then retained for
 * as long as the host holds the value — 20 MiB of PDF became a useless 20 MiB
 * string, and the host still had to read the file a second time to get at the
 * real bytes.
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
 *
 * A host that already announces the rejection itself — a toast in its own
 * locale, driven off `onError` — silences this one by returning nothing from
 * `labels.error`. Two announcements for one event, in two languages, is the
 * accessibility defect; the wording is not.
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

/** How the picked file's bytes are handled on the way to `onSelect`. */
export type FileUploadReadAs = 'text' | 'none'

/**
 * Overrides for the fixed English copy. Every field is optional and defaults to
 * the current value, so a consumer that passes nothing renders exactly as
 * before. These four strings were the whole of the component's user-visible
 * text, and none of them was reachable — a pt-BR console rendered an English
 * affordance and handed a screen reader an English accessible name.
 */
export interface FileUploadLabels {
  /** Emphasised call to action in the empty zone. Defaults to "Choose a file". */
  action?: string
  /** Trailing hint after the action. Defaults to "or drag and drop". */
  hint?: string
  /** Accessible name of the clear button. Defaults to "Remove file". */
  remove?: string
  /**
   * Copy for the component's own `role="alert"` refusal. Receives the rejection
   * so the message can interpolate the cap or the accept filter; use the
   * exported `humanizeSize` to format `maxSizeBytes` the way the chip does.
   *
   * Return `null`, `undefined` or `''` to stay SILENT and leave the
   * announcement to the host's own `onError` handling. Defaults to the
   * built-in English messages.
   */
  error?: (error: FileUploadError) => string | null | undefined
}

export type FileUploadProps = {
  /** Comma-separated accept filter, e.g. ".pem,.key" or "text/plain". Mirrors the native input accept. */
  accept?: string
  /** Inclusive byte ceiling. A file over this is rejected and announced, never selected. */
  maxSizeBytes?: number
  /** Controlled selection. `null` = empty. The host owns state. */
  value?: FileUploadResult | null
  /**
   * How the accepted file is handed over.
   * - `'text'` (default): decode as UTF-8 via FileReader.readAsText and emit
   *   `{ file, text }`. Unchanged behaviour for every existing consumer.
   * - `'none'`: skip decoding entirely and emit `{ file, text: '' }`. The mode
   *   for BINARY files (PDF, XLSX, PFX/DER): the host gets the `File` intact
   *   and `text` carries nothing, so do not read it in this mode.
   */
  readAs?: FileUploadReadAs
  /** Override the fixed English copy. Omitted fields keep their defaults. */
  labels?: FileUploadLabels
  /** Fires on accept (with the result) or clear (null). See `readAs` for whether `text` is populated. */
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
  // React declares its own `onError` on every DOM element. Left in, it
  // INTERSECTS with the rejection callback above into
  // `((e: FileUploadError) => void) & ReactEventHandler<HTMLInputElement>`,
  // which no concretely typed handler can satisfy — the only thing TypeScript
  // accepted was an untyped one, so the callback looked wired and the
  // documented `'kind' in failure` guard was written against a parameter that
  // was really `FileUploadError | SyntheticEvent`.
  | 'onError'
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

/**
 * Humanize a byte count for the selected-file chip. Binary units, 1 decimal.
 * Exported so a `labels.error` override can format `maxSizeBytes` exactly the
 * way the chip and the default message do, instead of re-deriving binary units.
 */
export function humanizeSize(bytes: number): string {
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

/** The default English announcement for each rejection kind. */
function defaultErrorMessage(error: FileUploadError): string {
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
      readAs = 'text',
      labels,
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

    // Resolve the announcement BEFORE deciding whether the alert exists: a
    // consumer that returns nothing is opting out of this surface entirely,
    // and an association pointing at an unrendered node is worse than none.
    const resolved = error
      ? labels?.error
        ? labels.error(error)
        : defaultErrorMessage(error)
      : null
    const errorText = resolved ? resolved : null

    // Radix Slot OVERWRITES aria-describedby (it does not merge), so merge the
    // primitive's own role=alert error id with the FormControl-injected one so
    // both associations coexist on the input. A plain join, never `cn` —
    // tailwind-merge treats these as class names and would drop an id that
    // happens to look like a conflicting utility.
    const describedBy =
      [ariaDescribedby, errorText ? errorId : undefined]
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
      // Binary path: no decode, no reader, no retained garbage string. The
      // stale-rejection clear still has to happen here — the alert is this
      // component's own state and a good pick must retire it.
      if (readAs === 'none') {
        readerRef.current = null
        setError(null)
        onSelect({ file, text: '' })
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

    // `preventDefault` FIRST, and unconditionally. Returning before it does
    // not merely refuse the drop: nothing cancels the browser's OWN action for
    // a dropped file, so the window navigates to the file and whatever the
    // page held unsaved is gone. A zone the host turned off has to swallow the
    // drop, never hand it back to the browser. `dropEffect` says so to the
    // cursor while the file is still in the air.
    const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      if (disabled) {
        event.dataTransfer.dropEffect = 'none'

        return
      }

      setDragActive(true)
    }

    const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setDragActive(false)
    }

    const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      // Cleared before the gate, not after, so a host that disables the zone
      // mid-drag does not leave it highlighted for a drag that can no longer
      // land.
      setDragActive(false)

      if (disabled) return

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
                aria-label={
                  labels?.remove?.trim() ? labels.remove : 'Remove file'
                }
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
              <span className="text-foreground font-medium">
                {labels?.action ?? 'Choose a file'}
              </span>{' '}
              {labels?.hint ?? 'or drag and drop'}
            </span>
          )}
        </div>
        {errorText ? (
          <p
            id={errorId}
            role="alert"
            className="text-system-error-h1a text-xs font-medium"
          >
            {errorText}
          </p>
        ) : null}
      </div>
    )
  }
)

FileUpload.displayName = 'FileUpload'

/**
 * A rejection from `MultipleFileUpload`: every rejection the single-file
 * sibling can produce, plus the one only a plural selection has — the cap.
 */
export type MultipleFileUploadError =
  FileUploadError | { kind: 'too-many'; file: File; maxFiles: number }

/** Overrides for the fixed English copy. Every field is optional. */
export interface MultipleFileUploadLabels {
  /** Emphasised call to action in the empty zone. Defaults to "Choose files". */
  action?: string
  /** Trailing hint after the action. Defaults to "or drag and drop". */
  hint?: string
  /** Zone copy once `maxFiles` is reached. Receives the cap to interpolate. */
  full?: (maxFiles: number) => string
  /**
   * Accessible name of a row's remove control. Receives that row's file, so the
   * name identifies it. Defaults to `Remove <filename>`.
   */
  remove?: (file: File) => string
  /**
   * Copy for one rejection. Called once per rejection in a batch; use the
   * exported `humanizeSize` to format `maxSizeBytes`. Return `null`,
   * `undefined` or `''` to stay SILENT and leave the announcement to the host's
   * own `onError` handling. A batch whose every message is silent renders no
   * alert at all.
   */
  error?: (error: MultipleFileUploadError) => string | null | undefined
}

export type MultipleFileUploadProps = {
  /** Comma-separated accept filter. Applied to every file, extension or MIME. */
  accept?: string
  /** Inclusive per-file byte ceiling. Applied to each file independently. */
  maxSizeBytes?: number
  /** Ceiling on the TOTAL selection. Omitted means unbounded. */
  maxFiles?: number
  /** Controlled selection. The host owns state; defaults to empty. */
  value?: FileUploadResult[]
  /**
   * How each accepted file is handed over. `'text'` (default) decodes UTF-8
   * and populates `text`; `'none'` skips decoding entirely and is the mode
   * BINARY files need. See FileUpload's `readAs` for why.
   */
  readAs?: FileUploadReadAs
  /** Override the fixed English copy. Omitted fields keep their defaults. */
  labels?: MultipleFileUploadLabels
  /** Fires with the WHOLE next selection whenever files are added or removed. */
  onValueChange: (values: FileUploadResult[]) => void
  /** Fires once per rejected file. A batch can produce several. */
  onError?: (error: MultipleFileUploadError) => void
  disabled?: boolean
  id?: string
  className?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
  'aria-describedby'?: string
  'aria-label'?: string
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  // Owned by the primitive, exactly as in the single-file sibling. `multiple`
  // is set by the component itself here rather than stripped as unsupported.
  | 'type'
  | 'accept'
  | 'value'
  | 'disabled'
  | 'onChange'
  | 'onSelect'
  | 'className'
  | 'multiple'
  // React declares its own `onError` on every DOM element; left in, it
  // intersects with the rejection callback into something no concretely typed
  // handler can satisfy. Same defect the sibling documents.
  | 'onError'
>

/** The default English announcement for each rejection kind. */
function defaultMultipleErrorMessage(error: MultipleFileUploadError): string {
  if (error.kind === 'too-many') {
    return `Too many files (max ${error.maxFiles}). ${error.file.name} was not added.`
  }
  return defaultErrorMessage(error)
}

/** The default zone copy once the cap is reached, in grammatical English. */
function defaultFullMessage(maxFiles: number): string {
  return maxFiles === 1
    ? 'Maximum of 1 file reached.'
    : `Maximum of ${maxFiles} files reached.`
}

/**
 * MultipleFileUpload: the plural sibling of FileUpload. Pick SEVERAL files,
 * accumulate them across repeated picks, validate each one, cap the total, and
 * hand back `FileUploadResult[]`.
 *
 * A SIBLING COMPONENT, not a `multiple` flag. This library already answers
 * "this one takes many" that way (`Select` / `MultipleSelect`), and FileUpload
 * strips `'multiple'` from its props on purpose: single-file is its contract,
 * not a default it happens to have. A boolean would have forced every prop
 * here into a union that means one thing when the flag is set and another when
 * it is not: `value` as `Result | Result[] | null`, a `maxFiles` that is
 * meaningless in half the configurations, and a remove control whose
 * accessible name is fixed copy in one mode and per-file in the other. The
 * plural props follow the house shape for plural components: `value?: T[]`
 * with `onValueChange?: (values: T[]) => void`.
 *
 * WHERE THE LINE SITS: this component owns SELECTION and nothing after it.
 * Choosing, validating, capping, listing and removing are its job; uploading
 * is not. That split is not squeamishness about scope, it is where the
 * knowledge actually lives. An upload needs an endpoint, an auth scheme, a
 * concurrency policy, a retry policy and, very often, a parent id that does
 * not exist yet when the files are chosen: the motivating host stages evidence
 * files while a form is being filled and can only upload them against the id
 * that its create call returns afterwards. None of that is knowable from
 * inside a library primitive, and a component that guessed would have to be
 * fought rather than used. So the host keeps its own per-file record with
 * status and retry, and this component keeps the part a form can hold and
 * validate: the chosen files. `FileUploadResult[]` is a value; an upload state
 * machine is not.
 *
 * ACCUMULATION is the defining behaviour. A second pick ADDS to the selection
 * rather than replacing it, because a user assembling five documents does it
 * in two or three trips to the file dialog, not one. Everything else follows
 * from that: room is measured against what is already selected, and the batch
 * that overflows the cap still contributes the files that fit.
 *
 * A BATCH SURVIVES ITS OWN CASUALTIES. One file rejected for type, size or a
 * failed read does not discard the rest of the batch, and it does not consume
 * a slot either: validation runs over the WHOLE batch before the cap is
 * applied, so a file that was never eligible cannot cost an eligible one its
 * place, and `'too-many'` always names a file a slot would genuinely have
 * taken. The alternative punishes
 * a user for a mistake in one file by throwing away four good ones, and hands
 * back no way to tell which was which. Every rejection is reported through
 * `onError` and announced together in one `role="alert"`.
 *
 * Accessibility follows the sibling BELOW THE CAP: the real `<input
 * type="file">` is `sr-only` but focusable and labelable, and never
 * `aria-hidden`, so FormControl-injected ARIA and react-hook-form's focus on
 * error both work while the picker is enabled. At the cap that changes, and
 * the paragraph below says how.
 * The file list sits OUTSIDE the click zone, so activating a remove control
 * cannot also reopen the picker, and each remove control is named after its
 * own file: a column of identical "Remove file" buttons tells a screen-reader
 * user nothing about which row they are on.
 *
 * AT THE CAP the picker takes the native `disabled` attribute, and that DOES
 * take it out of the tab order. This is the one state in which the input is
 * not a focus target, and the one state in which focus-on-error cannot land on
 * it, so it is a real cost rather than a free win. The cap has no counterpart
 * in the single-file sibling, so the precedent followed here is
 * `DateRangePicker`'s trigger: a control whose only job is to open a dialog has
 * no state worth keeping focusable, and native `disabled` is what both removes
 * it from the tab order and keeps the dialog shut. The alternative, an enabled
 * picker that opens the file dialog and then refuses every file with
 * `too-many`, is a control that lies about being available. What keeps the cap
 * from being a dead end is the escape hatch: the remove controls answer to
 * `disabled` alone and NEVER to the cap, so they stay focusable and removing
 * one file reopens the picker.
 */
export const MultipleFileUpload = React.forwardRef<
  HTMLInputElement,
  MultipleFileUploadProps
>(function MultipleFileUpload(
  {
    accept,
    maxSizeBytes,
    maxFiles,
    value = [],
    readAs = 'text',
    labels,
    onValueChange,
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
  React.useImperativeHandle(ref, () => internalRef.current as HTMLInputElement)

  const reactId = React.useId()
  const inputId = id ?? reactId
  const errorId = `${inputId}-file-upload-error`

  const [dragActive, setDragActive] = React.useState(false)
  const [errors, setErrors] = React.useState<MultipleFileUploadError[]>([])

  // The authoritative base for the next append. Props win on every render, so
  // the host stays in control; the commit below also writes through, so a
  // second batch that settles before the host has re-rendered still appends to
  // the first batch's result instead of overwriting it.
  const valueRef = React.useRef(value)
  React.useEffect(() => {
    valueRef.current = value
  })

  // Superseding is NOT the contract here the way it is in the single-file
  // sibling — batches accumulate, so an in-flight read is never stale. The
  // readers are tracked for the one case that does have to stop them: an
  // unmount. A read that lands afterwards would settle its batch and commit,
  // calling the host's `onValueChange` for a component that no longer exists.
  const readersRef = React.useRef(new Set<FileReader>())
  React.useEffect(
    () => () => {
      for (const reader of readersRef.current) reader.abort()
      readersRef.current.clear()
    },
    []
  )

  const invalid = ariaInvalid || errors.length > 0

  // Resolve the announcements BEFORE deciding whether the alert exists: a
  // consumer that returns nothing for every rejection is opting out of this
  // surface, and an association pointing at an unrendered node is worse than
  // none.
  const messages = errors
    .map((failure) =>
      labels?.error
        ? labels.error(failure)
        : defaultMultipleErrorMessage(failure)
    )
    .filter((message): message is string => Boolean(message))

  // A plain join, never `cn`: tailwind-merge treats these as class names and
  // would drop an id that happens to look like a conflicting utility.
  const describedBy =
    [ariaDescribedby, messages.length > 0 ? errorId : undefined]
      .filter(Boolean)
      .join(' ') || undefined

  const full = maxFiles !== undefined && value.length >= maxFiles
  // Removing must stay possible at the cap, so only the PICKER closes.
  const pickerDisabled = disabled || full

  const roomFor = (selected: number) =>
    maxFiles === undefined
      ? Number.POSITIVE_INFINITY
      : Math.max(maxFiles - selected, 0)

  // The cap is enforced HERE, at the only place that appends, because only the
  // commit knows the base it lands on. `ingest` measures room too, but for an
  // asynchronous batch it measures it BEFORE any read settles: two overlapping
  // batches both see the pre-commit selection and would each believe they fit.
  const commit = (
    accepted: FileUploadResult[],
    rejections: MultipleFileUploadError[]
  ) => {
    const room = roomFor(valueRef.current.length)
    const fitting = accepted.slice(0, room)
    const overflow = accepted[room]
    const failures =
      overflow !== undefined && maxFiles !== undefined
        ? [
            ...rejections,
            { kind: 'too-many' as const, file: overflow.file, maxFiles }
          ]
        : rejections
    setErrors(failures)
    for (const rejection of failures) onError?.(rejection)
    if (fitting.length === 0) return
    const next = [...valueRef.current, ...fitting]
    valueRef.current = next
    onValueChange(next)
  }

  const ingest = (incoming: File[]) => {
    if (incoming.length === 0) return

    const room = roomFor(valueRef.current.length)

    const rejections: MultipleFileUploadError[] = []

    // Validate EVERY file BEFORE the cap is applied. Slicing to the remaining
    // room first would let a file that was never eligible consume a slot a
    // good file could have used — one bad pick costing a good one, which is
    // the opposite of a batch surviving its own casualties — and it would
    // leave every file past the slice window neither validated nor reported.
    // Validation is pure metadata (size and accept), so running it over files
    // that may not fit costs nothing.
    const eligible: File[] = []
    for (const file of incoming) {
      const rejection = validateFile(file, { accept, maxSizeBytes })
      // Continue rather than abort: one bad file must not cost the good ones.
      if (rejection) {
        rejections.push(rejection)
        continue
      }
      eligible.push(file)
    }

    // The cap then applies to the SURVIVORS. One rejection for the batch,
    // naming the FIRST eligible file that did not fit: naming one already
    // refused for its size or type would blame the cap for the wrong thing,
    // and repeating it per overflowing file buries the actionable part.
    if (eligible.length > room && maxFiles !== undefined) {
      rejections.push({ kind: 'too-many', file: eligible[room], maxFiles })
    }

    const candidates = eligible.slice(0, room)

    // Binary path: no decode, no reader, no retained garbage string.
    if (readAs === 'none') {
      commit(
        candidates.map((file) => ({ file, text: '' })),
        rejections
      )
      return
    }

    if (candidates.length === 0) {
      commit([], rejections)
      return
    }

    // Slot-per-candidate so the emitted batch keeps PICK order regardless of
    // the order the reads settle in. A null slot is a read that failed; the
    // batch commits once every read has settled, one way or the other.
    const slots: (FileUploadResult | null)[] = new Array(
      candidates.length
    ).fill(null)
    let remaining = candidates.length
    const settle = () => {
      remaining -= 1
      if (remaining > 0) return
      const accepted: FileUploadResult[] = []
      const readFailures: MultipleFileUploadError[] = []
      slots.forEach((slot, index) => {
        if (slot) accepted.push(slot)
        else readFailures.push({ kind: 'read-failed', file: candidates[index] })
      })
      commit(accepted, [...rejections, ...readFailures])
    }

    candidates.forEach((file, index) => {
      const reader = new FileReader()
      readersRef.current.add(reader)
      // Deliberately no `onabort` handler: an aborted read must NOT settle,
      // or the batch would commit at exactly the moment we are stopping it.
      reader.onload = () => {
        readersRef.current.delete(reader)
        slots[index] = { file, text: String(reader.result ?? '') }
        settle()
      }
      reader.onerror = () => {
        readersRef.current.delete(reader)
        settle()
      }
      reader.readAsText(file)
    })
  }

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    // Release the FileList the moment it has been read, or re-picking the same
    // file is silently a no-op: the browser fires `change` only when the
    // selection DIFFERS from what the input already holds.
    event.target.value = ''
    ingest(files)
  }

  // `preventDefault` FIRST, and unconditionally. Returning before it does
  // not merely refuse the drop: nothing cancels the browser's OWN action for
  // a dropped file, so the window navigates to the file and whatever the
  // page held unsaved is gone. A zone the host turned off has to swallow the
  // drop, never hand it back to the browser. `dropEffect` says so to the
  // cursor while the file is still in the air.
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    if (disabled) {
      event.dataTransfer.dropEffect = 'none'

      return
    }

    setDragActive(true)
  }

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(false)
  }

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    // Cleared before the gate, not after, so a host that disables the zone
    // mid-drag does not leave it highlighted for a drag that can no longer
    // land.
    setDragActive(false)

    if (disabled) return

    // Deliberately NOT gated on `full`: a drop onto a full zone is answered
    // with the too-many rejection, which says why, instead of nothing at all.
    ingest(Array.from(event.dataTransfer.files ?? []))
  }

  // Mouse convenience only. A click that ORIGINATED on the input already opens
  // the picker natively and bubbles up here, so ignore it or it opens twice.
  const openPicker = (event: React.MouseEvent<HTMLDivElement>) => {
    if (pickerDisabled || event.target === internalRef.current) return
    internalRef.current?.click()
  }

  const removeAt = (index: number) => {
    // By index, not by name: two files can share a filename and identity is
    // what the row actually stands for.
    const next = valueRef.current.filter((_, position) => position !== index)
    valueRef.current = next
    onValueChange(next)
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
          pickerDisabled
            ? 'border-muted bg-muted/30 cursor-not-allowed shadow-none'
            : 'cursor-pointer'
        )}
        aria-invalid={invalid || undefined}
      >
        {/* The real, labelable file source: visually hidden, focusable, the
            accessible source of truth. */}
        <input
          ref={internalRef}
          id={inputId}
          type="file"
          multiple
          accept={accept}
          disabled={pickerDisabled}
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
        {full && maxFiles !== undefined ? (
          <span className="text-muted-foreground">
            {labels?.full
              ? labels.full(maxFiles)
              : defaultFullMessage(maxFiles)}
          </span>
        ) : (
          <span className="text-muted-foreground">
            <span className="text-foreground font-medium">
              {labels?.action ?? 'Choose files'}
            </span>{' '}
            {labels?.hint ?? 'or drag and drop'}
          </span>
        )}
      </div>
      {value.length > 0 ? (
        // OUTSIDE the zone on purpose: inside it, every click on a row would
        // bubble into openPicker and reopen the file dialog.
        <ul className="space-y-1">
          {value.map((entry, index) => (
            <li
              key={`${entry.file.name}-${index}`}
              className="flex items-center gap-3 text-sm"
            >
              <span className="min-w-0 flex-1 truncate">
                <span className="text-foreground font-medium">
                  {entry.file.name}
                </span>{' '}
                <span className="text-muted-foreground tabular-nums">
                  {humanizeSize(entry.file.size)}
                </span>
              </span>
              <IconButton
                type="button"
                variant="plain"
                size="small"
                disabled={disabled}
                aria-label={
                  labels?.remove
                    ? labels.remove(entry.file)
                    : `Remove ${entry.file.name}`
                }
                onClick={() => removeAt(index)}
              >
                <X className="size-4" aria-hidden="true" />
              </IconButton>
            </li>
          ))}
        </ul>
      ) : null}
      {messages.length > 0 ? (
        <div id={errorId} role="alert" className="space-y-1">
          {messages.map((message, index) => (
            <p
              key={index}
              className="text-system-error-h1a text-xs font-medium"
            >
              {message}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  )
})

MultipleFileUpload.displayName = 'MultipleFileUpload'
