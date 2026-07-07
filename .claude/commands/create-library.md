---
description: Scaffold a new @lerianstudio library package in the monorepo
---

You are scaffolding a new library package in the console-sdk monorepo. The user will provide a package name.

## Validation

- Name MUST be kebab-case (e.g., `sindarian-auth`, `sindarian-cache`)
- Name SHOULD start with `sindarian-` to match existing conventions
- If the name doesn't start with `sindarian-`, confirm with the user before proceeding

## Steps

### 1. Create directory structure

Create `packages/{name}/` with:

```
packages/{name}/
├── src/
│   └── index.ts
├── .claude/
│   └── CLAUDE.md
├── package.json
├── tsconfig.json
├── tsconfig.eslint.json
├── eslint.config.mjs
├── jest.config.ts
├── .releaserc.cjs
└── CHANGELOG.md
```

### 2. File contents

**src/index.ts** — Empty barrel:
```typescript
// Public API exports
```

**package.json**:
```json
{
  "name": "@lerianstudio/{name}",
  "version": "1.0.0-beta.0",
  "description": "",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc && tsc-alias -p tsconfig.json",
    "check-types": "tsc --noEmit",
    "lint": "eslint . --fix",
    "test": "jest"
  },
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/LerianStudio/console-sdk.git"
  },
  "license": "ISC"
}
```

**tsconfig.json**:
```json
{
  "extends": "../utils/tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "Node16",
    "moduleResolution": "Node16",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**tsconfig.eslint.json**:
```json
{
  "extends": "../utils/tsconfig.json",
  "compilerOptions": {
    "rootDir": ".",
    "module": "Node16",
    "moduleResolution": "Node16",
    "noEmit": true,
    "allowJs": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**eslint.config.mjs** — Read an existing package's `eslint.config.mjs` (e.g., `packages/sindarian-server/eslint.config.mjs`) and create one with the same structure.

**jest.config.ts**:
```typescript
import baseConfig from '../utils/jest.config'

export default {
  ...baseConfig,
}
```

**.releaserc.cjs** — Read an existing package's `.releaserc.cjs` (e.g., `packages/sindarian-server/.releaserc.cjs`) and create one with the same structure but updated for the new package name.

**CHANGELOG.md**:
```markdown
# Changelog
```

**.claude/CLAUDE.md** — Template:
```markdown
## {Package Display Name}

{Brief description — fill in after implementation}

### Architecture

{Describe the key abstractions and patterns}

### Public API

{List the main exports and their purpose}

### Adding New Features

{Step-by-step recipe for common additions}

### Testing

{Testing conventions and patterns}
```

### 3. Install dependencies

Run `npm install` from the repo root to update the workspace lockfile.

### 4. Verify

Run `npx turbo build --filter=@lerianstudio/{name}` to confirm the package builds.

### 5. Report

Tell the user:
- Which files were created
- Remind them to fill in the CLAUDE.md template
- Remind them to add the package scope to the commit conventions if it differs from the directory name
