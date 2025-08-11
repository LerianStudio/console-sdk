import React from 'react'
import { Meta, StoryObj } from '@storybook/nextjs'
import {
  EntityBox,
  EntityBoxActions,
  EntityBoxBanner,
  EntityBoxCollapsible,
  EntityBoxCollapsibleContent,
  EntityBoxCollapsibleTrigger,
  EntityBoxHeaderTitle
} from '.'
import { Button } from '../ui/button'
import { useForm } from 'react-hook-form'
import { InputField, PaginationLimitField } from '../form'
import { Form } from '../ui/form'

const meta: Meta = {
  title: 'Components/EntityBox',
  component: EntityBox,
  parameters: {
    backgrounds: {
      default: 'Light'
    }
  },
  argTypes: {}
}

export default meta

export const Primary: StoryObj = {
  render: (args) => (
    <EntityBox {...args}>
      <EntityBoxHeaderTitle
        title="Ledgers"
        subtitle="Manage the ledgers of this organization."
        tooltip="Clustering or allocation of customers at different levels."
      />
      <EntityBoxActions>
        <Button>New Ledger</Button>
      </EntityBoxActions>
    </EntityBox>
  )
}

export const Collapsible: StoryObj = {
  render: (args) => {
    const form = useForm({ defaultValues: { limit: '10', name: '' } })

    return (
      <Form {...form}>
        <EntityBoxCollapsible {...args}>
          <EntityBoxBanner>
            <EntityBoxHeaderTitle
              title="Ledgers"
              subtitle="Manage the ledgers of this organization."
              tooltip="Clustering or allocation of customers at different levels."
            />
            <div className="col-start-2 flex flex-row items-center justify-center">
              <InputField
                name="name"
                placeholder="Search..."
                control={form.control}
              />
            </div>
            <EntityBoxActions>
              <Button>New Ledger</Button>
              <EntityBoxCollapsibleTrigger />
            </EntityBoxActions>
          </EntityBoxBanner>
          <EntityBoxCollapsibleContent>
            <div className="col-start-3 flex justify-end">
              <PaginationLimitField control={form.control} />
            </div>
          </EntityBoxCollapsibleContent>
        </EntityBoxCollapsible>
      </Form>
    )
  }
}
