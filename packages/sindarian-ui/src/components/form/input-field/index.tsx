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
import { Input, type InputRef } from '@/components/ui/input'
import { HTMLInputTypeAttribute, ReactNode, Ref, useMemo, useRef } from 'react'
import { Control, FieldPathValue, FieldValues, Path } from 'react-hook-form'

export type InputFieldProps<T extends FieldValues = FieldValues> = {
  className?: string
  name: string
  type?: HTMLInputTypeAttribute
  /**
   * Announce the field's own invalidity. Reaches the rendered control on BOTH
   * branches, so a field with no `control` — and therefore no react-hook-form
   * error state — can still tell a screen reader it is invalid.
   *
   * ORed with the form's error, never overriding it: `false` here cannot
   * suppress a live resolver error. Nobody asked to mute a real validation
   * failure, and on a financial console a muted one is a wrong number reaching
   * a money path.
   *
   * TypeScript exempts hyphenated JSX attributes from excess-property
   * checking, so passing this used to compile and then vanish.
   */
  'aria-invalid'?: boolean
  /** Lower bound, forwarded to the single-line control on both branches. */
  min?: number | string
  /** Upper bound, forwarded to the single-line control on both branches. */
  max?: number | string
  /** Increment, forwarded to the single-line control on both branches. */
  step?: number | string
  /** Character ceiling, forwarded on both branches (single-line and textarea). */
  maxLength?: number
  /** Browser autofill hint. `"off"` is the one a money field usually wants. */
  autoComplete?: React.HTMLInputAutoCompleteAttribute
  /** Virtual-keyboard hint, e.g. `"numeric"` or `"decimal"`. Both branches. */
  inputMode?: React.HTMLAttributes<HTMLElement>['inputMode']
  /** Native validation regex. Single-line only — a textarea has no `pattern`. */
  pattern?: string
  /** Focus the control on mount. React focuses the node rather than emitting an attribute. */
  autoFocus?: boolean
  /**
   * Imperative handle on the rendered control: `focus()`/`blur()` on the
   * single-line branch, the textarea node on the `textArea` branch (which
   * satisfies the same shape). COMPOSED with react-hook-form's own ref when
   * `control` is present, never replacing it — the form keeps the node it
   * needs for `shouldFocusError`.
   */
  ref?: Ref<InputRef>
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

/**
 * Fan one node out to several refs. React hands a node to ONE ref, so a
 * consumer ref and react-hook-form's `field.ref` cannot both be passed
 * directly — one silently wins. Only used when the consumer actually supplied
 * a ref, so a field without one keeps `field.ref`'s own identity and React
 * never re-attaches it.
 */
function fanOutRef<T>(
  ...refs: (Ref<T> | undefined)[]
): (node: T | null) => void | (() => void) {
  return (node) => {
    const cleanups: (() => void)[] = []

    for (const ref of refs) {
      if (typeof ref === 'function') {
        const cleanup = ref(node)
        cleanups.push(typeof cleanup === 'function' ? cleanup : () => ref(null))
      } else if (ref) {
        ;(ref as { current: T | null }).current = node
        cleanups.push(() => {
          ;(ref as { current: T | null }).current = null
        })
      }
    }

    return () => cleanups.forEach((cleanup) => cleanup())
  }
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
  min,
  max,
  step,
  maxLength,
  autoComplete,
  inputMode,
  pattern,
  autoFocus,
  ref,
  'aria-invalid': ariaInvalid,
  ...others
}: InputFieldProps<T>) => {
  // OR with the form's error, expressed through the Slot merge rather than by
  // reading the form: FormControl already injects `aria-invalid={!!error}`, and
  // a child prop only wins that merge when the KEY is present. So emit the key
  // only for an explicit `true`, and let FormControl answer for every other
  // case. `true || error` is true; `false || error` is whatever the form says,
  // which is the whole point — an explicit `false` cannot mute a live error.
  // With no `control` there is no error to OR against, so FormControl injects
  // `false` and today's behaviour is unchanged.
  const ariaInvalidProp = ariaInvalid ? { 'aria-invalid': true } : undefined
  const formRef = useRef<((node: InputRef | null) => void) | undefined>(
    undefined
  )
  const composedRef = useMemo(
    () =>
      ref ? fanOutRef<InputRef>((node) => formRef.current?.(node), ref) : ref,
    // `others.name` belongs here, and leaving it out is not a lint nit.
    // react-hook-form hands a fresh `field.ref` for every name, and that ref
    // only receives the element when React reattaches, which it does only when
    // this callback's identity changes. Memoised on `ref` alone, one identity
    // survived a name change, the new field never got its element, and
    // `form.setFocus(newName)` then found nothing to focus and said nothing.
    [ref, others.name]
  )

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
            maxLength={maxLength}
            autoComplete={autoComplete}
            inputMode={inputMode}
            autoFocus={autoFocus}
            data-testid={others['data-testid']}
            {...ariaInvalidProp}
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
            // Bounds belong to the single-line control only: `min`/`max`/`step`
            // mean nothing on a textarea and would render as invalid markup.
            min={min}
            max={max}
            step={step}
            maxLength={maxLength}
            autoComplete={autoComplete}
            inputMode={inputMode}
            // Single-line only: `<textarea pattern>` is not a thing.
            pattern={pattern}
            autoFocus={autoFocus}
            data-testid={others['data-testid']}
            {...ariaInvalidProp}
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
      onChange: (e) => onChange?.(e),
      // Nothing else claims the node on this branch, so the consumer ref goes
      // straight through. Without it there was no node to focus at all.
      ref: ref as React.Ref<never> | undefined
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
      render={({ field }) => {
        formRef.current = field.ref
        return renderItem({
          ...field,
          // Controlled from mount. react-hook-form hands `undefined` for any
          // name the form declares no default for; React then mounts the box
          // uncontrolled and flips it on the first keystroke, losing that
          // character.
          value: field.value ?? '',
          onChange: (e) => {
            field.onChange(e)
            onChange?.(e)
          },
          ref: (ref ? composedRef : field.ref) as React.Ref<never>
        })
      }}
    />
  )
}
