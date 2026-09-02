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

## Release Back-Merge

Every stable release on `main` must be merged back into `develop`. Skipping it freezes the version line.

- The release bot commits the `package.json` and `CHANGELOG.md` bumps on `main` and tags them there, so the stable tag is unreachable from `develop` until the back-merge lands
- Semantic Release then computes prereleases from the newest tag it can see on `develop`, publishing betas below an already-published stable — shipped: `sindarian-ui-v1.3.0-beta.7` sits under the `sindarian-ui-v1.3.0` stable
- The shared release workflow pushes the back-merge itself; if it fails (`package.json` and `CHANGELOG.md` are the conflict-prone pair), resolving it is a BLOCKING follow-up before the next release
- Four occurrences so far — bot sync PRs #90, #96, #112 and #148; the 1.2.0 line stayed frozen 41 days until the manual back-merge #145 landed on 2026-08-26, and the 1.3.0 line froze the same way that day and required a second manual back-merge (#164)

## Inter-Package Contract

`sindarian-logs` is a peer consumer of `sindarian-server`. Changes to server's public API (decorators, DI container, middleware interfaces) must be verified against logs.
