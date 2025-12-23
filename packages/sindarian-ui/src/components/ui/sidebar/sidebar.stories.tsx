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
  SidebarItemCollapsibleContent
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
                <SidebarItemCollapsible>
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
