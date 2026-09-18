import { Meta, StoryObj } from '@storybook/nextjs'
import { InputAdornment, Input } from '.'
import { FormProvider, useForm } from 'react-hook-form'
import { DollarSign, Eye, Search } from 'lucide-react'
import { IconButton } from '../icon-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../select'

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

/**
 * The shrink case: an `Input` sharing a narrow row with another control.
 *
 * A flex item never shrinks below its automatic minimum size, and with no
 * declared width that minimum falls back to the control's own intrinsic size —
 * 239px for a default `<input>`. `.input-base` is `flex-1` and used to declare
 * no width, so at 200px the input painted 239px, burst out of its own
 * `.input-wrapper` and left the select beside it a 42px sliver. `w-0` in
 * `.input-base` supplies the specified size the algorithm floors at instead;
 * `flex-1` still grows the input back to fill whatever space it gets.
 *
 * The widths are fixed rather than viewport-driven so the story reads the same
 * at any Storybook viewport. Both rows must stay inside their dashed outline.
 */
export const InFlexRow: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-8">
      {[200, 320, 640].map((width) => (
        <div key={width} className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">{width}px row</span>
          <div
            className="flex gap-2 outline-1 outline-pink-500 outline-dashed"
            style={{ width }}
          >
            <div className="flex-1">
              <Input placeholder="0.00" defaultValue="1234567.89" />
            </div>
            <div className="flex-1">
              <Select defaultValue="BRL">
                <SelectTrigger>
                  <SelectValue placeholder="Asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
