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
 * ⛔ OPT-IN: `mobile="drawer"`. The default is `'inline'`, which renders the
 * rail at every viewport exactly as it always has — because `SidebarTrigger` is
 * the only way back into a drawer, and a consumer that has not placed one yet
 * would be left with no navigation at all on a phone.
 *
 * The same tree at two viewports. Resize the preview past 768px to swap between
 * them: above it the rail is a column of the layout, below it the rail is not
 * rendered and the trigger opens an overlay drawer instead.
 *
 * The rail used to be `w-[244px]` unconditionally, which at 390px is 63% of the
 * screen with no way to dismiss it.
 */
export const Responsive: StoryObj = {
  // Storybook 10 moved the story's own viewport selection out of `parameters`
  // and into `globals`; `parameters.viewport` now only carries `disable` and
  // `options`, so `defaultViewport` was read by nothing and these three
  // stories opened at the desktop width they exist to contradict.
  globals: {
    viewport: { value: 'mobile1' }
  },
  render: () => (
    <PageRoot>
      <PageView>
        <SidebarProvider>
          {/* The same consumer class `ResponsiveOptOut` carries. It is the
              other half of the P2 fix: the drawer stamps no `data-collapsed`,
              so this rule cannot fire inside it and the navigation stays
              inside its 244px sheet instead of claiming 280px. */}
          <SidebarRoot
            mobile="drawer"
            className="h-full data-[collapsed=false]:min-w-70"
          >
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
 * ⛔ THE OVERRIDE GOES ON THE RAIL, NOT ON A WRAPPER ABOVE IT.
 *
 * `--sidebar-width` and `--sidebar-width-collapsed` are custom properties, so a
 * declaration inherits down the **DOM** tree. The mobile drawer is portalled
 * into `document.body`, so a layout wrapper above `SidebarRoot` is not an
 * ancestor of it: that override moved the rail to 320px and left the drawer at
 * the 244px default, silently.
 *
 * On the rail itself it moves both — `SidebarRoot` copies exactly these two
 * arbitrary-property classes onto the drawer's own element. The other place
 * that reaches both is `:root`. Resize past 768px to see the same 320px twice.
 */
export const CustomWidth: StoryObj = {
  // Storybook 10 moved the story's own viewport selection out of `parameters`
  // and into `globals`; `parameters.viewport` now only carries `disable` and
  // `options`, so `defaultViewport` was read by nothing and these three
  // stories opened at the desktop width they exist to contradict.
  globals: {
    viewport: { value: 'mobile1' }
  },
  render: () => (
    <PageRoot>
      <PageView>
        <SidebarProvider>
          <SidebarRoot
            mobile="drawer"
            className="h-full [--sidebar-width:320px]"
          >
            <Nav />
          </SidebarRoot>
          <PageContent>
            <div className="p-4">
              <SidebarTrigger />
            </div>
          </PageContent>
        </SidebarProvider>
      </PageView>
    </PageRoot>
  )
}

/**
 * The DEFAULT, for comparison: no `mobile` prop. Below 768px this still renders
 * the inline rail, exactly as every release before this one did, and the
 * reader's collapsed preference still reaches it.
 *
 * ⚠️ `data-[collapsed=false]:min-w-70` IS THE CONSUMER'S OWN CLASS, copied from
 * all eight of product-console's sidebars, and it is here so the story documents
 * the real incumbent rather than a politer one. Without it the flex row shrinks
 * the rail to ~186px at 390px and the problem looks survivable; with it the rail
 * holds a 280px minimum and the page beside it gets 110px. That is what a
 * consumer sees today, and the reason `Responsive` exists.
 */
export const ResponsiveOptOut: StoryObj = {
  // Storybook 10 moved the story's own viewport selection out of `parameters`
  // and into `globals`; `parameters.viewport` now only carries `disable` and
  // `options`, so `defaultViewport` was read by nothing and these three
  // stories opened at the desktop width they exist to contradict.
  globals: {
    viewport: { value: 'mobile1' }
  },
  render: () => (
    <PageRoot>
      <PageView>
        <SidebarProvider>
          <SidebarRoot className="h-full data-[collapsed=false]:min-w-70">
            <Nav />
          </SidebarRoot>
          <PageContent>
            <div className="p-4">
              <p className="text-muted-foreground text-sm">
                No `mobile` prop: the rail is still here below 768px, holding
                its 280px minimum.
              </p>
            </div>
          </PageContent>
        </SidebarProvider>
      </PageView>
    </PageRoot>
  )
}
