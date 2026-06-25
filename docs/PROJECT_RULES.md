# Project Rules

## Project Type

TypeScript monorepo — frontend framework libraries (React components, Next.js server framework, logging, i18n tooling).

## Tech Stack

- TypeScript 5.9, React 19, Next.js 15
- Inversify 7 (DI), Radix UI + Tailwind CSS 4 (components), Pino (logging)
- Turborepo (build orchestration), Jest 30 (testing), Storybook 10 (docs)

## Standards

- TypeScript strict mode — no `any` unless justified with a comment
- Conventional commits scoped to package names (`feat(sindarian-ui): ...`)
- All public API through barrel files (`src/index.ts`)
- Prettier enforced: 2-space indent, no semicolons, single quotes

## Testing

- Jest + ts-jest for all packages
- @testing-library/react for UI components
- Colocated test files: `{name}.test.ts(x)` next to source
- Mock DI container and reflect-metadata in sindarian-server tests

## Package Conventions

- All published packages scoped under `@lerianstudio`
- Peer dependencies for framework integrations (React, Next.js, Inversify)
- Semantic versioning via Semantic Release
- `develop` branch → beta prereleases, `main` branch → stable releases
- Sequential releases to avoid npm publish conflicts

## Inter-Package Contract

`sindarian-logs` is a peer consumer of `sindarian-server`. Changes to server's public API (decorators, DI container, middleware interfaces) must be verified against logs.
