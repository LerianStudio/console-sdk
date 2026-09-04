import { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { SelectField, SelectFieldProps } from '.'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { SelectItem } from '@/components/ui/select'
import { MultipleSelectItem } from '@/components/ui/multiple-select'

/**
 * Story args are the presentational props only. `multi`, `value` and `onChange`
 * are the field's MODE, which each harness below fixes for itself — a control
 * that could flip `multi` from the args panel would put the field in a shape
 * its hard-coded children and callback no longer match.
 */
type SelectFieldStoryArgs = Omit<
  SelectFieldProps,
  'control' | 'multi' | 'value' | 'onChange'
>

const meta: Meta<SelectFieldStoryArgs> = {
  title: 'Components/Form/SelectField',
  component: SelectField,
  argTypes: {}
}

export default meta

function BaseComponent(args: Omit<SelectFieldStoryArgs, 'name'>) {
  const form = useForm()

  return (
    <div className="w-1/2">
      <Form {...form}>
        <SelectField
          {...args}
          control={form.control}
          label="Fruits"
          name="fruits"
          placeholder="Select..."
        >
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
        </SelectField>
      </Form>
    </div>
  )
}

function BaseComponentMultiSelect(args: Omit<SelectFieldStoryArgs, 'name'>) {
  const form = useForm()

  return (
    <div className="h-[196px] w-1/2">
      <Form {...form}>
        <SelectField
          {...args}
          control={form.control}
          label="Fruits"
          name="fruits"
          placeholder="Select..."
          multi
        >
          <MultipleSelectItem value="apple">Apple</MultipleSelectItem>
          <MultipleSelectItem value="banana">Banana</MultipleSelectItem>
          <MultipleSelectItem value="orange">Orange</MultipleSelectItem>
        </SelectField>
      </Form>
    </div>
  )
}

export const Primary: StoryObj<SelectFieldStoryArgs> = {
  render: (args) => BaseComponent(args)
}

export const Required: StoryObj<SelectFieldStoryArgs> = {
  args: {
    required: true
  },
  render: (args) => BaseComponent(args)
}

export const WithTooltip: StoryObj<SelectFieldStoryArgs> = {
  args: {
    tooltip: 'This is a Tooltip!'
  },
  render: (args) => BaseComponent(args)
}

export const WithExtraLabel: StoryObj<SelectFieldStoryArgs> = {
  args: {
    labelExtra: <span>Extra Label</span>
  },
  render: (args) => BaseComponent(args)
}

export const Disabled: StoryObj<SelectFieldStoryArgs> = {
  args: {
    disabled: true
  },
  render: (args) => BaseComponent(args)
}

export const MultiSelect: StoryObj<SelectFieldStoryArgs> = {
  render: (args) => BaseComponentMultiSelect(args)
}

export const MultiSelectDisabled: StoryObj<SelectFieldStoryArgs> = {
  args: {
    disabled: true
  },
  render: (args) => BaseComponentMultiSelect(args)
}

/** No `control`: the same select driven by plain state. */
function StatefulComponent(args: Omit<SelectFieldStoryArgs, 'name'>) {
  const [rail, setRail] = useState('')

  return (
    <div className="w-1/2">
      <SelectField
        {...args}
        label="Rail"
        name="rail"
        placeholder="Pick a rail"
        value={rail}
        onChange={(value) => setRail(value)}
      >
        <SelectItem value="pix">Pix</SelectItem>
        <SelectItem value="ted">TED</SelectItem>
      </SelectField>
      <p className="text-muted-foreground mt-2 text-xs">Rail: {rail}</p>
    </div>
  )
}

export const WithoutReactHookForm: StoryObj<SelectFieldStoryArgs> = {
  render: (args) => StatefulComponent(args)
}
