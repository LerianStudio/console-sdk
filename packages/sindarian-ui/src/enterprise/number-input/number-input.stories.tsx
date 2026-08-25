import * as React from 'react'
import { Meta, StoryObj } from '@storybook/nextjs'
import { NumberInput, NumberInputProps } from '.'

const meta: Meta<NumberInputProps> = {
  title: 'Enterprise/NumberInput',
  component: NumberInput,
  argTypes: { disabled: { control: 'boolean' } }
}

export default meta

/** Controlled by construction — the story owns the value. */
function Harness(props: Omit<NumberInputProps, 'value' | 'onValueChange'>) {
  const [value, setValue] = React.useState<number | null>(1234.5)
  return (
    <div className="space-y-2">
      <NumberInput {...props} value={value} onValueChange={setValue} />
      <p className="text-muted-foreground font-mono text-xs">
        committed: {value === null ? 'null' : String(value)}
      </p>
    </div>
  )
}

export const Default: StoryObj<NumberInputProps> = {
  render: () => <Harness aria-label="Amount" />
}

export const BrazilianLocale: StoryObj<NumberInputProps> = {
  render: () => (
    <Harness aria-label="Valor" locale="pt-BR" precision={2} step={0.5} />
  )
}

export const Bounded: StoryObj<NumberInputProps> = {
  render: () => (
    <Harness aria-label="Retries" min={0} max={10} step={1} precision={0} />
  )
}

export const Disabled: StoryObj<NumberInputProps> = {
  render: () => <Harness aria-label="Amount" disabled />
}
