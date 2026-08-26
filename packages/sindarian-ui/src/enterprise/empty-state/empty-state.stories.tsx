import { Meta, StoryObj } from '@storybook/nextjs'
import { FileSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState, EmptyStateProps } from '.'

const meta: Meta<EmptyStateProps> = {
  title: 'Enterprise/EmptyState',
  component: EmptyState,
  argTypes: { ruled: { control: 'boolean' } }
}

export default meta

export const Default: StoryObj<EmptyStateProps> = {
  args: {
    title: 'Nothing here yet',
    description: 'Imported statements will show up in this register.'
  }
}

export const WithAction: StoryObj<EmptyStateProps> = {
  args: {
    title: 'No settlements match this view',
    description: 'Try widening the date range.',
    action: <Button size="small">Clear filters</Button>
  }
}

export const Ruled: StoryObj<EmptyStateProps> = {
  args: {
    ruled: true,
    icon: FileSearch,
    title: 'No rows',
    description: 'This register is waiting for its first entry.'
  }
}
