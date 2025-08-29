import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva('button-base button-disabled button-read-only', {
  variants: {
    variant: {
      hoverLink:
        'hover:bg-accent text-black hover:text-accent-foreground font-normal',
      default: 'button-primary',
      primary: 'button-primary',
      secondary: 'button-secondary',
      tertiary: 'button-tertiary',
      outline: 'button-outline',
      link: 'text-shadcn-600 underline-offset-4 underline text-sm font-normal justify-start'
    },
    fullWidth: {
      true: 'w-full',
      false: 'w-content'
    },
    size: {
      default: '',
      small: 'button-small'
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'default'
  }
})

const iconVariants = cva('', {
  variants: {
    position: {
      start: 'mr-2',
      end: 'ml-2',
      'far-end': 'absolute right-2'
    },
    size: {
      default: 'size-6',
      small: 'size-4'
    }
  },
  defaultVariants: {
    position: 'start',
    size: 'default'
  }
})

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  } & {
    icon?: React.ReactNode
    iconPlacement?: 'start' | 'end' | 'far-end'
    fullWidth?: boolean
    readOnly?: boolean
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  icon,
  iconPlacement = 'start',
  fullWidth = false,
  readOnly = false,
  onClick,
  ...props
}: ButtonProps) {
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
      className={cn(buttonVariants({ variant, size, fullWidth, className }))}
      data-read-only={readOnly}
      data-slot="button"
      {...props}
      onClick={handleClick}
    >
      {icon && iconPlacement === 'start' && (
        <span className={cn(iconVariants({ position: iconPlacement, size }))}>
          {icon}
        </span>
      )}
      {props.children}
      {icon && iconPlacement !== 'start' && (
        <span className={cn(iconVariants({ position: iconPlacement, size }))}>
          {icon}
        </span>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
