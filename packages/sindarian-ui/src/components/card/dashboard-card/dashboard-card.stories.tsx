import { Meta } from '@storybook/nextjs'
import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardIcon,
  DashboardCardTitle
} from '.'
import { Users } from 'lucide-react'

const meta: Meta = {
  title: 'Components/Cards/DashboardCard',
  component: DashboardCard,
  parameters: {
    backgrounds: {
      default: 'Light'
    }
  },
  argTypes: {}
}

export default meta

export const Primary = {
  render: (args) => (
    <div className="grid grid-cols-3 gap-4">
      <DashboardCard {...args}>
        <DashboardCardIcon>
          <Users />
        </DashboardCardIcon>
        <DashboardCardTitle>Users</DashboardCardTitle>
        <DashboardCardContent>1,024</DashboardCardContent>
      </DashboardCard>
      <DashboardCard {...args}>
        <DashboardCardIcon>
          <Users />
        </DashboardCardIcon>
        <DashboardCardTitle>Users</DashboardCardTitle>
        <DashboardCardContent>1,024</DashboardCardContent>
      </DashboardCard>
      <DashboardCard {...args}>
        <DashboardCardIcon>
          <Users />
        </DashboardCardIcon>
        <DashboardCardTitle>Users</DashboardCardTitle>
        <DashboardCardContent>1,024</DashboardCardContent>
      </DashboardCard>
    </div>
  )
}
