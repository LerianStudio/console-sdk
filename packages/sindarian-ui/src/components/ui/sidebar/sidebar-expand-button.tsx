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
              <PanelLeftClose className="text-muted-foreground" />
            </IconButton>
          </div>
        </div>
      )}

      {isCollapsed && (
        <SidebarFooter>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                // `hover:text-accent-foreground` on the TRIGGER, not only on
                // the glyph below. The base ink here used to be base/400, which
                // no rule paired with anything; now that it is the muted token,
                // it is the ink anything inside this trigger inherits, and the
                // muted token reads 1.07:1 on sunglow in dark. The glyph
                // overrides it today, so this pairs the fill for whatever the
                // trigger holds next.
                className="group/expand-button text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-sm bg-transparent p-2"
                onClick={toggleSidebar}
                aria-label={tooltip || 'Expand sidebar'}
                aria-expanded={false}
              >
                {/* The trigger flips to bg-accent (sunglow) on hover, so the
                    glyph answers with the kit's own accent ink. White on
                    sunglow is about 1.2:1, well under the 3:1 floor a glyph has
                    to clear. The non-hover dark:text-white stays: that one sits
                    on a transparent trigger, not on the fill. */}
                <PanelRightClose className="group-hover/expand-button:text-accent-foreground dark:text-white" />
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
