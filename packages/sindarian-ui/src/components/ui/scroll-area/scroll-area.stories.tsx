import { Meta, StoryObj } from '@storybook/nextjs'
import { ScrollArea, ScrollBar } from '.'
import { Separator } from '@/components/ui/separator'

type ScrollAreaProps = React.ComponentProps<typeof ScrollArea>

const meta: Meta<ScrollAreaProps> = {
  title: 'Primitives/ScrollArea',
  component: ScrollArea,
  argTypes: {}
}

export default meta

const rows = Array.from({ length: 40 }, (_, i) => `Operation ${i + 1}`)

export const Primary: StoryObj<ScrollAreaProps> = {
  render: (args) => (
    <ScrollArea className="h-64 w-64 rounded-md border" {...args}>
      <div className="p-4">
        {rows.map((row) => (
          <div key={row}>
            <div className="text-sm">{row}</div>
            <Separator className="my-2" />
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

export const Horizontal: StoryObj<ScrollAreaProps> = {
  render: (args) => (
    <ScrollArea className="w-96 rounded-md border whitespace-nowrap" {...args}>
      <div className="flex w-max gap-4 p-4">
        {rows.slice(0, 12).map((row) => (
          <div
            key={row}
            className="bg-muted rounded-md px-4 py-8 text-sm shadow-xs"
          >
            {row}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
