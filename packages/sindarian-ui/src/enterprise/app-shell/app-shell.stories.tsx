import { Meta, StoryObj } from '@storybook/nextjs'
import { Home, Landmark, ListChecks } from 'lucide-react'
import {
  SidebarContent,
  SidebarExpandButton,
  SidebarGroup,
  SidebarGroupTitle,
  SidebarHeader,
  SidebarRoot
} from '@/components/ui/sidebar'
import { AlertBanner } from '../alert-banner'
import { StatCard } from '../stat-card'
import { AppShell, AppShellProps } from '.'

const meta: Meta<AppShellProps> = {
  title: 'Enterprise/AppShell',
  component: AppShell,
  parameters: { layout: 'fullscreen' }
}

export default meta

/**
 * The shell composes sindarian-ui's OWN sidebar family — `SidebarRoot` and its
 * parts — not the legacy sindarian-x sidebar. AppShell owns the provider, so a
 * consumer only supplies the rail.
 */
const rail = (
  <SidebarRoot className="border-border border-r">
    <SidebarHeader>
      <span className="text-sm font-semibold">Cockpit</span>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupTitle>Operations</SidebarGroupTitle>
        <div className="text-muted-foreground flex flex-col gap-2 px-3 text-sm">
          <span className="flex items-center gap-2">
            <Home className="size-4" /> Overview
          </span>
          <span className="flex items-center gap-2">
            <Landmark className="size-4" /> Settlements
          </span>
          <span className="flex items-center gap-2">
            <ListChecks className="size-4" /> Exceptions
          </span>
        </div>
      </SidebarGroup>
    </SidebarContent>
  </SidebarRoot>
)

const body = (
  <div className="space-y-6">
    <AlertBanner tone="info" title="Two settlement files are still importing.">
      Figures refresh as each file lands.
    </AlertBanner>
    <div className="border-border bg-border grid grid-cols-1 gap-px overflow-hidden rounded-lg border lg:grid-cols-3">
      <StatCard
        label="Match rate"
        value="98.4%"
        delta="+0.6 pts"
        tone="success"
      />
      <StatCard label="In flight" value="R$ 129.004" />
      <StatCard label="Disputes" value="3" tone="destructive" />
    </div>
  </div>
)

export const Default: StoryObj<AppShellProps> = {
  render: () => <AppShell sidebar={rail}>{body}</AppShell>
}

export const WithHeaderBanner: StoryObj<AppShellProps> = {
  render: () => (
    <AppShell
      sidebar={rail}
      header={
        <>
          <SidebarExpandButton tooltip="Toggle navigation" />
          <span className="text-sm font-medium">Settlements</span>
        </>
      }
    >
      {body}
    </AppShell>
  )
}

/** Tab once: the skip link is the first focusable element in the document. */
export const WithSkipLink: StoryObj<AppShellProps> = {
  render: () => (
    <AppShell
      sidebar={rail}
      header={<span className="text-sm font-medium">Settlements</span>}
      skipToContentLabel="Skip to content"
    >
      {body}
    </AppShell>
  )
}

export const NoSidebar: StoryObj<AppShellProps> = {
  render: () => (
    <AppShell contentClassName="max-w-3xl">
      <p className="text-sm">A shell with no rail is still a valid frame.</p>
    </AppShell>
  )
}
