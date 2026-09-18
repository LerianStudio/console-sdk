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
 * A narrow row, and the one token that decides what happens in it.
 *
 * An `Input` keeps its natural width — 239px for a default `<input>`, which is
 * the control's own intrinsic size and not something this kit picks. In a row
 * too narrow for that, a caller's column refuses to shrink below it unless the
 * caller says it may: `min-w-0` on its OWN flex item, the standard flexbox
 * idiom. The top row of each pair has not said it; the bottom row has.
 *
 * What is NOT a choice either way: the control stays inside its own box. Both
 * rows show the field and the select inside their own borders, however little
 * room they get. It used to paint 239px of itself across whatever sat beside
 * it, which is the defect `min-w-0` on `.input-base` and `.input-wrapper`
 * closes.
 *
 * The widths are fixed rather than viewport-driven so the story reads the same
 * at any Storybook viewport.
 */
export const InFlexRow: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-8">
      {[200, 320, 640].map((width) => (
        <div key={width} className="flex flex-col gap-3">
          <span className="text-muted-foreground text-xs">{width}px row</span>
          {[
            { label: 'caller says nothing — the row grows', column: 'flex-1' },
            {
              label: 'caller writes min-w-0 — the row compresses',
              column: 'min-w-0 flex-1'
            }
          ].map(({ label, column }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-muted-foreground text-[10px]">{label}</span>
              <div
                className="flex gap-2 outline-1 outline-pink-500 outline-dashed"
                style={{ width }}
              >
                <div className={column}>
                  <Input placeholder="0.00" defaultValue="1234567.89" />
                </div>
                <div className={column}>
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
      ))}
    </div>
  )
}

/**
 * The other half of the contract: a box sized BY ITS CONTENT.
 *
 * Nothing here declares a width. The field is a flex ITEM sized by whatever
 * the control says it wants to be, which is how a filter toolbar is written
 * (`flex gap-4`, a search box and a couple of selects) and how roughly a dozen
 * product-console screens are laid out. The first row is that default; the
 * second declares a width at the call site and overrides it.
 *
 * This is the case a declared width in `.input-base` cannot serve. `w-0`
 * shipped in 2.0.0-beta.10 and turned the first row into a 32px rectangle of
 * padding at every viewport, because a box can only be as wide as its content
 * asks for and the control was asking for zero. The selects beside it were
 * unaffected: they size from their label rather than from a `size` attribute.
 */
export const InContentSizedToolbar: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-8">
      {[
        { label: 'nothing declares a width', className: undefined },
        { label: 'a width declared at the call site', className: 'w-72' }
      ].map(({ label, className }) => (
        <div key={label} className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">{label}</span>
          <div className="flex gap-4 outline-1 outline-pink-500 outline-dashed">
            <div className={className}>
              <Input
                placeholder="Search..."
                startAdornment={
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                }
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="http">HTTP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
  )
}
