import { Meta, StoryObj } from '@storybook/nextjs'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '.'
import { TabsProps } from '@radix-ui/react-tabs'
import { Paper } from '../paper'

const meta: Meta<TabsProps> = {
  title: 'Primitives/Tabs',
  component: Tabs,
  argTypes: {
    defaultValue: {
      type: 'string',
      defaultValue: 'account'
    },
    value: {
      type: 'string'
    },
    orientation: {
      options: ['horizontal', 'vertical'],
      control: { type: 'radio' },
      defaultValue: 'horizontal'
    }
  }
}

export default meta

type Story = StoryObj<TabsProps>

export const Primary: Story = {
  render: (args) => (
    <Tabs defaultValue="account" {...args}>
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Paper className="p-4">Tab Content 1</Paper>
      </TabsContent>
      <TabsContent value="password">
        <Paper className="p-4">Tab Content 2</Paper>
      </TabsContent>
    </Tabs>
  )
}
