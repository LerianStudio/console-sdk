## Sindarian UI

React component library built on Radix UI + ShadCN + Tailwind CSS + CVA.

### Component Layers

- **UI primitives** (`src/components/ui/`): Headless Radix wrappers with CVA styling
- **Form fields** (`src/components/form/`): react-hook-form wrappers around UI primitives
- **Composed** (`src/components/`): Higher-level components (Card, Dialog, Table, etc.)

### Adding a UI Component

1. Create `src/components/ui/{name}/index.tsx`
2. Create `src/components/ui/{name}/{name}.stories.tsx`
3. Create `src/components/ui/{name}/{name}.mdx`
4. (Optional) Create `src/components/ui/{name}/styles.css` → import in `src/globals.css`
5. Export in `src/index.tsx`: `export * from './components/ui/{name}'`

### Adding a Form Field

1. Create `src/components/form/{name}/index.tsx`
2. Wrap UI component with `FormField` / `FormControl` / `FormItem` from `@/components/ui/form`
3. Accept `control: Control<T>` from react-hook-form
4. Use generic typing: `<T extends FieldValues = FieldValues>`
5. Export in `src/components/form/index.ts`

### Component Conventions

- **CVA variants**: `cva('base-classes', { variants: {...}, defaultVariants: {...} })`
- **Class merging**: Always use `cn()` from `@/lib/utils` (clsx + tailwind-merge)
- **Data slot**: Always add `data-slot="component-name"` for CSS targeting
- **Client directive**: `'use client'` at top of component files
- **Props type**: `React.ComponentProps<'element'> & VariantProps<typeof variants> & custom`
- **Compound exports**: Large components export sub-components (Select, SelectTrigger, SelectContent, etc.)

### Storybook

- Use `Meta<Props>` + `StoryObj<Props>` from `@storybook/nextjs`
- Title paths: `Primitives/Button`, `Components/Form/InputField`
- Form stories need a `BaseComponent` wrapper with `useForm()` + `<Form>`
- MDX docs use `<Canvas of={Story.Name} />` pattern

### Testing

- `@testing-library/react` + Jest
- `renderHook` + `act` for hooks
- Test files: `{name}.test.ts` or `{name}.test.tsx`, colocated
