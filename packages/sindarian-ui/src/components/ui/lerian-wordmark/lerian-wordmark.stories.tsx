import { Meta, StoryObj } from '@storybook/nextjs'
import { LerianWordmarkProps, LerianWordmark } from '.'

const meta: Meta<LerianWordmarkProps> = {
  title: 'Primitives/LerianWordmark',
  component: LerianWordmark,
  argTypes: {}
}

export default meta

export const Primary: StoryObj<LerianWordmarkProps> = {
  args: {
    className: 'h-8'
  }
}

export const Large: StoryObj<LerianWordmarkProps> = {
  args: {
    className: 'h-12'
  }
}
