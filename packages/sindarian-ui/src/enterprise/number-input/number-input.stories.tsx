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
function Harness({
  initial = 1234.5,
  ...props
}: Omit<NumberInputProps, 'value' | 'onValueChange'> & {
  initial?: number | null
}) {
  const [value, setValue] = React.useState<number | null>(initial)
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
    <Harness
      aria-label="Retries"
      // Inside [min, max] — the shared default (1234.5) starts out of range and
      // makes the story open on a clamped-looking, already-invalid field.
      initial={3}
      min={0}
      max={10}
      step={1}
      precision={0}
    />
  )
}

export const FloatSafeStepping: StoryObj<NumberInputProps> = {
  render: () => (
    <Harness aria-label="Rate" initial={0.1} step={0.2} precision={2} />
  )
}

export const Disabled: StoryObj<NumberInputProps> = {
  render: () => <Harness aria-label="Amount" disabled />
}
