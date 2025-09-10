import React from 'react'
import { Collapsible } from '@radix-ui/react-collapsible'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, LucideProps, RefreshCw, Trash, User } from 'lucide-react'
import {
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import { useTime } from '@/hooks/use-time'
import dayjs from 'dayjs'
import { IconButton } from '@/components/ui/icon-button'

const AccountBalanceCardContext = React.createContext<{ open?: boolean }>({
  open: false
})

export function AccountBalanceCard({
  className,
  open,
  onOpenChange,
  children,
  ...props
}: React.ComponentProps<typeof Collapsible>) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      data-slot="account-balance-card"
      className={cn('w-full', className)}
      {...props}
    >
      <AccountBalanceCardContext.Provider value={{ open }}>
        <Card className="relative gap-2 px-5 py-4 shadow-xs">{children}</Card>
      </AccountBalanceCardContext.Provider>
    </Collapsible>
  )
}

export function AccountBalanceCardIcon({ className, ...props }: LucideProps) {
  return (
    <User
      data-slot="account-balance-card-icon"
      strokeWidth={1}
      className={cn('mb-[14px] size-8 text-zinc-800 opacity-40', className)}
      {...props}
    />
  )
}

export function AccountBalanceCardHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="account-balance-card-header"
      className={cn('flex flex-col', className)}
      {...props}
    />
  )
}

export function AccountBalanceCardTitle({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="account-balance-card-title"
      className={cn('text-shadcn-600 text-lg font-bold', className)}
      {...props}
    />
  )
}

export function AccountBalanceCardDeleteButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <IconButton
      variant="outline"
      size="small"
      rounded
      data-slot="account-balance-card-delete-button"
      className={cn('absolute top-3 right-3', className)}
      {...props}
    >
      <Trash className="h-4 w-4 text-zinc-600" />
    </IconButton>
  )
}

export function AccountBalanceCardContent({
  className,
  ...props
}: React.ComponentProps<typeof CollapsibleContent>) {
  return (
    <CollapsibleContent
      data-slot="account-balance-card-content"
      className={cn(
        'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden',
        className
      )}
      {...props}
    />
  )
}

export function AccountBalanceCardLoading({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <Skeleton
      data-slot="account-balance-card-loading"
      className={cn('mt-3 h-3 w-full rounded-md bg-zinc-200', className)}
      {...props}
    />
  )
}

export function AccountBalanceCardEmpty({
  className,
  ...props
}: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="account-balance-card-empty"
      className={cn(
        'text-shadcn-500 mt-3 text-center text-sm font-normal',
        className
      )}
      {...props}
    />
  )
}

export type AccountBalanceCardInfoProps = React.ComponentProps<'div'> & {
  assetCode: string
  value: string
}

export function AccountBalanceCardInfo({
  className,
  assetCode,
  value,
  children: _children,
  ref,
  ...props
}: AccountBalanceCardInfoProps) {
  return (
    <div
      ref={ref}
      data-slot="account-balance-card-info"
      className={cn(
        'text-shadcn-500 mt-3 flex flex-row items-center justify-between text-sm font-normal',
        className
      )}
      {...props}
    >
      <p>{assetCode}</p>
      <p>{value}</p>
    </div>
  )
}

export type AccountBalanceCardUpdateButtonProps = React.ComponentProps<
  typeof Button
> & {
  loading?: boolean
  timestamp: number
  loadingLabel?: string
  updatedInLabel?: string
  updatedLabel?: string
  onRefresh: () => void
}

export function AccountBalanceCardUpdateButton({
  className: _className,
  loading,
  timestamp,
  loadingLabel = 'Updating...',
  updatedInLabel = 'Updated in',
  updatedLabel = 'Updated',
  onRefresh,
  children: _children,
  ref,
  ...props
}: AccountBalanceCardUpdateButtonProps) {
  const _time = useTime({ interval: 1000 * 60 })

  const updated = React.useMemo(() => {
    return !dayjs(timestamp).isBefore(dayjs().subtract(1, 'minute'))
  }, [_time, timestamp])

  return (
    <div className="mb-3 flex flex-row items-center justify-end gap-2">
      <p className="text-shadcn-500 text-xs font-medium">
        {loading && loadingLabel}
        {!loading && !updated && updatedInLabel}
        {!loading && updated && updatedLabel}
      </p>
      {!loading && updated && (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      )}
      {(!updated || loading) && (
        <Button
          ref={ref}
          variant="link"
          data-slot="account-balance-card-update-button"
          className="h-3 p-0"
          onClick={onRefresh}
          disabled={loading}
          {...props}
        >
          <RefreshCw className={cn('size-4', { 'animate-spin': loading })} />
        </Button>
      )}
    </div>
  )
}

export function AccountBalanceCardTrigger({
  className,
  openLabel,
  closeLabel,
  children,
  ...props
}: React.ComponentProps<typeof Button> & {
  openLabel?: string
  closeLabel?: string
}) {
  const { open } = React.useContext(AccountBalanceCardContext)

  return (
    <CollapsibleTrigger asChild>
      <Button
        variant="link"
        data-slot="account-balance-card-trigger"
        className={cn('text-shadcn-600/40 h-4 p-0 text-xs', className)}
        {...props}
      >
        {!open ? openLabel : closeLabel}
      </Button>
    </CollapsibleTrigger>
  )
}
