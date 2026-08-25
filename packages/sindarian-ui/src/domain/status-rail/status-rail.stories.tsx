import { Meta, StoryObj } from '@storybook/nextjs'

import { LivePulse, StatusRail, StatusRailProps } from '.'

const meta: Meta<StatusRailProps> = {
  title: 'Domain/StatusRail',
  component: StatusRail,
  decorators: [
    (Story) => (
      <div className="w-[720px]">
        <Story />
      </div>
    )
  ]
}

export default meta

type Story = StoryObj<StatusRailProps>

export const Default: Story = {
  args: {
    lead: 'SPI · produção',
    items: [
      { value: '90d' },
      { label: 'Atualizado', value: '12:04 UTC' },
      {
        value: (
          <>
            <LivePulse /> Live
          </>
        )
      }
    ],
    chips: [
      { label: 'Abertas', value: '12' },
      { label: 'Vencidas', value: '3', alarm: true }
    ]
  }
}

export const TapeOnly: Story = {
  args: {
    lead: 'SILOC · homologação',
    items: [{ value: '30d' }, { label: 'Janela', value: '08:00–17:30' }]
  }
}

export const CalmChips: Story = {
  args: {
    lead: 'SLC · produção',
    chips: [
      { label: 'Conciliadas', value: '1.284' },
      { label: 'Pendentes', value: '0' }
    ]
  }
}
