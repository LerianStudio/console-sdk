import { Meta, StoryObj } from '@storybook/nextjs'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem
} from '.'
import { SelectProps } from '@radix-ui/react-select'
import { User } from 'lucide-react'

const meta: Meta<SelectProps> = {
  title: 'Primitives/Select',
  component: Select,
  argTypes: {}
}

export default meta

export const Default: StoryObj<SelectProps> = {
  render: (args) => (
    <Select {...args}>
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry">Blueberry</SelectItem>
          <SelectItem value="grapes">Grapes</SelectItem>
          <SelectItem value="pineapple">Pineapple</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export const ReadOnly: StoryObj<SelectProps> = {
  args: {
    value: 'apple'
  },
  render: (args) => (
    <Select {...args}>
      <SelectTrigger readOnly>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export const Disabled: StoryObj<SelectProps> = {
  render: (args) => (
    <Select {...args}>
      <SelectTrigger disabled>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
    </Select>
  )
}
