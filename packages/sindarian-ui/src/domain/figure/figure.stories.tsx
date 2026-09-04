import { Meta, StoryObj } from '@storybook/nextjs'

import { LABEL_VOICE_CLASS } from '@/lib/typography'
import { cn } from '@/lib/utils'

import { Figure, FigureProps, FigureSize } from '.'

const meta: Meta<FigureProps> = {
  title: 'Domain/Figure',
  component: Figure,
  argTypes: {
    size: {
      control: { type: 'select' },
      options: [
        'hero',
        'money-hero',
        'panel',
        'count',
        'row',
        'tick'
      ] satisfies FigureSize[]
    }
  }
}

export default meta

type Story = StoryObj<FigureProps>

export const Default: Story = {
  args: { size: 'panel', children: '1.240.500,00' }
}

export const Scale: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(
        ['hero', 'money-hero', 'panel', 'count', 'row', 'tick'] as FigureSize[]
      ).map((size) => (
        <div key={size} className="flex items-baseline gap-4">
          <span className={cn(LABEL_VOICE_CLASS, 'w-24')}>{size}</span>
          <Figure size={size}>1.240.500,00</Figure>
        </div>
      ))}
    </div>
  )
}

export const CreditTone: Story = {
  args: { size: 'panel', className: 'text-credit', children: '-8.820,00' }
}
