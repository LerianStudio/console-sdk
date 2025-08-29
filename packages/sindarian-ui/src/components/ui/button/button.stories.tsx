import { Meta, StoryObj } from '@storybook/nextjs'
import { ButtonProps, Button } from '.'
import { Users } from 'lucide-react'

const meta: Meta<ButtonProps> = {
  title: 'Primitives/Button',
  component: Button,
  argTypes: {
    children: {
      type: 'string',
      description: "The button's content"
    }
  }
}

export default meta

export const Component: StoryObj<ButtonProps> = {
  args: {
    children: 'Button'
  }
}

export const Primary: StoryObj<ButtonProps> = {
  args: {
    children: 'Button'
  },
  render: (args) => (
    <div className="flex gap-2">
      <Button {...args} /> <Button {...args} disabled />
    </div>
  )
}

export const Secondary: StoryObj<ButtonProps> = {
  args: {
    children: 'Button',
    variant: 'secondary'
  },
  render: (args) => (
    <div className="flex gap-2">
      <Button {...args} /> <Button {...args} disabled />
    </div>
  )
}

export const SecondaryDisabled: StoryObj<ButtonProps> = {
  args: {
    children: 'Button',
    variant: 'secondary',
    disabled: true
  }
}

export const Tertiary: StoryObj<ButtonProps> = {
  args: {
    children: 'Button',
    variant: 'tertiary'
  },
  render(args) {
    return (
      <div className="flex gap-2">
        <Button {...args} />
        <Button {...args} disabled />
      </div>
    )
  }
}

export const Outline: StoryObj<ButtonProps> = {
  args: {
    children: 'Button',
    variant: 'outline'
  },
  render(args) {
    return (
      <div className="flex gap-2">
        <Button {...args} />
        <Button {...args} disabled />
      </div>
    )
  }
}

export const FullWidth: StoryObj<ButtonProps> = {
  args: {
    fullWidth: true,
    children: 'Button'
  },
  render: (args) => (
    <div className="flex flex-col gap-2">
      <Button {...args} />
      <Button variant="secondary" {...args} />
      <Button variant="tertiary" {...args} />
      <Button variant="outline" {...args} />
    </div>
  )
}

export const WithIcon: StoryObj<ButtonProps> = {
  args: {
    children: 'Button'
  },
  render: (args) => (
    <div className="grid grid-cols-4 gap-4">
      <div className="flex flex-col gap-4">
        <div>
          <Button icon={<Users />} {...args} />
        </div>
        <div>
          <Button icon={<Users />} iconPlacement="end" {...args} />
        </div>
        <Button fullWidth icon={<Users />} {...args} />
        <Button fullWidth iconPlacement="far-end" icon={<Users />} {...args} />
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <Button variant="secondary" icon={<Users />} {...args} />
        </div>
        <div>
          <Button
            variant="secondary"
            iconPlacement="end"
            icon={<Users />}
            {...args}
          />
        </div>
        <Button variant="secondary" fullWidth icon={<Users />} {...args} />
        <Button
          variant="secondary"
          fullWidth
          iconPlacement="far-end"
          icon={<Users />}
          {...args}
        />
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <Button variant="tertiary" icon={<Users />} {...args} />
        </div>
        <div>
          <Button
            variant="tertiary"
            iconPlacement="end"
            icon={<Users />}
            {...args}
          />
        </div>
        <Button variant="tertiary" fullWidth icon={<Users />} {...args} />
        <Button
          variant="tertiary"
          fullWidth
          iconPlacement="far-end"
          icon={<Users />}
          {...args}
        />
      </div>
      <div className="flex flex-col gap-4">
        <div>
          <Button variant="outline" icon={<Users />} {...args} />
        </div>
        <div>
          <Button
            variant="outline"
            iconPlacement="end"
            icon={<Users />}
            {...args}
          />
        </div>
        <Button variant="outline" fullWidth icon={<Users />} {...args} />
        <Button
          variant="outline"
          fullWidth
          iconPlacement="far-end"
          icon={<Users />}
          {...args}
        />
      </div>
    </div>
  )
}

export const Small: StoryObj<ButtonProps> = {
  args: {
    children: 'Button',
    size: 'small'
  },
  render: (args) => (
    <div className="flex gap-2">
      <Button {...args} />
      <Button variant="secondary" {...args} />
      <Button variant="tertiary" {...args} />
      <Button variant="outline" {...args} />
    </div>
  )
}

export const ReadOnly: StoryObj<ButtonProps> = {
  args: {
    children: 'Button',
    readOnly: true
  },
  render: (args) => (
    <div className="flex gap-2">
      <Button {...args} />
      <Button variant="secondary" {...args} />
      <Button variant="tertiary" {...args} />
      <Button variant="outline" {...args} />
    </div>
  )
}
