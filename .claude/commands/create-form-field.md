---
description: Create a new form field component in sindarian-ui that wraps a UI primitive with react-hook-form integration. Auto-triggers when user asks to add, create, or scaffold a form field, controlled field, or field wrapper.
---

You are creating a new form field component in `packages/sindarian-ui` that wraps an existing UI component with react-hook-form. The user provides the field name (e.g., `date-picker-field`, `toggle-field`).

## Naming

- Directory: kebab-case ending in `-field` (e.g., `date-picker-field`)
- Component export: PascalCase (e.g., `DatePickerField`)
- Props type: PascalCase + `Props` suffix (e.g., `DatePickerFieldProps`)

## Prerequisites

The underlying UI component MUST already exist in `src/components/ui/`. If it doesn't, create it first using `/create-ui-component`.

## Files to create

### 1. `src/components/form/{name}/index.tsx` — Field implementation

```tsx
'use client'

import * as React from 'react'
import { Control, FieldValues, Path } from 'react-hook-form'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
// Import the underlying UI component:
// import { {UiComponent} } from '@/components/ui/{ui-component-name}'

export type {Name}FieldProps<T extends FieldValues = FieldValues> = {
  name: string
  label?: React.ReactNode
  control: Control<T>
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  // Add component-specific props here
}

export const {Name}Field = <T extends FieldValues = FieldValues>({
  name,
  label,
  control,
  required,
  disabled,
  readOnly,
  placeholder,
  ...others
}: {Name}FieldProps<T>) => {
  return (
    <FormField
      name={name as Path<T>}
      control={control}
      render={({ field }) => (
        <FormItem required={required}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            {/* Replace with actual UI component, passing field props */}
            {/* <{UiComponent} {...others} {...field} disabled={disabled} readOnly={readOnly} placeholder={placeholder} /> */}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
```

**Important patterns:**
- If the UI component uses a value type different from string (e.g., `Date`, `boolean`), handle conversion in the render function between `field.value` and the component's expected type.
- For popover-based fields (date picker, combobox), manage `open` state locally and close on selection.
- Always pass `field.onChange` to sync with react-hook-form.

### 2. `src/components/form/{name}/{name}.stories.tsx` — Story with form wrapper

```tsx
import { Meta, StoryObj } from '@storybook/nextjs'
import { useForm } from 'react-hook-form'
import { Form } from '@/components/ui/form'
import { {Name}Field, {Name}FieldProps } from '.'

function BaseComponent(args: Omit<{Name}FieldProps, 'name' | 'control'>) {
  const form = useForm()
  return (
    <Form {...form}>
      <form className="w-[320px] space-y-4" onSubmit={(e) => e.preventDefault()}>
        <{Name}Field
          {...args}
          control={form.control}
          name="fieldName"
        />
      </form>
    </Form>
  )
}

const meta: Meta<{Name}FieldProps> = {
  title: 'Components/Form/{Name}Field',
  argTypes: {},
}

export default meta

export const Default: StoryObj<{Name}FieldProps> = {
  args: {
    label: '{Display Name}',
    placeholder: 'Select...',
  },
  render: (args) => <BaseComponent {...args} />,
}

export const Required: StoryObj<{Name}FieldProps> = {
  args: {
    label: '{Display Name}',
    required: true,
  },
  render: (args) => <BaseComponent {...args} />,
}

export const Disabled: StoryObj<{Name}FieldProps> = {
  args: {
    label: '{Display Name}',
    disabled: true,
  },
  render: (args) => <BaseComponent {...args} />,
}
```

## Wiring

Add export to `packages/sindarian-ui/src/components/form/index.ts`:

```typescript
export * from './{name}'
```

Place it alphabetically among existing form field exports.

## Verification

1. Run `npx turbo build --filter=@lerianstudio/sindarian-ui` to confirm it compiles
2. Run `npx turbo check-types --filter=@lerianstudio/sindarian-ui` for type safety

## After creation

Tell the user:
- Which files were created
- Remind them to uncomment and wire the actual UI component import
- If the field handles non-string values, note they need to add value conversion logic
