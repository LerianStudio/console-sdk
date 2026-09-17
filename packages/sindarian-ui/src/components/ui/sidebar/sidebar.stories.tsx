import { Meta, StoryObj } from '@storybook/nextjs'
import {
  SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupTitle,
  SidebarItem,
  SidebarProvider,
  SidebarExpandButton,
  SidebarHeader,
  SidebarBackButton,
  SidebarItemCollapsible,
  SidebarItemCollapsibleTrigger,
  SidebarItemCollapsibleContent,
  SidebarTrigger
} from '.'
import { PageContent, PageRoot, PageView } from '../../page'
import {
  ArrowLeftRight,
  Building,
  ChevronLeft,
  CircleUser,
  Coins,
  DollarSign,
  Home,
  Settings,
  Users
} from 'lucide-react'

const meta: Meta = {
  title: 'Primitives/Sidebar',
  component: SidebarRoot,
  argTypes: {}
}

export default meta

export const Primary: StoryObj = {
  render: (args) => (
    <PageRoot>
      <PageView>
        <SidebarProvider>
          <SidebarRoot {...args}>
            <SidebarHeader>
              <SidebarBackButton
                title="Back to products"
                icon={<ChevronLeft />}
                href="#"
              />
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarItem title="Home" active icon={<Home />} href="" />
                <SidebarItem
                  title="Transactions"
                  icon={<ArrowLeftRight />}
                  href=""
                  disabled
                />
                <SidebarItem title="Accounts" icon={<DollarSign />} href="" />
                <SidebarItem title="Assets" icon={<Coins />} href="" />
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupTitle>Plugins</SidebarGroupTitle>
                <SidebarItemCollapsible name="crm">
                  <SidebarItemCollapsibleTrigger title="CRM" icon={<Users />} />
                  <SidebarItemCollapsibleContent>
                    <SidebarItem
                      title="Holders"
                      icon={<CircleUser />}
                      href=""
                    />
                    <SidebarItem title="Alias" icon={<Building />} href="" />
                  </SidebarItemCollapsibleContent>
                </SidebarItemCollapsible>
                <SidebarItem title="Settings" icon={<Settings />} href="" />
              </SidebarGroup>
            </SidebarContent>
            <SidebarExpandButton />
          </SidebarRoot>
        </SidebarProvider>
        <PageContent />
      </PageView>
    </PageRoot>
  )
}

const Nav = () => (
  <>
    <SidebarHeader>
      <SidebarBackButton
        title="Back to products"
        icon={<ChevronLeft />}
        href="#"
      />
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarItem title="Home" active icon={<Home />} href="" />
        <SidebarItem title="Transactions" icon={<ArrowLeftRight />} href="" />
        <SidebarItem title="Accounts" icon={<DollarSign />} href="" />
        <SidebarItem title="Assets" icon={<Coins />} href="" />
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupTitle>Plugins</SidebarGroupTitle>
        <SidebarItem title="Settings" icon={<Settings />} href="" />
      </SidebarGroup>
    </SidebarContent>
    <SidebarExpandButton />
  </>
)

/**
 * The same tree at two viewports. Resize the preview past 768px to swap
 * between them: above it the rail is a column of the layout, below it the rail
 * is not rendered at all and `SidebarTrigger` opens an overlay drawer instead.
 *
 * The rail used to be `w-[244px]` unconditionally, which at 390px is 63% of the
 * screen with no way to dismiss it.
 */
export const Responsive: StoryObj = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' }
  },
  render: () => (
    <PageRoot>
      <PageView>
        <SidebarProvider>
          <SidebarRoot className="h-full">
            <Nav />
          </SidebarRoot>
          <PageContent>
            <div className="p-4">
              {/* Only rendered below 768px: `md:hidden` is the trigger's own
                  default, and above the breakpoint the rail is already there. */}
              <SidebarTrigger />
              <p className="text-muted-foreground mt-4 text-sm">
                Below 768px the navigation is a drawer. Press the hamburger.
              </p>
            </div>
          </PageContent>
        </SidebarProvider>
      </PageView>
    </PageRoot>
  )
}

/**
 * The widths are `--sidebar-width` and `--sidebar-width-collapsed`, so a
 * consumer re-points them from anywhere above the rail — here on the rail
 * itself. The mobile drawer reads the same variable, so one override moves
 * both layouts.
 */
export const CustomWidth: StoryObj = {
  render: () => (
    <PageRoot>
      <PageView>
        <SidebarProvider>
          <SidebarRoot className="h-full [--sidebar-width:320px]">
            <Nav />
          </SidebarRoot>
          <PageContent />
        </SidebarProvider>
      </PageView>
    </PageRoot>
  )
}
