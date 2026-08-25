'use client'

import { ReactNode, useState } from 'react'
import { Control, FieldPathByValue, FieldValues } from 'react-hook-form'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormTooltip
} from '@/components/ui/form'
import { FileUpload, type FileUploadResult } from '@/components/ui/file-upload'

type FileUploadFieldOwnProps<T extends FieldValues = FieldValues> = {
  control: Control<T>
  /**
   * Must point at a string-valued field: the adapter writes the file's text, or
   * `''` when cleared, never a File and never null. `string | undefined` also
   * matches plain `string` fields, so optional ones are covered by the same type.
   */
  name: FieldPathByValue<T, string | undefined>
  description?: ReactNode
  tooltip?: string
  required?: boolean
  accept?: string
  maxSizeBytes?: number
  disabled?: boolean
  className?: string
  /** Optional escape hatch to also observe the picked File/clear alongside the form's text value. */
  onSelect?: (result: FileUploadResult | null) => void
}

/**
 * A label that actually renders an element. `null`, `undefined` and booleans
 * are valid ReactNode but produce nothing, so a control typed on bare ReactNode
 * can satisfy the union below and still end up nameless.
 *
 * The empty string cannot be excluded here — `Exclude<string, ''>` is still
 * `string` — so `label=""` is caught at runtime by `hasRenderableLabel` instead.
 */
type RenderableLabel = Exclude<ReactNode, null | undefined | boolean>

/** Does this label produce a real element a screen reader can read? */
function hasRenderableLabel(label: ReactNode): boolean {
  return (
    label !== null &&
    label !== undefined &&
    typeof label !== 'boolean' &&
    label !== ''
  )
}

/**
 * A control with no accessible name is invisible to screen readers, so the type
 * makes one mandatory: either a visible `label`, or an `aria-label` when the
 * design calls for a bare file picker.
 */
export type FileUploadFieldProps<T extends FieldValues = FieldValues> =
  FileUploadFieldOwnProps<T> &
    (
      | { label: RenderableLabel; 'aria-label'?: string }
      | { label?: never; 'aria-label': string }
    )

/**
 * FileUploadField — the react-hook-form field for FileUpload.
 *
 * The field VALUE is the file's UTF-8 TEXT string (so a Zod `z.string()` PEM
 * schema validates directly), `''` when cleared — never the File, never null —
 * so `z.string().min(1)` fires the required error with zero adapter code. The
 * File metadata for the visible chip lives in field-LOCAL state, since the form
 * only holds the text. The shown chip is DERIVED from the form field value, so
 * an external `form.reset()` / `setValue(name, '')` that clears the text also
 * clears the chip — local state can never linger out of sync with the form. A
 * rejected pick (size/type/read) clears the form value so it can't pass
 * validation, while the primitive's own inline `role="alert"` announces the
 * rejection; on resolver failure the FormMessage announces. Both surfaces are
 * wired.
 */
export const FileUploadField = <T extends FieldValues = FieldValues>({
  control,
  name,
  label,
  description,
  tooltip,
  required,
  accept,
  maxSizeBytes,
  disabled,
  className,
  onSelect,
  'aria-label': ariaLabelProp
}: FileUploadFieldProps<T>) => {
  const [localValue, setLocalValue] = useState<FileUploadResult | null>(null)
  const showLabel = hasRenderableLabel(label)
  // An empty aria-label is worse than none: it names the control "". Drop it so
  // the attribute never reaches the DOM.
  const ariaLabel = ariaLabelProp === '' ? undefined : ariaLabelProp

  // The type cannot rule out `label=""`, so this is the only signal a developer
  // gets that the control shipped nameless.
  if (process.env.NODE_ENV !== 'production' && !showLabel && !ariaLabel) {
    console.error(
      `FileUploadField "${name}" has no accessible name: pass a non-empty label or aria-label.`
    )
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Derive the shown chip from the form value: a falsy field.value (after
        // form.reset() or setValue(name, '')) forces the chip empty, so the
        // local File metadata can never linger when the form value is cleared
        // externally. The form owns the text; localValue only carries the File
        // for the chip while the value is non-empty.
        const shown = field.value ? localValue : null
        return (
          <FormItem required={required}>
            {showLabel && (
              <FormLabel
                extra={
                  tooltip ? <FormTooltip>{tooltip}</FormTooltip> : undefined
                }
              >
                {label}
              </FormLabel>
            )}
            <FormControl>
              <FileUpload
                ref={field.ref}
                name={field.name}
                onBlur={field.onBlur}
                aria-label={ariaLabel}
                accept={accept}
                maxSizeBytes={maxSizeBytes}
                disabled={disabled}
                className={className}
                value={shown}
                onSelect={(result) => {
                  setLocalValue(result)
                  field.onChange(result?.text ?? '')
                  onSelect?.(result)
                }}
                onError={() => field.onChange('')}
              />
            </FormControl>
            <FormMessage />
            {description && <FormDescription>{description}</FormDescription>}
          </FormItem>
        )
      }}
    />
  )
}
