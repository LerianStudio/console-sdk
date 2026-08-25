import * as React from 'react'
import { Meta, StoryObj } from '@storybook/nextjs'
import { SearchInput, SearchInputProps } from '.'

const meta: Meta<SearchInputProps> = {
  title: 'Enterprise/SearchInput',
  component: SearchInput,
  argTypes: {
    disabled: { control: 'boolean' },
    debounceMs: { control: 'number' }
  }
}

export default meta

/** Controlled by construction — the story owns the value. */
function Harness(props: Omit<SearchInputProps, 'value' | 'onValueChange'>) {
  const [value, setValue] = React.useState('')
  return (
    <div className="space-y-2">
      <SearchInput {...props} value={value} onValueChange={setValue} />
      <p className="text-muted-foreground font-mono text-xs">
        emitted: {value === '' ? '(empty)' : value}
      </p>
    </div>
  )
}

export const Default: StoryObj<SearchInputProps> = {
  render: () => <Harness />
}

export const CustomPlaceholder: StoryObj<SearchInputProps> = {
  render: () => (
    <Harness
      placeholder="Buscar por end-to-end id…"
      clearLabel="Limpar busca"
    />
  )
}

export const SlowDebounce: StoryObj<SearchInputProps> = {
  render: () => <Harness debounceMs={1000} />
}

export const Disabled: StoryObj<SearchInputProps> = {
  render: () => <Harness disabled />
}
