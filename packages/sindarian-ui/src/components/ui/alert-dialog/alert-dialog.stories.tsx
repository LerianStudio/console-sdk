import type { ComponentProps } from 'react'
import { Meta, StoryObj } from '@storybook/nextjs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '.'
import { Button } from '@/components/ui/button'

type AlertDialogProps = ComponentProps<typeof AlertDialog>

const meta: Meta<AlertDialogProps> = {
  title: 'Primitives/AlertDialog',
  component: AlertDialog,
  argTypes: {}
}

export default meta

export const Primary: StoryObj<AlertDialogProps> = {
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Reverse transaction</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reverse this transaction?</AlertDialogTitle>
          <AlertDialogDescription>
            A reversal posts a new entry against the ledger. The original
            transaction stays on the books.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Reverse</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export const Open: StoryObj<AlertDialogProps> = {
  args: { defaultOpen: true },
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this ledger?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
