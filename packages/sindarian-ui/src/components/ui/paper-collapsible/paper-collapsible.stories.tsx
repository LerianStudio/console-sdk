import { Meta, StoryObj } from '@storybook/nextjs'
import {
  PaperCollapsible,
  PaperCollapsibleBanner,
  PaperCollapsibleContent,
  PaperCollapsibleProps,
  PaperCollapsibleTrigger
} from '.'

const meta: Meta<PaperCollapsibleProps> = {
  title: 'Primitives/PaperCollapsible',
  component: PaperCollapsible,
  argTypes: {}
}

export default meta

export const Default: StoryObj<PaperCollapsibleProps> = {
  render: (args) => (
    <div className="">
      <PaperCollapsible {...args}>
        <PaperCollapsibleBanner>Banner</PaperCollapsibleBanner>
        <PaperCollapsibleContent>
          <div className="text-shadcn-500 p-6">
            This is the content of the collapsible. You can put any content
            here, such as text, images, or other components.
          </div>
        </PaperCollapsibleContent>
      </PaperCollapsible>
    </div>
  )
}
