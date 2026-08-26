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
import {
  hasRenderableLabel,
  type RenderableLabel
} from '@/components/form/renderable-label'

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
  // An empty or whitespace-only aria-label is worse than none: it names the
  // control "". Drop it so the attribute never reaches the DOM.
  const ariaLabel = ariaLabelProp?.trim() ? ariaLabelProp : undefined

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
        // The chip follows the LOCAL selection, reconciled against the form
        // value — not the form value's truthiness.
        //
        // Truthiness cannot tell "no file" from "an accepted EMPTY file": both
        // store ''. So picking a legitimately empty file hid the chip, the zone
        // went back to "Choose a file or drag and drop" even though the pick was
        // accepted, and a `z.string().min(1)` rule then failed the field with
        // nothing on screen to explain why.
        //
        // Comparing against the text we last wrote keeps the external-reset
        // behaviour that truthiness was there for: after form.reset() or
        // setValue(name, ''), the stored text no longer matches the selection, so
        // the stale File metadata still cannot linger.
        //
        // ponytail: one residual case is irreducible from the form value alone —
        // resetting AFTER picking an empty file leaves the chip up, because ''
        // (reset) and '' (that file's text) are the same string and the form
        // value carries nothing else to tell them apart. Fix needs a reset epoch
        // from react-hook-form, or a form value richer than the file text.
        const shown =
          localValue && field.value === localValue.text ? localValue : null
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
