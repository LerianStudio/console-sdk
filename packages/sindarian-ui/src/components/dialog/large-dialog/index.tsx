import { cn } from '@/lib/utils'
import { DialogContent, DialogTitle } from '@/components/ui/dialog'
import { DialogContentProps } from '@radix-ui/react-dialog'

function OnboardDialogContent({ className, ...props }: DialogContentProps) {
  return (
    <DialogContent
      data-slot="onboard-dialog-content"
      showCloseButton={false}
      className={cn(
        '[data-radix-dialog-close] w-full max-w-[640px] p-12 sm:min-w-[640px]',
        className
      )}
      {...props}
    />
  )
}

function OnboardDialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="onboard-dialog-header"
      className={cn('flex flex-row justify-between', className)}
      {...props}
    />
  )
}

export type OnboardDialogTitleProps = React.ComponentProps<'div'> & {
  upperTitle: string
  title: string
}

function OnboardDialogTitle({
  upperTitle,
  title,
  className,
  ...props
}: OnboardDialogTitleProps) {
  return (
    <div
      data-slot="onboard-dialog-title"
      className={cn('flex flex-col gap-8', className)}
      {...props}
    >
      <p className="text-base font-medium text-zinc-600">{upperTitle}</p>
      <DialogTitle className="text-4xl font-bold text-zinc-600">
        {title}
      </DialogTitle>
    </div>
  )
}

function OnboardDialogIcon({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="onboard-dialog-icon"
      className={cn('flex items-center px-12', className)}
      {...props}
    >
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export {
  OnboardDialogContent,
  OnboardDialogHeader,
  OnboardDialogTitle,
  OnboardDialogIcon
}
