import React from 'react'
import { Meta, StoryObj } from '@storybook/nextjs'
import {
  OnboardDialogContent,
  OnboardDialogHeader,
  OnboardDialogIcon,
  OnboardDialogTitle
} from '.'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader
} from '../../ui/dialog'
import { Button } from '../../ui/button'
import Image from 'next/image'

const meta: Meta = {
  title: 'Components/Dialogs/LargeDialog',
  component: Dialog,
  argTypes: {}
}

export default meta

export const Default: StoryObj = {
  render: (args) => {
    const [open, setOpen] = React.useState(false)

    return (
      <>
        <Button onClick={() => setOpen(true)}>Open</Button>
        <Dialog {...args} open={open} onOpenChange={setOpen}>
          <OnboardDialogContent>
            <DialogHeader>
              <OnboardDialogHeader>
                <OnboardDialogTitle
                  upperTitle="Midaz's Welcome"
                  title="Initial setup complete!"
                />
                <OnboardDialogIcon>
                  <Image
                    src="/animations/confetti-ball.gif"
                    alt="Confetti"
                    height={64}
                    width={64}
                  />
                </OnboardDialogIcon>
              </OnboardDialogHeader>
              <DialogDescription>
                The ledger has been successfully created and is now ready to
                receive Assets, Accounts and Portfolios.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button>Explore Midaz</Button>
            </DialogFooter>
          </OnboardDialogContent>
        </Dialog>
      </>
    )
  }
}
