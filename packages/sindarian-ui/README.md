# Sindarian UI

A modern, accessible React component library built on top of [Radix UI](https://www.radix-ui.com/) and [ShadCN](https://ui.shadcn.com/) design system, providing a comprehensive set of customizable components with full TypeScript support and Storybook documentation.

## ✨ Features

- 🎨 **35+ High-quality Components** - Complete set of UI primitives and application-specific components
- 🔧 **Built on Radix UI** - Leveraging the power of headless, accessible component primitives
- 🎯 **ShadCN Compatible** - Following ShadCN design patterns and conventions
- 📖 **Comprehensive Storybook** - Interactive documentation with live examples and controls
- 🔍 **TypeScript First** - Full type safety with detailed prop interfaces
- 🎭 **Tailwind CSS** - Utility-first styling with customizable design tokens
- ♿ **Accessibility** - WAI-ARIA compliant components with keyboard navigation
- 🧪 **Thoroughly Tested** - Jest test coverage for reliability
- 🎨 **Customizable** - Flexible theming and styling options
- 📱 **Responsive** - Mobile-first design approach

## 📦 Installation

Install the package using your preferred package manager:

```bash
npm install @lerianstudio/sindarian-ui
```

```bash
yarn add @lerianstudio/sindarian-ui
```

```bash
pnpm add @lerianstudio/sindarian-ui
```

### Peer Dependencies

Make sure you have the required peer dependencies installed:

```bash
npm install react@>=19.0.0 react-dom@>=19.0.0 react-hook-form@>=7.60.0 lucide-react@>=0.536.0 lodash@>=4.17.0
```

### Tailwind CSS Setup

The library is built with Tailwind CSS v4, which is configured from CSS — there
is no `tailwind.config.js`. Your app needs `tailwindcss@^4` plus
`@tailwindcss/postcss` (Next.js) or `@tailwindcss/vite` (Vite).

Wire the library into your app's entry stylesheet in this order:

```css
/* Keep the Tailwind import in your app's entry stylesheet — source scanning
   breaks when the only import lives inside node_modules. */
@import 'tailwindcss';

/* The dark variant, matched against a `.dark` class on an ancestor. */
@custom-variant dark (&:is(.dark *));

/* Design tokens, base layer and component styles. */
@import '@lerianstudio/sindarian-ui/dist/globals.css';

/* Scan the library's compiled output so its utility classes survive the
   content purge. The path is relative to this file. */
@source '../node_modules/@lerianstudio/sindarian-ui/dist';
```

Adjust the `@source` depth to where your entry stylesheet sits: `../..` from
`src/app/globals.css` in a Next.js app, `..` from `src/index.css` in a Vite app.

Non-Next.js apps must also load Inter themselves — see "Migrating to 1.3+"
below.

## 🚀 Quick Start

```tsx
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@lerianstudio/sindarian-ui'

function App() {
  return (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Welcome to Sindarian UI</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Enter your name" />
        <Button>Get Started</Button>
      </CardContent>
    </Card>
  )
}
```

## ⬆️ Migrating to 1.3+

What every app upgrading from an earlier version has had to work out.

### Remove `tailwindcss-animate`

The library imports `tw-animate-css` in its own `globals.css`. An app that still
registers the v3-era `@plugin 'tailwindcss-animate'` wins the cascade with its
`.animate-in` rules and pins every library overlay to that plugin's fixed
duration, silently. Drop the plugin directive and the dependency.

### `CardTitle` accepts a heading level

New: `CardTitle` takes an `as` prop to pick the heading level. It has always
rendered an `<h3>`, so consumer wrappers that existed only to get a real
heading element can go — and where `h3` would skip a level under a page
`<h1>`, set the level directly:

```tsx
<CardTitle as="h2">Accounts</CardTitle>
```

The omitted case still renders `h3` with the same classes and `data-slot`.

The prop types now match the rendered elements: `CardTitle` is typed against
`h3` (heading), `CardDescription` against `p` — both were typed against `div`.
A `ref` typed `Ref<HTMLDivElement>` passed to either no longer compiles;
retype it to the real element (`HTMLHeadingElement` / `HTMLParagraphElement`).

### `Toaster` follows the app theme

An unset `<Toaster />` rendered inside the library's `ThemeProvider` now
follows the provider's resolved theme instead of the OS preference. Outside a
provider nothing changes (`system`). To keep OS-following inside a provider,
pass it explicitly:

```tsx
<Toaster theme="system" />
```

### Non-Next.js apps must load Inter

`--font-sans` resolves to
`var(--font-inter, 'Inter'), 'Inter', ui-sans-serif, system-ui, sans-serif`.
`--font-inter` is a `next/font` slot: Next.js apps fill it, Vite and other
bundlers do not. The fallback list keeps text readable, but nothing installs
Inter for you. Load it and fill the slot:

```css
@import '@fontsource-variable/inter';

:root {
  --font-inter: 'Inter Variable';
}
```

### The preflight is emitted twice

The library's `globals.css` opens with `@import 'tailwindcss'`, so an app that
also imports Tailwind — as the setup above requires — gets the preflight layer
twice. The rules are identical and the duplication is harmless, costing roughly
8 KB pre-gzip. Keep the app's `@import 'tailwindcss'` first; do not drop it to
avoid the duplicate.

## 📚 Component Categories

### UI Primitives

Core building blocks based on Radix UI:

- **Layout**: `Card`, `Paper`, `Separator`, `Sheet`
- **Typography**: `Label`, `Badge`
- **Form Controls**: `Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`
- **Navigation**: `Breadcrumb`, `Tabs`, `Dropdown Menu`
- **Feedback**: `Alert`, `Toast`, `Progress`, `Skeleton`, `Loading Button`
- **Overlay**: `Dialog`, `Popover`, `Tooltip`
- **Data Display**: `Avatar`, `Table`, `Stepper`
- **Advanced**: `Autocomplete`, `Command`, `Multiple Select`, `Collapsible`

### Application Components

Higher-level components for common use cases:

- **Layout**: `Page` - Complete page layout structure
- **Data**: `Entity Box`, `Entity Data Table` - Entity display and management
- **Navigation**: `Application Breadcrumb` - Enhanced breadcrumb with path generation
- **Pagination**: `Pagination` - Data pagination controls
- **Table**: `ID Table Cell`, `Name Table Cell`, `Locked Table Actions` - Specialized table components

### Form Components

Enhanced form fields with validation:

- `Input Field`, `Password Field`, `Select Field`, `Switch Field`
- `Combo Box Field`, `Country Field`, `State Field`
- `Pagination Limit Field`

### Hooks

Custom React hooks for common functionality:

- `useToast` - Toast notification management
- `useStepper` - Step-by-step navigation
- `useClickAway` - Click outside detection
- `usePagination` - Pagination logic

## 📖 Documentation

### Storybook

Explore all components interactively with Storybook:

```bash
# Clone the repository and navigate to the package
cd packages/sindarian-ui

# Install dependencies
npm install

# Start Storybook
npm run storybook
```

Storybook will be available at `http://localhost:6007` with:

- **Interactive examples** for every component
- **Props documentation** with controls
- **Usage guidelines** and best practices
- **Accessibility information**
- **Design tokens** and theming options

### Component Documentation

Each component includes comprehensive documentation:

- Type definitions with detailed prop descriptions
- Usage examples and common patterns
- Accessibility guidelines
- Styling customization options

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm

### Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the library
npm run build

# Start development with Storybook
npm run storybook

# Type checking
npm run check-types

# Linting
npm run lint
```

### Testing

The library includes comprehensive test coverage:

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:cov
```

### Building

```bash
# Build for production
npm run build

# Build Storybook for deployment
npm run build-storybook
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a detailed history of changes.

## 📄 License

This project is licensed under the ISC License.

---

**Sindarian UI** is developed and maintained by [**Lerian Studio**](https://lerian.studio).

**Contact**: [contato@lerian.studio](mailto:contato@lerian.studio)  
**Website**: [https://lerian.studio](https://lerian.studio)

---
