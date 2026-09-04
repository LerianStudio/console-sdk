import { Meta, StoryObj } from '@storybook/nextjs'
import { BadgeProps, Badge } from '.'

const meta: Meta<BadgeProps> = {
  title: 'Primitives/Badge',
  component: Badge,
  argTypes: {}
}

export default meta

export const Primary: StoryObj<BadgeProps> = {
  args: {
    children: 'Badge'
  }
}

export const Secundary: StoryObj<BadgeProps> = {
  args: {
    children: 'Badge',
    variant: 'secondary'
  }
}

export const Outline: StoryObj<BadgeProps> = {
  args: {
    children: 'Badge',
    variant: 'outline'
  }
}

export const Active: StoryObj<BadgeProps> = {
  args: {
    children: 'Badge',
    variant: 'active'
  }
}

export const Inactive: StoryObj<BadgeProps> = {
  args: {
    children: 'Badge',
    variant: 'inactive'
  }
}

export const Destructive: StoryObj<BadgeProps> = {
  args: {
    children: 'Badge',
    variant: 'destructive'
  }
}

export const Credit: StoryObj<BadgeProps> = {
  args: {
    children: 'Badge',
    variant: 'credit'
  }
}

/**
 * A label plus an element child. The base `gap-1` is what keeps this from
 * reading `IDctx-123`: the newline between the two children survives neither
 * JSX nor flex layout.
 */
export const WithElementChild: StoryObj<BadgeProps> = {
  args: {
    variant: 'outline',
    children: (
      <>
        ID
        <code>ctx-123</code>
      </>
    )
  }
}
