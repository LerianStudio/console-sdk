'use client'

import React from 'react'
import { PanelLeftClose, PanelRightClose } from 'lucide-react'
import { useSidebar } from './sidebar-provider'
import { SidebarFooter } from './sidebar-components'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '../../ui/tooltip'
import { IconButton } from '../icon-button'

type SidebarExpandButtonProps = {
  tooltip?: string
}

export const SidebarExpandButton = ({ tooltip }: SidebarExpandButtonProps) => {
  const { isCollapsed, toggleSidebar } = useSidebar()

  return (
    <React.Fragment>
      {!isCollapsed && (
        <div
          data-slot="sidebar-expand-button"
          className="border-shadcn-200 flex w-full bg-white"
        >
          <div className="absolute right-[-20px] bottom-4">
            <IconButton variant="secondary" rounded onClick={toggleSidebar}>
              <PanelLeftClose className="text-shadcn-400" />
            </IconButton>
          </div>
        </div>
      )}

      {isCollapsed && (
        <SidebarFooter>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                className="group/expand-button text-shadcn-400 hover:bg-accent rounded-sm bg-transparent p-2"
                onClick={toggleSidebar}
              >
                <PanelRightClose className="group-hover/expand-button:text-white dark:text-white" />
              </TooltipTrigger>
              <TooltipContent side="right">
                {tooltip || 'Expand'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </SidebarFooter>
      )}
    </React.Fragment>
  )
}
