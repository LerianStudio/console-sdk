import { Meta, StoryObj } from '@storybook/nextjs'
import {
  AccountBalanceCard,
  AccountBalanceCardContent,
  AccountBalanceCardDeleteButton,
  AccountBalanceCardEmpty,
  AccountBalanceCardHeader,
  AccountBalanceCardIcon,
  AccountBalanceCardInfo,
  AccountBalanceCardLoading,
  AccountBalanceCardTitle,
  AccountBalanceCardTrigger,
  AccountBalanceCardUpdateButton
} from '.'
import { Separator } from '../../ui/separator'
import React from 'react'
import dayjs from 'dayjs'
import 'dayjs/plugin/relativeTime'

const meta: Meta = {
  title: 'Components/Cards/AccountCard',
  component: AccountBalanceCard,
  parameters: {
    backgrounds: {
      default: 'Light'
    }
  },
  argTypes: {}
}

export default meta

export const Primary: StoryObj = {
  render: (args) => {
    const [open, setOpen] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [time, setTime] = React.useState(Date.now())

    const handleRefresh = () => {
      setLoading(true)
      setTimeout(() => {
        setTime(Date.now())
        setLoading(false)
      }, 2000)
    }

    return (
      <AccountBalanceCard
        className="w-80"
        open={open}
        onOpenChange={setOpen}
        {...args}
      >
        <AccountBalanceCardHeader>
          <AccountBalanceCardTitle>krasinski</AccountBalanceCardTitle>
          <AccountBalanceCardDeleteButton />
        </AccountBalanceCardHeader>
        <AccountBalanceCardContent>
          <AccountBalanceCardInfo assetCode="USD" value={'999999999.0'} />
          <AccountBalanceCardInfo assetCode="BRL" value={'10000.0'} />

          <Separator className="mt-3 mb-2" />
          <AccountBalanceCardUpdateButton
            loading={loading}
            timestamp={time}
            updatedInLabel={dayjs(time).fromNow()}
            onRefresh={handleRefresh}
          />
        </AccountBalanceCardContent>
        <AccountBalanceCardTrigger
          openLabel="Show balance"
          closeLabel="Hide balance"
        />
      </AccountBalanceCard>
    )
  }
}

export const Icon: StoryObj = {
  render: (args) => {
    const time = React.useMemo(() => Date.now(), [])

    return (
      <AccountBalanceCard className="w-80" {...args}>
        <AccountBalanceCardHeader>
          <AccountBalanceCardIcon />
          <AccountBalanceCardTitle>krasinski</AccountBalanceCardTitle>
          <AccountBalanceCardDeleteButton />
        </AccountBalanceCardHeader>
        <AccountBalanceCardContent>
          <AccountBalanceCardInfo assetCode="USD" value={'999999999.0'} />

          <Separator className="mt-3 mb-2" />
          <AccountBalanceCardUpdateButton
            timestamp={time}
            updatedInLabel={dayjs(time).fromNow()}
            onRefresh={() => {}}
          />
        </AccountBalanceCardContent>
        <AccountBalanceCardTrigger
          openLabel="Show balance"
          closeLabel="Hide balance"
        />
      </AccountBalanceCard>
    )
  }
}

export const NoExpand: StoryObj = {
  render: (args) => {
    return (
      <AccountBalanceCard className="w-80" {...args}>
        <AccountBalanceCardHeader>
          <AccountBalanceCardTitle>krasinski</AccountBalanceCardTitle>
          <AccountBalanceCardDeleteButton />
        </AccountBalanceCardHeader>
      </AccountBalanceCard>
    )
  }
}

export const Loading: StoryObj = {
  render: (args) => {
    const time = React.useMemo(() => Date.now(), [])

    return (
      <AccountBalanceCard className="w-80" open {...args}>
        <AccountBalanceCardHeader>
          <AccountBalanceCardTitle>krasinski</AccountBalanceCardTitle>
          <AccountBalanceCardDeleteButton />
        </AccountBalanceCardHeader>
        <AccountBalanceCardContent>
          <AccountBalanceCardLoading />
          <Separator className="mt-3 mb-2" />
          <AccountBalanceCardUpdateButton
            loading={true}
            timestamp={time}
            updatedInLabel={dayjs(time).fromNow()}
            onRefresh={() => {}}
          />
        </AccountBalanceCardContent>
        <AccountBalanceCardTrigger
          openLabel="Show balance"
          closeLabel="Hide balance"
        />
      </AccountBalanceCard>
    )
  }
}

export const Empty: StoryObj = {
  render: (args) => {
    const time = React.useMemo(() => Date.now(), [])

    return (
      <AccountBalanceCard className="w-80" open {...args}>
        <AccountBalanceCardHeader>
          <AccountBalanceCardTitle>krasinski</AccountBalanceCardTitle>
          <AccountBalanceCardDeleteButton />
        </AccountBalanceCardHeader>
        <AccountBalanceCardContent>
          <AccountBalanceCardEmpty>
            This account has no balances.
          </AccountBalanceCardEmpty>
          <Separator className="mt-3 mb-2" />
          <AccountBalanceCardUpdateButton
            timestamp={time}
            updatedInLabel={dayjs(time).fromNow()}
            onRefresh={() => {}}
          />
        </AccountBalanceCardContent>
        <AccountBalanceCardTrigger
          openLabel="Show balance"
          closeLabel="Hide balance"
        />
      </AccountBalanceCard>
    )
  }
}

export const Simple: StoryObj = {
  render: (args) => {
    return (
      <AccountBalanceCard className="w-80" open {...args}>
        <AccountBalanceCardHeader>
          <AccountBalanceCardTitle>krasinski</AccountBalanceCardTitle>
        </AccountBalanceCardHeader>
      </AccountBalanceCard>
    )
  }
}
