import { Meta } from '@storybook/nextjs'
import { BasicCard, BasicCardAction, BasicCardContent, BasicCardTitle } from '.'
import { Button } from '../../ui/button'

const meta: Meta = {
  title: 'Components/Cards/BasicCard',
  component: BasicCard,
  parameters: {
    backgrounds: {
      default: 'Light'
    }
  },
  argTypes: {}
}

export default meta

export const Primary = {
  render: (args) => (
    <div className="grid grid-cols-3 gap-4">
      <BasicCard {...args}>
        <BasicCardTitle>Card Title</BasicCardTitle>
        <BasicCardContent>
          This is a simple card component with a title, content, and action
          area.
        </BasicCardContent>
        <BasicCardAction>
          <Button>Action</Button>
        </BasicCardAction>
      </BasicCard>
      <BasicCard {...args}>
        <BasicCardTitle>Card Title</BasicCardTitle>
        <BasicCardContent>
          This is a simple card component with a title, content, and action
          area.
        </BasicCardContent>
        <BasicCardAction>
          <Button>Action</Button>
        </BasicCardAction>
      </BasicCard>
      <BasicCard {...args}>
        <BasicCardTitle>Card Title</BasicCardTitle>
        <BasicCardContent>
          This is a simple card component with a title, content, and action
          area.
        </BasicCardContent>
        <BasicCardAction>
          <Button>Action</Button>
        </BasicCardAction>
      </BasicCard>
    </div>
  )
}
