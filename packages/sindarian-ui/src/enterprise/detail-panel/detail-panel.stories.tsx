import * as React from 'react'
import { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from '@/components/ui/button'
import { SheetClose } from '@/components/ui/sheet'
import { DetailPanel, DetailPanelProps } from '.'

const meta: Meta<DetailPanelProps> = {
  title: 'Enterprise/DetailPanel',
  component: DetailPanel,
  argTypes: { side: { control: 'inline-radio', options: ['right', 'left'] } }
}

export default meta

/** Controlled by construction — the story owns `open`. */
function Harness(props: Omit<DetailPanelProps, 'open' | 'onOpenChange'>) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Inspect record</Button>
      <DetailPanel {...props} open={open} onOpenChange={setOpen} />
    </>
  )
}

const body = (
  <div className="space-y-4">
    {Array.from({ length: 12 }).map((_, i) => (
      <p key={i} className="text-muted-foreground text-sm">
        Operation {i + 1}: debit R$ 1.204,00 / credit R$ 1.204,00.
      </p>
    ))}
  </div>
)

export const Default: StoryObj<DetailPanelProps> = {
  render: () => <Harness title="Transaction txn_8f2a">{body}</Harness>
}

export const WithFooter: StoryObj<DetailPanelProps> = {
  render: () => (
    <Harness
      title="Transaction txn_8f2a"
      footer={
        <>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button>Save</Button>
        </>
      }
    >
      {body}
    </Harness>
  )
}

export const WithHeaderActions: StoryObj<DetailPanelProps> = {
  render: () => (
    <Harness
      title="Transaction txn_8f2a"
      actions={
        <Button variant="outline" size="small">
          Retry
        </Button>
      }
    >
      {body}
    </Harness>
  )
}
