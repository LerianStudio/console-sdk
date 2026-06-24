## Console SDK Monorepo

TypeScript monorepo for Lerian's frontend framework ecosystem. Published under `@lerianstudio` on npm.

### Packages

| Package | Description |
|---------|-------------|
| `sindarian-server` | NestJS-inspired framework for Next.js (decorators, DI, middleware) |
| `sindarian-ui` | 35+ React component library (Radix UI + ShadCN + Tailwind) |
| `sindarian-logs` | Request-scoped logging with `@Traceable()` decorator |
| `sindarian-i18n-cli` | i18n extraction, validation, and key diffing CLI |
| `utils` (internal) | Shared ESLint, Jest, and TypeScript base configs |

### Commands

| Task | Command |
|------|---------|
| Build all | `npx turbo build` |
| Build one | `npx turbo build --filter=@lerianstudio/{pkg}` |
| Test all | `npx turbo test` |
| Lint all | `npx turbo lint` |
| Type check | `npx turbo check-types` |

### Commit Conventions

Conventional commits scoped to package short names:
- `feat(sindarian-ui): add DatePicker component`
- `fix(sindarian-server): resolve guard execution order`
- `chore(sindarian-logs): bump pino to v9.1`

Valid scopes: `sindarian-server`, `sindarian-ui`, `sindarian-logs`, `sindarian-i18n-cli`

### Release Process

- Semantic Release on push to `main` (stable) or `develop` (beta prerelease)
- Tag format: `@lerianstudio/{package}-v{version}`
- Each package has its own `.releaserc.cjs` extending `.releaserc.base.cjs`
- Releases are sequential (max-parallel: 1) to avoid npm conflicts

### Inter-Package Dependencies

```
sindarian-logs → sindarian-server (peer dependency)
sindarian-ui   → (standalone)
sindarian-i18n-cli → (standalone)
```

When modifying sindarian-server's public API, check sindarian-logs for breakage.

### Shared Configuration

Base configs live in `packages/utils/` (not published):
- `tsconfig.json` — Extended by all packages
- `eslint.config.mjs` — Base lint rules
- `jest.config.ts` — Base test config

### Code Style

- Prettier: 2-space indent, no semicolons, single quotes, Tailwind plugin
- TypeScript strict mode in all packages
- Path aliases: `@/*` → `./src/*`
- All public API exported through barrel files (`src/index.ts`)

### Adding a New Package

Use `/create-library {name}` to scaffold a new package with the correct structure.

## Collaboration Guidelines

- **Challenge and question**: Don't immediately agree or proceed with requests that seem suboptimal, unclear, or potentially problematic
- **Push back constructively**: If a proposed approach has issues, suggest better alternatives with clear reasoning
- **Think critically**: Consider edge cases, performance implications, maintainability, and best practices before implementing
- **Seek clarification**: Ask follow-up questions when requirements are ambiguous or could be interpreted multiple ways
- **Propose improvements**: Suggest better patterns, more robust solutions, or cleaner implementations when appropriate
- **Be a thoughtful collaborator**: Act as a good teammate who helps improve the overall quality and direction of the project
