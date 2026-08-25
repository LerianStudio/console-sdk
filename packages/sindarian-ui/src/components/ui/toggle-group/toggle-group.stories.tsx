import { Meta, StoryObj } from '@storybook/nextjs'
import { ToggleGroup, ToggleGroupItem } from '.'

type ToggleGroupProps = React.ComponentProps<typeof ToggleGroup>

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

function BaseComponent(args: Partial<ToggleGroupProps>) {
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
