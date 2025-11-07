import { cn } from '@/lib/utils'
import { cva, VariantProps } from 'class-variance-authority'

export const inputAdornmentVariants = cva('input-adornment', {
  variants: {
    position: {
      start: 'input-adornment-start',
      end: 'input-adornment-end'
    }
  },
  defaultVariants: {
    position: 'start'
  }
})

export type InputAdornmentProps = React.ComponentProps<'span'> &
  VariantProps<typeof inputAdornmentVariants> & {
    position?: 'start' | 'end'
  }

export function InputAdornment({
  className,
  position = 'start',
  ...props
}: InputAdornmentProps) {
  return (
    <span
      data-slot="input-adornment"
      className={cn(inputAdornmentVariants({ position }), className)}
      {...props}
    />
  )
}
