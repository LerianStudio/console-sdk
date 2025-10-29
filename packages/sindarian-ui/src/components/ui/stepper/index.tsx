import { cn } from '@/lib/utils'
import { CircleCheck } from 'lucide-react'
import { Skeleton } from '../skeleton'

export function Stepper({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="stepper" className={cn('stepper', className)} {...props} />
  )
}

export type StepperItemProps = React.ComponentProps<'div'> & {
  active?: boolean
  complete?: boolean
}

export function StepperItem({
  className,
  active = false,
  complete = false,
  ...props
}: StepperItemProps) {
  return (
    <div
      data-slot="stepper-item"
      data-active={active}
      data-complete={complete}
      className={cn('group stepper-item', className)}
      {...props}
    />
  )
}

export function StepperItemNumber({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="stepper-item-number"
      className={cn('stepper-item-number', className)}
      {...props}
    />
  )
}

export type StepperItemTextProps = React.ComponentProps<'div'> & {
  title: string
  description?: string
}

export function StepperItemText({
  className,
  title,
  description,
  ...props
}: StepperItemTextProps) {
  return (
    <div
      data-slot="stepper-item-text"
      className={cn('stepper-item-text', className)}
      {...props}
    >
      <div className="stepper-item-title">
        <p>{title}</p>
        <CircleCheck className="stepper-item-icon" width={16} height={16} />
      </div>
      {description && <p className="stepper-item-description">{description}</p>}
    </div>
  )
}

export type StepperControlProps = React.PropsWithChildren & {
  active?: boolean
}

export const StepperContent = ({ active, children }: StepperControlProps) => {
  return active ? <>{children}</> : null
}

export const StepperItemSkeleton = () => (
  <div className="flex flex-row items-center gap-3">
    <Skeleton className="h-8 w-8 rounded-full bg-zinc-200" />
    <Skeleton className="h-5 w-32 bg-zinc-200" />
  </div>
)
