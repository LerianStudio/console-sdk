import { AutosizeTextarea } from '@/components/ui/autosize-textarea'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormTooltip
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { HTMLInputTypeAttribute, ReactNode } from 'react'
import { Control, FieldPathValue, FieldValues, Path } from 'react-hook-form'

export type InputFieldProps<T extends FieldValues = FieldValues> = {
  className?: string
  name: string
  type?: HTMLInputTypeAttribute
  label?: ReactNode
  tooltip?: string
  labelExtra?: ReactNode
  placeholder?: string
  description?: ReactNode
  startAdornment?: ReactNode
  endAdornment?: ReactNode
  /** react-hook-form control. Omit it to drive the field from plain state
   *  with `value`/`defaultValue` + `onChange`. */
  control?: Control<T>
  /** Controlled value for the no-`control` path. */
  value?: string
  disabled?: boolean
  readOnly?: boolean
  minHeight?: number
  maxHeight?: number
  textArea?: boolean
  required?: boolean
  /**
   * Seed value. With `control` and no form-level default for this name,
   * react-hook-form treats the seed as a VALUE rather than a default, so
   * `formState.isDirty` reads true after `reset()` and after retyping the
   * seed. Prefer `useForm({ defaultValues })` when dirty tracking matters.
   */
  defaultValue?: string
  'data-testid'?: string
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
}

/** What the rendered control needs, whichever side supplies it. */
type Binding = {
  name?: string
  value?: string
  defaultValue?: string
  disabled?: boolean
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void
  onBlur?: () => void
  ref?: React.Ref<never>
}

export const InputField = <T extends FieldValues = FieldValues>({
  className,
  type,
  label,
  tooltip,
  labelExtra,
  placeholder,
  description,
  startAdornment,
  endAdornment,
  required,
  readOnly,
  minHeight,
  maxHeight,
  textArea,
  defaultValue,
  value,
  onChange,
  ...others
}: InputFieldProps<T>) => {
  const renderItem = (binding: Binding) => (
    <FormItem required={required}>
      {label && (
        <FormLabel
          extra={tooltip ? <FormTooltip>{tooltip}</FormTooltip> : labelExtra}
        >
          {label}
        </FormLabel>
      )}
      <FormControl>
        {textArea ? (
          <AutosizeTextarea
            className={className}
            placeholder={placeholder}
            readOnly={readOnly}
            minHeight={minHeight}
            maxHeight={maxHeight}
            data-testid={others['data-testid']}
            {...binding}
          />
        ) : (
          <Input
            className={className}
            type={type}
            placeholder={placeholder}
            readOnly={readOnly}
            startAdornment={startAdornment}
            endAdornment={endAdornment}
            data-testid={others['data-testid']}
            {...binding}
          />
        )}
      </FormControl>
      <FormMessage />
      {description && <FormDescription>{description}</FormDescription>}
    </FormItem>
  )

  if (!others.control) {
    return renderItem({
      name: others.name,
      disabled: others.disabled,
      // Controlled when the caller holds the value, uncontrolled when it only
      // seeds one — supplying both is what React warns about.
      ...(value !== undefined ? { value } : { defaultValue }),
      onChange: (e) => onChange?.(e)
    })
  }

  return (
    <FormField
      {...others}
      name={others.name as Path<T>}
      // The seed goes through react-hook-form, never straight to the DOM: a
      // value painted on the box only makes the field LOOK filled while the
      // form still submits nothing for that name. Controller seeds its own
      // state from this, so `field.value` carries the seed on both branches.
      defaultValue={defaultValue as FieldPathValue<T, Path<T>>}
      render={({ field }) =>
        renderItem({
          ...field,
          // Controlled from mount. react-hook-form hands `undefined` for any
          // name the form declares no default for; React then mounts the box
          // uncontrolled and flips it on the first keystroke, losing that
          // character.
          value: field.value ?? '',
          onChange: (e) => {
            field.onChange(e)
            onChange?.(e)
          }
        })
      }
    />
  )
}
