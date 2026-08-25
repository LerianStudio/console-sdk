'use client'

import { ReactNode, useState } from 'react'
import { Control, FieldValues, Path } from 'react-hook-form'

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

export type FileUploadFieldProps<T extends FieldValues = FieldValues> = {
  control: Control<T>
  name: string
  label?: ReactNode
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
  onSelect
}: FileUploadFieldProps<T>) => {
  const [localValue, setLocalValue] = useState<FileUploadResult | null>(null)

  return (
    <FormField
      control={control}
      name={name as Path<T>}
      render={({ field }) => {
        // Derive the shown chip from the form value: a falsy field.value (after
        // form.reset() or setValue(name, '')) forces the chip empty, so the
        // local File metadata can never linger when the form value is cleared
        // externally. The form owns the text; localValue only carries the File
        // for the chip while the value is non-empty.
        const shown = field.value ? localValue : null
        return (
          <FormItem required={required}>
            {label && (
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
                accept={accept}
                maxSizeBytes={maxSizeBytes}
                disabled={disabled}
                className={
                  disabled
                    ? `opacity-100${className ? ` ${className}` : ''}`
                    : className
                }
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
