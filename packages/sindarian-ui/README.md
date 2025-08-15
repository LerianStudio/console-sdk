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

Add the package path to your `tailwind.config.js` to ensure proper styling:

```js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/sindarian-ui/**/*.{js,ts,jsx,tsx}' // Add this line
  ]
  // ... rest of your config
}
```

## 🚀 Quick Start

```tsx
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from 'sindarian-ui'

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

See [CHANGELOG.md](../../CHANGELOG.md) for a detailed history of changes.

## 📄 License

This project is licensed under the ISC License.

---

**Sindarian UI** is developed and maintained by [**Lerian Studio**](https://lerian.studio).

**Contact**: [contato@lerian.studio](mailto:contato@lerian.studio)  
**Website**: [https://lerian.studio](https://lerian.studio)

---
