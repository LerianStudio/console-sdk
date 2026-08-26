import { Meta, StoryObj } from '@storybook/nextjs'
import { StatusBadge, StatusBadgeProps } from '.'

const meta: Meta<StatusBadgeProps> = {
  title: 'Enterprise/StatusBadge',
  component: StatusBadge,
  argTypes: { withIcon: { control: 'boolean' } }
}

export default meta

export const Default: StoryObj<StatusBadgeProps> = {
  args: { status: 'ACTIVE' }
}

export const Unknown: StoryObj<StatusBadgeProps> = {
  args: { status: null }
}

export const WithSeverityCue: StoryObj<StatusBadgeProps> = {
  args: { status: 'CRITICAL', withIcon: true }
}

export const LifecycleScale: StoryObj<StatusBadgeProps> = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {[
        'DRAFT',
        'PENDING',
        'PROCESSING',
        'SUCCEEDED',
        'FAILED',
        'ARCHIVED',
        'BRAND_NEW_ENUM'
      ].map((status) => (
        <StatusBadge key={status} status={status} withIcon />
      ))}
    </div>
  )
}

export const ExtendedMap: StoryObj<StatusBadgeProps> = {
  args: {
    status: 'RECONCILED',
    variantMap: { RECONCILED: 'success' },
    withIcon: true
  }
}
