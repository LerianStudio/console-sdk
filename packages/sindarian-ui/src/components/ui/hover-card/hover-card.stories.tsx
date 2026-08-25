import type { ComponentProps } from 'react'
import { Meta, StoryObj } from '@storybook/nextjs'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '.'

type HoverCardProps = ComponentProps<typeof HoverCard>

const meta: Meta<HoverCardProps> = {
  title: 'Primitives/HoverCard',
  component: HoverCard,
  argTypes: {}
}

export default meta

export const Primary: StoryObj<HoverCardProps> = {
  render: (args) => (
    <div className="flex h-64 items-center justify-center">
      <HoverCard {...args}>
        <HoverCardTrigger className="underline underline-offset-4">
          E2E1234567
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm font-medium">Pix end-to-end id</p>
          <p className="text-muted-foreground text-sm">
            Settled 2026-08-20 at 14:02 via SPI.
          </p>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}

export const Open: StoryObj<HoverCardProps> = {
  args: { open: true },
  render: (args) => (
    <div className="flex h-64 items-center justify-center">
      <HoverCard {...args}>
        <HoverCardTrigger className="underline underline-offset-4">
          E2E1234567
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm font-medium">Pix end-to-end id</p>
          <p className="text-muted-foreground text-sm">
            Settled 2026-08-20 at 14:02 via SPI.
          </p>
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
