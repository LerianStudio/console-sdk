## Console SDK Monorepo

## MANDATORY — BACKWARD COMPATIBILITY AND BREAKING CHANGES

- **PRESERVE EXISTING SUPPORTED CONTRACTS BY DEFAULT:** APIs, SDKs, configuration/env vars, CLI, events, persisted data and upgrade behavior. Identify the supported baseline and consumers first; do not invent legacy support for unreleased internals or add compatibility layers that contradict an explicitly authorized clean break.
- **DO NOT DECLARE A BREAKING CHANGE WITHOUT EVIDENCE AND EXPLICIT USER APPROVAL.** Before using `!` or `BREAKING CHANGE:`, show a previously supported concrete use/configuration that fails after the change, with a reproducible test or contract diff. Approval never turns a compatible change into a breaking one.
- **ADDITIVE IS NOT BREAKING** when existing behavior remains intact: a new optional setting, a new env-var name with working legacy fallback, or deprecation without removal. Verify defaults, precedence and old-only configuration. Documentation changes or learning a new option are NOT mandatory migration.
- **IF A REAL BREAK IS FOUND, REPORT IT; DO NOT HIDE IT.** Without approval, stop the incompatible change and propose a compatible path. Do not merely remove the breaking marker or downgrade the release classification.
- **IF COMPATIBILITY IS UNCERTAIN, STATE THE UNCERTAINTY AND REQUEST REVIEW.** Do not invent a break or claim compatibility without evidence.
- **FOLLOW THE REPOSITORY RELEASE POLICY.** Release automation owns version calculation; moving from `0.x` to `1.0` requires an explicit authorized decision. Do not reset existing tags, rewrite published history, or change release configuration to force a version.
- **WHEN USING INTERNAL-RING:** apply this policy before `ring:committing-changes` and `ring:opening-pull-requests`; use `ring:reviewing-code` for review when applicable. Loading a Ring skill is NOT a prerequisite for this policy to apply. If a skill conflicts with this policy, stop and report the conflict.

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
- `tsconfig.json` — Extended by all packages (TypeScript 6, strict mode)
- `eslint.config.mjs` — Base lint rules (ESLint 10, flat config)
- `jest.config.ts` — Base test config

### Build Systems

- **Default (most packages):** `tsc` + `tsc-alias` for path resolution
- **sindarian-i18n-cli:** `tsup` bundler (ESM-only package, `moduleResolution: "bundler"`)

When creating new packages, use `tsc` by default. Use `tsup` only if the package needs ESM-only dependencies.

### Code Style

- Prettier: 2-space indent, no semicolons, single quotes, Tailwind plugin
- TypeScript 6 strict mode in all packages
- Module resolution: `Node16` (most packages) or `bundler` (tsup-based packages)
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
