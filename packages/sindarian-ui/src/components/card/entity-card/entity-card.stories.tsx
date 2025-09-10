import { Meta, StoryObj } from '@storybook/nextjs'
import {
  EntityCard,
  EntityCardAction,
  EntityCardActionItem,
  EntityCardBadge,
  EntityCardBadgeList,
  EntityCardContent,
  EntityCardDescription,
  EntityCardFooter,
  EntityCardHeader,
  EntityCardIcon,
  EntityCardList,
  EntityCardTitle
} from '.'
import { DropdownMenuItem } from '../../ui/dropdown-menu'
import { Clock, FileText } from 'lucide-react'

const meta: Meta = {
  title: 'Components/Cards/EntityCard',
  component: EntityCard,
  parameters: {
    backgrounds: {
      default: 'Light'
    }
  },
  argTypes: {
    value: {
      control: {
        type: 'range',
        min: 0,
        max: 100,
        step: 1
      }
    }
  }
}

export default meta

export const Primary: StoryObj = {
  args: {
    progress: true,
    value: 45
  },
  render: (args) => (
    <div className="grid grid-cols-2">
      <EntityCard {...args}>
        <EntityCardAction>
          <EntityCardActionItem>Edit</EntityCardActionItem>
          <EntityCardActionItem>Delete</EntityCardActionItem>
        </EntityCardAction>
        <EntityCardHeader>
          <EntityCardIcon>
            <FileText />
          </EntityCardIcon>
          <EntityCardTitle>
            Customer Analytics Report - June 2025
          </EntityCardTitle>
          <EntityCardBadgeList>
            <EntityCardBadge>Report</EntityCardBadge>
            <EntityCardBadge variant="outline">Confidential</EntityCardBadge>
            <EntityCardBadge variant="secondary">Finance</EntityCardBadge>
          </EntityCardBadgeList>
        </EntityCardHeader>
        <EntityCardContent>
          <EntityCardDescription>
            A short description explaining what this template does or what kind
            of report it generates. Helps others understand its purpose.
          </EntityCardDescription>
          <EntityCardList>
            <li>Customer Insights Template</li>
            <li>2 ledgers</li>
          </EntityCardList>
        </EntityCardContent>
        <EntityCardFooter>
          <Clock />
          <p>12/06/2025 - 14:01</p>
        </EntityCardFooter>
      </EntityCard>
    </div>
  )
}

export const Simple: StoryObj = {
  render: (args) => (
    <div className="grid grid-cols-2">
      <EntityCard {...args}>
        <EntityCardAction>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </EntityCardAction>
        <EntityCardIcon>
          <FileText />
        </EntityCardIcon>
        <EntityCardTitle>Customer Analytics Report - June 2025</EntityCardTitle>
        <EntityCardBadgeList>
          <EntityCardBadge>Report</EntityCardBadge>
        </EntityCardBadgeList>
        <EntityCardContent>
          <EntityCardList>
            <li>Customer Insights Template</li>
            <li>2 ledgers</li>
          </EntityCardList>
        </EntityCardContent>
        <EntityCardFooter>
          <Clock />
          <p>12/06/2025 - 14:01</p>
        </EntityCardFooter>
      </EntityCard>
    </div>
  )
}
