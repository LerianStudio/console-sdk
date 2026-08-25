import type { ComponentProps } from 'react'
import { Meta, StoryObj } from '@storybook/nextjs'
import { ToggleGroup, ToggleGroupItem } from '.'

type ToggleGroupProps = ComponentProps<typeof ToggleGroup>

const meta: Meta<ToggleGroupProps> = {
  title: 'Primitives/ToggleGroup',
  component: ToggleGroup,
  argTypes: {}
}

export default meta

const ranges = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' }
]

// Only the styling knobs, never the single/multiple discriminant: spreading a
// Partial of that union would widen `type` and the props would stop resolving
// to either variant.
type ToggleGroupStoryArgs = Pick<
  ToggleGroupProps,
  'variant' | 'size' | 'spacing'
>

function BaseComponent(args: ToggleGroupStoryArgs) {
  return (
    <ToggleGroup type="single" defaultValue="week" {...args}>
      {ranges.map((range) => (
        <ToggleGroupItem key={range.value} value={range.value}>
          {range.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export const Primary: StoryObj<ToggleGroupProps> = {
  render: (args) => BaseComponent(args)
}

export const Outline: StoryObj<ToggleGroupProps> = {
  args: { variant: 'outline' },
  render: (args) => BaseComponent(args)
}

export const Spaced: StoryObj<ToggleGroupProps> = {
  args: { variant: 'outline', spacing: 2 },
  render: (args) => BaseComponent(args)
}

export const Multiple: StoryObj<ToggleGroupProps> = {
  render: () => (
    <ToggleGroup type="multiple" defaultValue={['day', 'month']}>
      {ranges.map((range) => (
        <ToggleGroupItem key={range.value} value={range.value}>
          {range.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
