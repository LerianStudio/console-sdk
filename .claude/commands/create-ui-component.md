---
description: Create a new UI component in sindarian-ui with CVA variants, Storybook story, MDX docs, and barrel export wiring. Auto-triggers when user asks to add, create, or scaffold a component in the UI library.
---

You are creating a new UI primitive component in `packages/sindarian-ui`. The user provides the component name (e.g., `date-picker`, `badge`, `toggle`).

## Naming

- Directory and file slug: kebab-case (e.g., `date-picker`)
- Component export: PascalCase (e.g., `DatePicker`)
- Variants const: camelCase + `Variants` suffix (e.g., `datePickerVariants`) — use `{nameCamel}` in templates
- Data slot: kebab-case matching directory name

## Files to create

All under `packages/sindarian-ui/src/components/ui/{name}/`:

### 1. `index.tsx` — Component implementation

```tsx
'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const {nameCamel}Variants = cva(
  '', // base classes
  {
    variants: {
      variant: {
        default: '',
      },
      size: {
        default: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export type {Name}Props = React.ComponentProps<'div'> &
  VariantProps<typeof {nameCamel}Variants> & {
    // Add custom props here
  }

function {Name}({ className, variant, size, ...props }: {Name}Props) {
  return (
    <div
      className={cn({nameCamel}Variants({ variant, size }), className)}
      data-slot="{kebab-name}"
      {...props}
    />
  )
}

export { {Name}, {nameCamel}Variants }
```

Adapt the base HTML element (`div`, `button`, `input`, etc.) based on what the component represents. If wrapping a Radix UI primitive, import from `@radix-ui/react-*` and forward refs accordingly.

### 2. `{name}.stories.tsx` — Storybook story

```tsx
import { Meta, StoryObj } from '@storybook/nextjs'
import { {Name}, {Name}Props } from '.'

const meta: Meta<{Name}Props> = {
  title: 'Primitives/{Name}',
  component: {Name},
  argTypes: {},
}

export default meta

export const Default: StoryObj<{Name}Props> = {
  args: {},
  render: (args) => <{Name} {...args} />,
}
```

Add additional stories for each variant and notable state (disabled, with icon, etc.).

### 3. `{name}.mdx` — Storybook documentation

```mdx
import { Canvas, Meta, Controls, Primary } from '@storybook/addon-docs'
import * as Story from './{name}.stories'

<Meta of={Story} />

# {Name}

{One-line description of the component.}

<Canvas of={Story.Default} />

<Primary />
<Controls />
```

### 4. `styles.css` (optional) — Component-specific Tailwind styles

Only create if the component needs custom CSS beyond inline Tailwind classes:

```css
@theme inline {
  /* Component CSS variables */
}

@layer components {
  .{name}-base {
    @apply /* base styles */;
  }
}
```

## Wiring

### If `styles.css` was created:

Add import to `packages/sindarian-ui/src/globals.css` alongside existing component style imports:

```css
@import './components/ui/{name}/styles.css';
```

### Barrel export:

Add to `packages/sindarian-ui/src/index.tsx`:

```typescript
export * from './components/ui/{name}'
```

Place it alphabetically among the existing UI component exports.

## Verification

1. Run `npx turbo build --filter=@lerianstudio/sindarian-ui` to confirm it compiles
2. Run `npx turbo check-types --filter=@lerianstudio/sindarian-ui` for type safety
3. If Storybook is running, verify the story renders at the expected path

## After creation

Tell the user:
- Which files were created and where
- Remind them to customize the CVA variants for their use case
- If it wraps a Radix primitive, suggest which `@radix-ui/react-*` package to install
