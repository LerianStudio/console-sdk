import { Meta, StoryObj } from '@storybook/nextjs'
import {
  Alert,
  AlertActions,
  AlertClose,
  AlertDescription,
  AlertProps,
  AlertTitle,
  AlertTopAction
} from '.'
import {
  ArrowRight,
  Ban,
  CircleCheck,
  Info,
  Terminal,
  TriangleAlert
} from 'lucide-react'
import { Button } from '../button'

const meta: Meta<AlertProps> = {
  title: 'Primitives/Alert',
  component: Alert,
  parameters: {
    backgrounds: {
      default: 'Light'
    }
  }
}

export default meta

function BaseComponent(args: any) {
  return (
    <Alert {...args}>
      {args.icon ?? <Terminal />}
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>This is an alert component</AlertDescription>
    </Alert>
  )
}

export const Primary: StoryObj<AlertProps> = {
  render: (args) => <BaseComponent {...args} />
}

export const Informative: StoryObj<AlertProps> = {
  args: {
    variant: 'informative'
  },
  render: (args) => <BaseComponent icon={<Info />} {...args} />
}

export const Warning: StoryObj<AlertProps> = {
  args: {
    variant: 'warning'
  },
  render: (args) => <BaseComponent icon={<TriangleAlert />} {...args} />
}

export const Success: StoryObj<AlertProps> = {
  args: {
    variant: 'success'
  },
  render: (args) => <BaseComponent icon={<CircleCheck />} {...args} />
}

export const Destructive: StoryObj<AlertProps> = {
  args: {
    variant: 'destructive'
  },
  render: (args) => <BaseComponent icon={<Ban />} {...args} />
}

export const TopAction: StoryObj<AlertProps> = {
  args: {
    variant: 'warning'
  },
  render: (args) => (
    <Alert {...args}>
      <TriangleAlert />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>This is an alert component</AlertDescription>
      <AlertTopAction>
        <Button
          variant="plain"
          icon={<ArrowRight />}
          iconPlacement="end"
          size="small"
        >
          Go To Setup
        </Button>
      </AlertTopAction>
    </Alert>
  )
}

export const WithActions: StoryObj<AlertProps> = {
  args: {
    variant: 'informative'
  },
  render: (args) => (
    <Alert {...args}>
      <Info />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>This is an alert component</AlertDescription>
      <AlertActions>
        <Button variant="link" size="small">
          Read the Docs
        </Button>
        <Button variant="link" size="small">
          Dismiss
        </Button>
      </AlertActions>
      <AlertClose />
    </Alert>
  )
}
