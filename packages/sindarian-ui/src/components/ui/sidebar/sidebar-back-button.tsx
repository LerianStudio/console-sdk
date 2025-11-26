import { SidebarItem } from './sidebar-item'
import { Separator } from '../separator'
import { useSidebar } from './sidebar-provider'

export function SidebarBackButton({
  ...props
}: React.ComponentProps<typeof SidebarItem>) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="flex w-full flex-col gap-1.5 pt-1.5">
      <SidebarItem {...props} />
      {isCollapsed && <Separator />}
    </div>
  )
}
