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
  SidebarBackButton
} from '.'
import { PageRoot, PageView } from '../../page'
import {
  ArrowLeftRight,
  ChevronLeft,
  Coins,
  DollarSign,
  Home,
  Settings,
  User
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
              <SidebarItem title="Home" icon={<Home />} href="" />
              <SidebarItem title="Home" active icon={<Home />} href="" />
              <SidebarItem title="Home" disabled icon={<Home />} href="" />
              <SidebarItem
                title="Transactions"
                icon={<ArrowLeftRight />}
                href=""
              />
              <SidebarItem title="Accounts" icon={<DollarSign />} href="" />
              <SidebarItem title="Assets" icon={<Coins />} href="" />
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupTitle>Plugins</SidebarGroupTitle>
              <SidebarItem title="CRM" icon={<User />} href="" />
              <SidebarItem title="Settings" icon={<Settings />} href="" />
            </SidebarGroup>
          </SidebarContent>
          <SidebarExpandButton />
        </SidebarRoot>
      </SidebarProvider>
      <PageView />
    </PageRoot>
  )
}
