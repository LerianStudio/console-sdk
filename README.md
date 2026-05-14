# Console SDK

A monorepo containing frontend libraries and tools for building modern web applications with Next.js and React.

## 📦 Packages

### [@lerianstudio/sindarian-server](./packages/sindarian-server)

A lightweight, NestJS-inspired framework designed specifically for Next.js applications. Build scalable APIs with familiar decorator-based architecture while leveraging Next.js's serverless capabilities.

**Key Features**:

- 🎯 NestJS-like API with familiar decorators and patterns
- ⚡ Next.js optimized for serverless environments
- 💉 Dependency injection powered by Inversify
- 🎨 Decorator-based routing
- 🔌 Middleware support with interceptors and exception filters
- 📘 TypeScript-first with full type safety

[View Documentation →](./packages/sindarian-server)

---

### [@lerianstudio/sindarian-ui](./packages/sindarian-ui)

A modern, accessible React component library built on top of Radix UI and ShadCN design system, providing a comprehensive set of customizable components with full TypeScript support and Storybook documentation.

**Key Features**:

- 🎨 35+ high-quality React components
- 🔧 Built on Radix UI primitives
- 🎯 ShadCN compatible design patterns
- 📖 Comprehensive Storybook documentation
- 🔍 TypeScript-first with detailed prop interfaces
- 🎭 Tailwind CSS styling
- ♿ Fully accessible (WAI-ARIA compliant)

[View Documentation →](./packages/sindarian-ui)

---

### [@lerianstudio/sindarian-logs](./packages/sindarian-logs)

A unified logging and tracing system for Sindarian Server applications. Aggregates all log events within a request into a single structured JSON entry with automatic trace IDs.

**Key Features**:

- 📋 One structured log per HTTP request with event aggregation
- 🔗 Automatic trace ID generation (UUID) via AsyncLocalStorage
- ⬆️ Level escalation — final log level = highest severity event
- 🎯 `@Traceable()` decorator for automatic method-level tracing
- 🌐 `withTrace()` for non-class code (NextAuth, cron jobs, queues)
- 🔌 Seamless Sindarian Server integration via `LoggerModule`

[View Documentation →](./packages/sindarian-logs)

---

### [@lerianstudio/sindarian-i18n-cli](./packages/sindarian-i18n-cli)

An i18n message extraction, validation, and key diffing CLI + library for React/TypeScript projects using react-intl.

**Key Features**:

- 🔍 Extract messages from `defineMessages()`, `<FormattedMessage>`, `intl.formatMessage()`, and custom functions
- ✅ Validate messages for missing IDs, missing text, and duplicate conflicts
- 🔑 Diff extracted keys against locale files to find new/stale translations
- 🖥️ Commander-based CLI with `extract`, `check`, and `check-keys` commands
- 📦 Also usable as a library for programmatic access

[View Documentation →](./packages/sindarian-i18n-cli)

---

## ✨ Features

- ✅ **Monorepo Structure** - Powered by npm workspaces and Turbo
- ✅ **TypeScript Support** - Full type safety across all packages
- ✅ **ESLint + Prettier** - Code quality and formatting
- ✅ **Jest Testing** - Comprehensive test coverage
- ✅ **Semantic Release** - Automated versioning and publishing
- ✅ **Git Hooks** - Pre-commit validation with `node-git-hooks`
- ✅ **CI/CD Pipeline** - GitHub Actions workflows

---

## 🚀 Getting Started

### Installation

```bash
# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

### Development Workflow

```bash
# Work on a specific package
cd packages/sindarian-server  # or sindarian-ui
npm run build

# Run package-specific tests
npm test

# Start Storybook (for sindarian-ui)
cd packages/sindarian-ui
npm run storybook
```

---

## 📚 Documentation

Each package contains its own comprehensive documentation:

- [**Sindarian Server Documentation**](./packages/sindarian-server) - Framework API, examples, and guides
- [**Sindarian UI Documentation**](./packages/sindarian-ui) - Component library with Storybook
- [**Sindarian Logs Documentation**](./packages/sindarian-logs) - Logging and tracing system
- [**Sindarian i18n CLI Documentation**](./packages/sindarian-i18n-cli) - i18n extraction and validation

---

## 🏗️ Project Structure

```
console-sdk/
├── packages/
│   ├── sindarian-server/       # Next.js server framework
│   ├── sindarian-ui/           # React component library
│   ├── sindarian-logs/         # Logging and tracing system
│   ├── sindarian-i18n-cli/     # i18n extraction and validation CLI
│   └── utils/                  # Shared utilities and base configs
├── package.json                # Root workspace configuration
└── turbo.json                  # Turbo build configuration
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

This project is licensed under the ISC License.

---

## 👥 Author

**Lerian Studio**
Email: [contato@lerian.studio](mailto:contato@lerian.studio)
Website: [https://lerian.studio](https://lerian.studio)

---

## 🔗 Links

- [GitHub Repository](https://github.com/LerianStudio/console-sdk)
- [NPM Organization](https://www.npmjs.com/org/lerianstudio)
