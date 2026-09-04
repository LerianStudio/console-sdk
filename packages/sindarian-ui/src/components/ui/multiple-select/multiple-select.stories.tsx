import { Meta, StoryObj } from '@storybook/nextjs'
import React from 'react'
import {
  MultipleSelect,
  MultipleSelectContent,
  MultipleSelectEmpty,
  MultipleSelectItem,
  MultipleSelectTrigger,
  MultipleSelectValue
} from '.'

const meta: Meta = {
  title: 'Primitives/MultipleSelect',
  component: MultipleSelect
}

export default meta

const frameworks = [
  {
    value: 'next.js',
    label: 'Next.js'
  },
  {
    value: 'sveltekit',
    label: 'SvelteKit'
  },
  {
    value: 'nuxt.js',
    label: 'Nuxt.js'
  },
  {
    value: 'remix',
    label: 'Remix'
  },
  {
    value: 'astro',
    label: 'Astro'
  }
]

const BaseLayout = ({ children }: React.PropsWithChildren) => (
  <div className="h-[256px]">{children}</div>
)

const Component = (args: any) => {
  return (
    <BaseLayout>
      <MultipleSelect {...args}>
        <MultipleSelectTrigger>
          <MultipleSelectValue placeholder="Select a framework..." />
        </MultipleSelectTrigger>
        <MultipleSelectContent>
          <MultipleSelectEmpty>
            <p className="text-muted-foreground text-sm">No frameworks found</p>
          </MultipleSelectEmpty>
          {frameworks.map((framework) => (
            <MultipleSelectItem key={framework.value} value={framework.value}>
              {framework.label}
            </MultipleSelectItem>
          ))}
        </MultipleSelectContent>
      </MultipleSelect>
    </BaseLayout>
  )
}

export const Primary: StoryObj = {
  render: (args) => <Component {...args} />
}

export const WithValues: StoryObj = {
  args: {
    showValue: true
  },
  render: (args) => <Component {...args} />
}

export const Disabled: StoryObj = {
  args: {
    disabled: true
  },
  render: (args) => <Component {...args} />
}

/**
 * The controlled shape, rendered through the REAL props type rather than the
 * `any` the other stories use. `MultipleSelectProps` spread cmdk's
 * `ComponentPropsWithoutRef`, whose `value` is a `string`, and intersected it
 * with `string[]` — so the declared `value?: string[]` resolved to
 * `string & string[]`, which nothing can satisfy. This story is the type
 * guard: it stops compiling if that intersection comes back.
 */
export const Controlled: StoryObj = {
  render: () => {
    const [value, setValue] = React.useState<string[]>(['next.js', 'remix'])

    return (
      <BaseLayout>
        <MultipleSelect value={value} onValueChange={setValue} showValue>
          <MultipleSelectTrigger>
            <MultipleSelectValue placeholder="Select a framework..." />
          </MultipleSelectTrigger>
          <MultipleSelectContent>
            <MultipleSelectEmpty>
              <p className="text-muted-foreground text-sm">
                No frameworks found
              </p>
            </MultipleSelectEmpty>
            {frameworks.map((framework) => (
              <MultipleSelectItem key={framework.value} value={framework.value}>
                {framework.label}
              </MultipleSelectItem>
            ))}
          </MultipleSelectContent>
        </MultipleSelect>
      </BaseLayout>
    )
  }
}
