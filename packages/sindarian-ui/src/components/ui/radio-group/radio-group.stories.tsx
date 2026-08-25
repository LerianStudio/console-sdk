import { Meta, StoryObj } from '@storybook/nextjs'
import { RadioGroup, RadioGroupItem } from '.'
import { Label } from '@/components/ui/label'

type RadioGroupProps = React.ComponentProps<typeof RadioGroup>

const meta: Meta<RadioGroupProps> = {
  title: 'Primitives/RadioGroup',
  component: RadioGroup,
  argTypes: {}
}

export default meta

const options = [
  { value: 'pix', label: 'Pix' },
  { value: 'ted', label: 'TED' },
  { value: 'siloc', label: 'SILOC' }
]

function BaseComponent(args: RadioGroupProps) {
  return (
    <RadioGroup defaultValue="pix" {...args}>
      {options.map((option) => (
        <div key={option.value} className="flex items-center gap-2">
          <RadioGroupItem value={option.value} id={`rail-${option.value}`} />
          <Label htmlFor={`rail-${option.value}`} className="font-normal">
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}

export const Primary: StoryObj<RadioGroupProps> = {
  render: (args) => BaseComponent(args)
}

export const Horizontal: StoryObj<RadioGroupProps> = {
  args: { className: 'grid-flow-col' },
  render: (args) => BaseComponent(args)
}

export const Disabled: StoryObj<RadioGroupProps> = {
  args: { disabled: true },
  render: (args) => BaseComponent(args)
}
