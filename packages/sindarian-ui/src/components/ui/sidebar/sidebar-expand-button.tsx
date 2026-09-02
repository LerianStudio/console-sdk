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
  /**
   * Overrides the button's accessible name in BOTH states, and the visible
   * tooltip copy in the collapsed state. Without it each state falls back to
   * its own English default.
   */
  tooltip?: string
}

export const SidebarExpandButton = ({ tooltip }: SidebarExpandButtonProps) => {
  const { isCollapsed, toggleSidebar } = useSidebar()

  return (
    <React.Fragment>
      {!isCollapsed && (
        <div
          data-slot="sidebar-expand-button"
          className="border-border bg-card flex w-full"
        >
          <div className="absolute right-[-20px] bottom-4">
            <IconButton
              variant="secondary"
              rounded
              onClick={toggleSidebar}
              aria-label={tooltip || 'Collapse sidebar'}
              aria-expanded
            >
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
                aria-label={tooltip || 'Expand sidebar'}
                aria-expanded={false}
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
