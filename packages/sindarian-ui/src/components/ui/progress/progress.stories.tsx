import { Meta, StoryObj } from '@storybook/nextjs'
import { Progress } from '.'

const meta: Meta = {
  title: 'Primitives/Progress',
  component: Progress,
  argTypes: {
    value: {
      control: {
        type: 'range',
        min: 0,
        max: 100,
        step: 1
      }
    }
  }
}

export default meta

export const Default: StoryObj = {
  args: {
    value: 50
  }
}
