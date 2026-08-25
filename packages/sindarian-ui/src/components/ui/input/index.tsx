import * as React from 'react'

import { cn } from '@/lib/utils'
import { cva, VariantProps } from 'class-variance-authority'

const inputVariants = cva('input-base input-disabled input-read-only', {
  variants: {
    startAdornment: {
      false: '',
      true: 'input-start'
    },
    endAdornment: {
      false: '',
      true: 'input-end'
    }
  },
  defaultVariants: {
    startAdornment: false,
    endAdornment: false
  }
})

export type InputRef = {
  focus: () => void
  blur: () => void
}

export type InputProps = Omit<
  VariantProps<typeof inputVariants>,
  'startAdornment' | 'endAdornment'
> &
  React.ComponentProps<'input'> & {
    startAdornment?: React.ReactNode
    endAdornment?: React.ReactNode
    ref?: React.Ref<InputRef>
  }

export function Input({
  className,
  startAdornment,
  endAdornment,
  onFocus,
  onBlur,
  onClick,
  ref,
  ...props
}: InputProps) {
  // Fallback id so a standalone Input is still labelable. Inside a form,
  // FormControl injects its own id through `props` below and overrides this.
  const generatedId = React.useId()
  const [focus, setFocus] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useImperativeHandle(
    ref,
    () => ({
      ...inputRef.current,
      focus: () => {
        inputRef.current?.focus()
        setFocus(true)
      },
      blur: () => {
        inputRef.current?.blur()
        setFocus(false)
      }
    }),
    [inputRef]
  )

  const handleWrapperClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Don't focus input if clicking on interactive elements or input adornments
    const target = event.target as HTMLElement
    const isAdornment = target.closest('[data-slot="input-adornment"]')

    if (!isAdornment) {
      inputRef.current?.focus()
    }

    onClick?.(event as React.MouseEvent<HTMLInputElement>)
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocus(true)
    onFocus?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFocus(false)
    onBlur?.(e)
  }

  return (
    <div
      data-slot="input-wrapper"
      className={cn('input-wrapper input-wrapper-focus')}
      data-focus={focus}
      onClick={handleWrapperClick}
    >
      {startAdornment}

      <input
        ref={inputRef}
        id={generatedId}
        data-slot="input"
        className={cn(
          inputVariants({
            startAdornment: !!startAdornment,
            endAdornment: !!endAdornment
          }),
          className
        )}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />

      {endAdornment}
    </div>
  )
}

export * from './adornment'
