import { SidebarItem } from './sidebar-item'

export function SidebarBackButton({
  ...props
}: React.ComponentProps<typeof SidebarItem>) {
  return (
    <div className="flex w-full flex-col">
      <SidebarItem {...props} />
    </div>
  )
}
