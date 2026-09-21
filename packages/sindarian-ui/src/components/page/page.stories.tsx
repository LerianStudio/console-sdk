import { Meta, StoryObj } from '@storybook/nextjs'
import { PageContent, PageRoot, PageView } from '.'

const meta: Meta<React.ComponentProps<typeof PageRoot>> = {
  title: 'Components/Page',
  component: PageRoot,
  argTypes: {}
}

export default meta

export const Primary: StoryObj<React.ComponentProps<typeof PageRoot>> = {
  render: (args) => (
    <PageRoot {...args}>
      <div className="flex min-w-24 items-center justify-center bg-red-300">
        Sidebar
      </div>
      <PageView>
        <div className="flex min-h-16 items-center justify-center bg-blue-400">
          Header
        </div>
        <PageContent>
          <h1>Content: Hello World!!!</h1>
        </PageContent>
      </PageView>
    </PageRoot>
  )
}

/**
 * A 390px phone, which is where the container's padding stops being a detail:
 * the default spends 128px of those 390 before the page draws anything.
 */
const Phone = ({
  padding,
  children
}: {
  padding?: React.ComponentProps<typeof PageContent>['padding']
  children: React.ReactNode
}) => (
  <div
    style={{ width: 390 }}
    className="h-64 border border-dashed border-zinc-400"
  >
    <PageContent padding={padding}>
      <div className="flex h-full items-center justify-center bg-blue-200">
        {children}
      </div>
    </PageContent>
  </div>
)

/**
 * The default: 64px a side at every width. Unchanged for every consumer that
 * does not ask for anything.
 */
export const Default: StoryObj<React.ComponentProps<typeof PageRoot>> = {
  render: () => <Phone>R$ 1.234,56</Phone>
}

/**
 * `padding="compact"`: 16px a side below 640px, and byte-identical to Default
 * from 640px up. A fixed-width frame rather than a viewport parameter, because
 * this Storybook registers no viewport addon.
 */
export const Compact: StoryObj<React.ComponentProps<typeof PageRoot>> = {
  render: () => <Phone padding="compact">R$ 1.234,56</Phone>
}
