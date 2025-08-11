import React from 'react'
import { LockIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type LockedTableActionsProps = {
  message: string
  className?: string
}

export const LockedTableActions = ({
  message,
  className
}: LockedTableActionsProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'border-border bg-muted flex h-[36px] w-[36px] items-center justify-center rounded-md border',
              className
            )}
          >
            <LockIcon size={14} className="text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">{message}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
