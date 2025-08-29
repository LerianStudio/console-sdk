import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { buttonVariants } from '../button'
import { cn } from '@/lib/utils'

export const iconButtonVariants = cva(
  'icon-button-base icon-button-read-only icon-button-disabled',
  {
    variants: {
      rounded: {
        true: 'icon-button-rounded',
        false: ''
      },
      size: {
        default: '',
        small: 'icon-button-small'
      }
    },
    defaultVariants: {
      size: 'default'
    }
  }
)

export type IconButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    rounded?: boolean
    asChild?: boolean
    readOnly?: boolean
  }

export function IconButton({
  variant,
  rounded,
  size,
  asChild,
  readOnly,
  onClick,
  ...props
}: IconButtonProps) {
  const Comp = asChild ? Slot : 'button'

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (readOnly) {
      e.preventDefault()
      return
    }
    onClick?.(e)
  }

  return (
    <Comp
      className={cn(
        buttonVariants({ variant, size }),
        iconButtonVariants({ rounded, size })
      )}
      data-read-only={readOnly}
      data-slot="button"
      {...props}
      onClick={handleClick}
    />
  )
}
