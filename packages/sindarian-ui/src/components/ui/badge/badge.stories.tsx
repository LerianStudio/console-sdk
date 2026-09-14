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

/**
 * A long label in a narrow box. The base `whitespace-nowrap` is what keeps this
 * a pill: let it wrap and `rounded-full` stretches the end caps over two lines.
 * The cap plus truncating child is the pattern for a table cell that cannot
 * afford the full width.
 */
export const LongLabel: StoryObj<BadgeProps> = {
  args: {
    variant: 'secondary',
    className: 'max-w-[180px]',
    children: <span className="truncate">Plugin Fees Administrator</span>
  },
  decorators: [
    (Story) => (
      <div className="w-[220px]">
        <Story />
      </div>
    )
  ]
}
