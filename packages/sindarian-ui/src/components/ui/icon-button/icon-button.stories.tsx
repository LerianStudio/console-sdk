import { Meta, StoryObj } from '@storybook/nextjs'
import { IconButtonProps, IconButton } from '.'
import { Users } from 'lucide-react'

const meta: Meta<IconButtonProps> = {
  title: 'Primitives/IconButton',
  component: IconButton,
  argTypes: {}
}

export default meta

function BaseComponent(args: IconButtonProps) {
  return (
    <IconButton {...args}>
      <Users />
    </IconButton>
  )
}

export const Component: StoryObj<IconButtonProps> = {
  render: (args) => <BaseComponent {...args} />
}

export const Primary: StoryObj<IconButtonProps> = {
  args: {
    children: 'Button'
  },
  render: (args) => (
    <div className="flex gap-2">
      <BaseComponent {...args} /> <BaseComponent {...args} rounded />{' '}
      <BaseComponent {...args} disabled />
      <BaseComponent {...args} rounded disabled />
    </div>
  )
}

export const Secondary: StoryObj<IconButtonProps> = {
  args: {
    children: 'Button',
    variant: 'secondary'
  },
  render: (args) => (
    <div className="flex gap-2">
      <BaseComponent {...args} /> <BaseComponent {...args} rounded />{' '}
      <BaseComponent {...args} disabled />
      <BaseComponent {...args} rounded disabled />
    </div>
  )
}

export const Tertiary: StoryObj<IconButtonProps> = {
  args: {
    children: 'Button',
    variant: 'tertiary'
  },
  render(args) {
    return (
      <div className="flex gap-2">
        <BaseComponent {...args} />
        <BaseComponent {...args} rounded /> <BaseComponent {...args} disabled />
        <BaseComponent {...args} rounded disabled />
      </div>
    )
  }
}

export const Outline: StoryObj<IconButtonProps> = {
  args: {
    children: 'Button',
    variant: 'outline'
  },
  render(args) {
    return (
      <div className="flex gap-2">
        <BaseComponent {...args} />
        <BaseComponent {...args} rounded /> <BaseComponent {...args} disabled />
        <BaseComponent {...args} rounded disabled />
      </div>
    )
  }
}

export const Small: StoryObj<IconButtonProps> = {
  args: {
    children: 'Button',
    size: 'small'
  },
  render: (args) => (
    <div className="flex gap-2">
      <BaseComponent {...args} />
      <BaseComponent variant="secondary" {...args} />
      <BaseComponent variant="tertiary" {...args} />
      <BaseComponent variant="outline" {...args} />
    </div>
  )
}

export const ReadOnly: StoryObj<IconButtonProps> = {
  args: {
    children: 'Button',
    readOnly: true
  },
  render: (args) => (
    <div className="flex gap-2">
      <BaseComponent {...args} />
      <BaseComponent variant="secondary" {...args} />
      <BaseComponent variant="tertiary" {...args} />
      <BaseComponent variant="outline" {...args} />
    </div>
  )
}
