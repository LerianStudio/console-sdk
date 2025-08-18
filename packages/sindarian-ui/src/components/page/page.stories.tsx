import { Meta, StoryObj } from '@storybook/nextjs/*'
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
