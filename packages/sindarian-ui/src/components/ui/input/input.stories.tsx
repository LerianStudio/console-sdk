import { Meta, StoryObj } from '@storybook/nextjs'
import { InputAdornment, Input } from '.'
import { FormProvider, useForm } from 'react-hook-form'
import { DollarSign, Eye, Search } from 'lucide-react'
import { IconButton } from '../icon-button'

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  argTypes: {
    disabled: {
      type: 'boolean',
      description: 'If the input is disabled'
    },
    className: {
      type: 'string',
      description: "The input's class"
    }
  }
}

export default meta

export const Default: StoryObj<typeof Input> = {
  args: {
    placeholder: 'Input'
  },
  render: (args) => {
    const form = useForm()
    return (
      <FormProvider {...form}>
        <Input {...args} />
      </FormProvider>
    )
  }
}

export const Icons: StoryObj<typeof Input> = {
  args: {
    placeholder: 'Input'
  },
  render: (args) => {
    const form = useForm()
    return (
      <FormProvider {...form}>
        <div className="flex flex-col gap-2">
          <Input
            {...args}
            startAdornment={
              <InputAdornment position="start">
                <DollarSign />
              </InputAdornment>
            }
          />
          <Input
            {...args}
            endAdornment={
              <InputAdornment position="end">
                <Search />
              </InputAdornment>
            }
          />
        </div>
      </FormProvider>
    )
  }
}

export const Buttons: StoryObj<typeof Input> = {
  args: {
    placeholder: 'Input'
  },
  render: (args) => {
    const form = useForm()
    return (
      <FormProvider {...form}>
        <div className="flex flex-col gap-2">
          <Input
            {...args}
            startAdornment={
              <InputAdornment position="start">
                <IconButton variant="outline" rounded>
                  <Search />
                </IconButton>
              </InputAdornment>
            }
          />
          <Input
            {...args}
            endAdornment={
              <InputAdornment position="end">
                <IconButton variant="outline" rounded>
                  <Eye />
                </IconButton>
              </InputAdornment>
            }
          />
        </div>
      </FormProvider>
    )
  }
}

export const ReadOnly: StoryObj<typeof Input> = {
  args: {
    placeholder: 'Input',
    value: 'Read Only Input',
    readOnly: true
  },
  render: (args) => {
    const form = useForm()
    return (
      <FormProvider {...form}>
        <Input {...args} />
      </FormProvider>
    )
  }
}

export const Disabled: StoryObj<typeof Input> = {
  args: {
    placeholder: 'Input',
    disabled: true
  },
  render: (args) => {
    const form = useForm()
    return (
      <FormProvider {...form}>
        <Input {...args} />
      </FormProvider>
    )
  }
}
