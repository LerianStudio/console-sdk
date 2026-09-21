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
 * The frame both padding stories draw in. It carries no width of its own: the
 * width is the PREVIEW's, set per story below.
 *
 * ⛔ A 390px `<div>` IS NOT A 390px PHONE. `compact` is `max-sm:p-4`, a media
 * query, and a media query reads the browser viewport and nothing else. Framed
 * at `style={{ width: 390 }}` inside a desktop preview, both stories rendered
 * the same 64px padding and the pair demonstrated nothing — the one story
 * written to contradict the default agreed with it.
 */
const Phone = ({
  padding,
  children
}: {
  padding?: React.ComponentProps<typeof PageContent>['padding']
  children: React.ReactNode
}) => (
  <div className="h-64 border border-dashed border-zinc-400">
    <PageContent padding={padding}>
      <div className="flex h-full items-center justify-center bg-blue-200">
        {children}
      </div>
    </PageContent>
  </div>
)

// iPhone 12, 390x844. Storybook 10 reads a story's own viewport from `globals`,
// not from `parameters` — `parameters.viewport` now carries only `disable` and
// `options`, so a `defaultViewport` there is read by nothing and the story
// opens at the desktop width it exists to contradict.
const phoneViewport = { viewport: { value: 'iphone12' } }

/**
 * The default at 390px: 64px a side, which is 128px — a third of the screen —
 * spent before the page draws anything.
 */
export const Default: StoryObj<React.ComponentProps<typeof PageRoot>> = {
  globals: phoneViewport,
  render: () => <Phone>R$ 1.234,56</Phone>
}

/**
 * `padding="compact"` at the same 390px: 16px a side. Widen the preview past
 * 640px and this becomes byte-identical to Default, which is the other half of
 * the promise — `max-sm:` only ADDS a rule below `sm`.
 */
export const Compact: StoryObj<React.ComponentProps<typeof PageRoot>> = {
  globals: phoneViewport,
  render: () => <Phone padding="compact">R$ 1.234,56</Phone>
}
