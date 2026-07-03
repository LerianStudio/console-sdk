# sindarian-i18n-cli Package Implementation Plan

> **For Agents:** REQUIRED SUB-SKILL: Use ring-default:executing-plans to implement this plan task-by-task.

**Goal:** Create `@lerianstudio/sindarian-i18n-cli`, a new monorepo package that bundles the i18n extraction/validation/diff library with a Commander-based CLI binary (`sindarian-i18n`).

**Architecture:** The package has three layers: (1) core library modules (`extractor`, `validator`, `key-differ`, `reporter`) copied from the product-console source with import paths adjusted, (2) a config loader that reads a project-level config file, and (3) a Commander CLI that wires config + core modules into three commands (`extract`, `check`, `check-keys`). The core library is also re-exported for programmatic use.

**Tech Stack:** TypeScript (CommonJS target), Commander (CLI framework), `@formatjs/ts-transformer` (message extraction), `glob` (file matching), `json-stable-stringify` (deterministic JSON), Jest + ts-jest (testing), ESLint flat config, tsc + tsc-alias (build).

**Global Prerequisites:**
- Environment: Windows 11 or Linux/macOS, Node.js 18+, npm 9+
- Tools: Verify with commands below
- Access: No API keys needed
- State: Work from the `develop` branch in `C:\Users\caio_\Projects\console-sdk`

**Verification before starting:**
```bash
node --version        # Expected: v18.x or higher
npm --version         # Expected: 9.x or higher
git status            # Expected: clean working tree on develop branch
npx tsc --version     # Expected: 5.x
```

---

## Task 1: Create package directory structure

**Files:**
- Create: `packages/sindarian-i18n-cli/` (directory)
- Create: `packages/sindarian-i18n-cli/src/` (directory)

**Step 1: Create the directory structure**

Run:
```bash
mkdir -p packages/sindarian-i18n-cli/src
```

**Step 2: Verify**

Run:
```bash
ls packages/sindarian-i18n-cli/src
```

**Expected output:** Empty directory listing (no error).

**Step 3: Commit**

```bash
git add packages/sindarian-i18n-cli
git commit -m "chore(sindarian-i18n-cli): scaffold empty package directory"
```

**If Task Fails:**
1. Check you are in the monorepo root: `ls packages/sindarian-server` should succeed.
2. Rollback: `git checkout -- .`

---

## Task 2: Create package.json

**Files:**
- Create: `packages/sindarian-i18n-cli/package.json`

**Step 1: Create `packages/sindarian-i18n-cli/package.json`**

```json
{
  "name": "@lerianstudio/sindarian-i18n-cli",
  "version": "1.0.0-beta.1",
  "description": "i18n message extraction, validation, and key diffing CLI for Sindarian projects",
  "license": "ISC",
  "author": {
    "name": "Lerian Studio",
    "email": "contato@lerian.studio",
    "url": "https://lerian.studio"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/LerianStudio/console-sdk.git",
    "directory": "packages/sindarian-i18n-cli"
  },
  "type": "commonjs",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "sindarian-i18n": "./dist/cli.js"
  },
  "files": [
    "dist"
  ],
  "exports": {
    ".": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc && npm run build:paths",
    "build:paths": "tsc-alias -p tsconfig.json",
    "test": "jest",
    "test:e2e": "exit 0",
    "lint": "eslint . --fix",
    "lint:check": "eslint ."
  },
  "dependencies": {
    "@formatjs/ts-transformer": "^3.13.28",
    "commander": "^13.1.0",
    "glob": "^11.0.2",
    "json-stable-stringify": "^1.2.1",
    "typescript": "^5.9.3"
  },
  "devDependencies": {
    "@types/json-stable-stringify": "^1.1.0"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

**Step 2: Verify the file is valid JSON**

Run:
```bash
node -e "require('./packages/sindarian-i18n-cli/package.json'); console.log('OK')"
```

**Expected output:**
```
OK
```

**Step 3: Commit**

```bash
git add packages/sindarian-i18n-cli/package.json
git commit -m "chore(sindarian-i18n-cli): add package.json with dependencies and bin entry"
```

**If Task Fails:**
1. JSON parse error: check for trailing commas or missing quotes.
2. Rollback: `git checkout -- packages/sindarian-i18n-cli/package.json`

---

## Task 3: Create tsconfig.json and tsconfig.eslint.json

**Files:**
- Create: `packages/sindarian-i18n-cli/tsconfig.json`
- Create: `packages/sindarian-i18n-cli/tsconfig.eslint.json`

**Step 1: Create `packages/sindarian-i18n-cli/tsconfig.json`**

```json
{
  "extends": "../utils/tsconfig.json",
  "compilerOptions": {
    "target": "ES2021",
    "module": "CommonJS",
    "moduleResolution": "node",
    "baseUrl": ".",
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["jest", "node"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

**Step 2: Create `packages/sindarian-i18n-cli/tsconfig.eslint.json`**

```json
{
  "extends": "../utils/tsconfig.json",
  "compilerOptions": {
    "target": "ES2021",
    "module": "CommonJS",
    "moduleResolution": "node",
    "baseUrl": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "types": ["jest", "node"],
    "noEmit": true,
    "allowJs": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.test.ts",
    "src/**/*.spec.ts"
  ]
}
```

**Step 3: Verify both are valid JSON**

Run:
```bash
node -e "require('./packages/sindarian-i18n-cli/tsconfig.json'); require('./packages/sindarian-i18n-cli/tsconfig.eslint.json'); console.log('OK')"
```

**Expected output:**
```
OK
```

**Step 4: Commit**

```bash
git add packages/sindarian-i18n-cli/tsconfig.json packages/sindarian-i18n-cli/tsconfig.eslint.json
git commit -m "chore(sindarian-i18n-cli): add tsconfig.json and tsconfig.eslint.json"
```

**If Task Fails:**
1. If `extends` path is wrong, verify `ls packages/utils/tsconfig.json` exists.
2. Rollback: `git checkout -- packages/sindarian-i18n-cli/tsconfig*.json`

---

## Task 4: Create ESLint and Jest configs

**Files:**
- Create: `packages/sindarian-i18n-cli/eslint.config.mjs`
- Create: `packages/sindarian-i18n-cli/jest.config.ts`

**Step 1: Create `packages/sindarian-i18n-cli/eslint.config.mjs`**

```javascript
import baseConfig from '../utils/eslint.config.mjs'

export default [
  ...baseConfig,

  {
    ignores: ['dist/**', '**/dist/**']
  },

  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
]
```

**Step 2: Create `packages/sindarian-i18n-cli/jest.config.ts`**

```typescript
import type { Config } from 'jest'
import baseConfig from '../utils/jest.config'

const config: Config = {
  ...baseConfig,

  displayName: 'sindarian-i18n-cli',

  testEnvironment: 'node',

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.eslint.json'
      }
    ]
  },

  // No DOM/React testing setup needed for this CLI package
  setupFilesAfterEnv: undefined
}

export default config
```

**Step 3: Commit**

```bash
git add packages/sindarian-i18n-cli/eslint.config.mjs packages/sindarian-i18n-cli/jest.config.ts
git commit -m "chore(sindarian-i18n-cli): add ESLint and Jest configuration"
```

**If Task Fails:**
1. If ESLint import fails later, verify `packages/utils/eslint.config.mjs` exists.
2. Rollback: `git checkout -- packages/sindarian-i18n-cli/eslint.config.mjs packages/sindarian-i18n-cli/jest.config.ts`

---

## Task 5: Create types.ts

**Files:**
- Create: `packages/sindarian-i18n-cli/src/types.ts`

**Step 1: Create `packages/sindarian-i18n-cli/src/types.ts`**

This is the original `types.ts` plus a new `I18nConfig` interface for CLI config file support.

```typescript
export type IssueSeverity = 'error' | 'warning'

export interface ResolvedMessage {
  id: string
  defaultMessage: string
  file: string
  line: number
  col: number
}

export interface ExtractionError {
  message: string
  file: string
  line: number
  col: number
}

export interface ExtractionResult {
  /** Deduplicated messages keyed by id */
  messages: Map<string, ResolvedMessage>
  /** All messages grouped by file path (for cross-file validation) */
  rawMessages: Map<string, ResolvedMessage[]>
  /** Errors collected during extraction */
  errors: ExtractionError[]
}

export interface ValidationIssue {
  severity: IssueSeverity
  message: string
  file: string
  line: number
  col: number
}

export interface ValidationResult {
  issues: ValidationIssue[]
  errorCount: number
  warningCount: number
}

export interface KeyDiffResult {
  /** Keys present in source but not in locale file */
  added: string[]
  /** Keys present in locale file but not in source */
  removed: string[]
}

export interface ExtractorConfig {
  filePatterns: string[]
  additionalFunctionNames?: string[]
  concurrency?: number
}

/**
 * Configuration provided by the consuming project's config file.
 * This is what `sindarian-i18n.config.ts` (or similar) should export.
 */
export interface I18nConfig {
  /** Glob patterns to scan for i18n messages (e.g. ['./src/**\/!(*.d).{ts,tsx}']) */
  filePatterns: string[]
  /** Extra function names to extract besides defineMessages/FormattedMessage/formatMessage */
  additionalFunctionNames?: string[]
  /** Default locale code used as the source-of-truth (e.g. 'en') */
  defaultLocale: string
  /** All locale codes including defaultLocale (e.g. ['en', 'pt']) */
  locales: string[]
  /** Directory where locale JSON files are stored (e.g. './locales/extracted') */
  localeDir: string
  /** Max file-read concurrency during extraction (default: 10) */
  concurrency?: number
}
```

**Step 2: Verify file compiles**

Run:
```bash
cd packages/sindarian-i18n-cli && npx tsc --noEmit src/types.ts --skipLibCheck --moduleResolution node --esModuleInterop --strict && cd ../..
```

**Expected output:** No output (no errors).

**Step 3: Commit**

```bash
git add packages/sindarian-i18n-cli/src/types.ts
git commit -m "feat(sindarian-i18n-cli): add type definitions including I18nConfig"
```

**If Task Fails:**
1. TypeScript syntax error: check the glob pattern comment escape.
2. Rollback: `git checkout -- packages/sindarian-i18n-cli/src/types.ts`

---

## Task 6: Create extractor.ts

**Files:**
- Create: `packages/sindarian-i18n-cli/src/extractor.ts`

**Step 1: Create `packages/sindarian-i18n-cli/src/extractor.ts`**

This is identical to the original extractor.ts. The only difference is the import path for types is now local.

```typescript
import * as ts from 'typescript'
import { transformWithTs } from '@formatjs/ts-transformer'
import { readFile } from 'fs/promises'
import { glob } from 'glob'
import * as stringifyNs from 'json-stable-stringify'
import type {
  ExtractorConfig,
  ExtractionError,
  ExtractionResult,
  ResolvedMessage
} from './types'

const stringify: (obj: unknown, opts?: { space?: number }) => string =
  (stringifyNs as any).default || stringifyNs

/**
 * Converts a byte offset within source text to line:col.
 * Replicates @formatjs/cli-lib calculateLineColFromOffset.
 */
export function calculateLineColFromOffset(
  text: string,
  start?: number
): { line: number; col: number } {
  if (start == null) {
    return { line: 1, col: 1 }
  }
  const chunk = text.slice(0, start)
  const lines = chunk.split('\n')
  const lastLine = lines[lines.length - 1]
  return {
    line: lines.length,
    col: lastLine.length + 1
  }
}

/**
 * Extracts i18n messages from a single file's source text.
 * Never throws -- all errors are collected in the return value.
 */
export function extractFile(
  filePath: string,
  source: string,
  config: ExtractorConfig
): { messages: ResolvedMessage[]; errors: ExtractionError[] } {
  const messages: ResolvedMessage[] = []
  const errors: ExtractionError[] = []

  const transformerOpts = {
    throws: false,
    extractSourceLocation: true,
    additionalFunctionNames: config.additionalFunctionNames,
    onMsgExtracted(
      _fp: string,
      msgs: Array<{
        id: string
        defaultMessage?: string
        start?: number
      }>
    ) {
      for (const msg of msgs) {
        const { line, col } = calculateLineColFromOffset(source, msg.start)
        messages.push({
          id: msg.id ?? '',
          defaultMessage: msg.defaultMessage ?? '',
          file: filePath,
          line,
          col
        })
      }
    },
    onMsgError(_fp: string, error: Error) {
      errors.push({
        message: error.message,
        file: filePath,
        line: 1,
        col: 1
      })
    }
  }

  try {
    const output = ts.transpileModule(source, {
      compilerOptions: {
        allowJs: true,
        target: ts.ScriptTarget.ESNext,
        noEmit: true,
        experimentalDecorators: true
      },
      reportDiagnostics: true,
      fileName: filePath,
      transformers: {
        before: [transformWithTs(ts, transformerOpts)]
      }
    })

    if (output.diagnostics) {
      const errs = output.diagnostics.filter(
        (d) => d.category === ts.DiagnosticCategory.Error
      )
      for (const diag of errs) {
        let line = 1
        let col = 1
        if (diag.file && diag.start != null) {
          const pos = diag.file.getLineAndCharacterOfPosition(diag.start)
          line = pos.line + 1
          col = pos.character + 1
        }
        errors.push({
          message: ts.flattenDiagnosticMessageText(diag.messageText, '\n'),
          file: filePath,
          line,
          col
        })
      }
    }
  } catch (e) {
    errors.push({
      message: e instanceof Error ? e.message : String(e),
      file: filePath,
      line: 1,
      col: 1
    })
  }

  return { messages, errors }
}

/**
 * Extracts i18n messages from all files matching the configured patterns.
 * Processes files in batches for concurrency control.
 * Never throws -- all errors are collected in the result.
 */
export async function extractAll(
  config: ExtractorConfig
): Promise<ExtractionResult> {
  const result: ExtractionResult = {
    messages: new Map(),
    rawMessages: new Map(),
    errors: []
  }

  const fileSet = new Set<string>()
  for (const pattern of config.filePatterns) {
    const matched = await glob(pattern)
    for (const fp of matched) fileSet.add(fp)
  }
  const filePaths = [...fileSet]

  const concurrency = Math.max(1, config.concurrency ?? 10)
  for (let i = 0; i < filePaths.length; i += concurrency) {
    const batch = filePaths.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(async (fp) => {
        try {
          const source = await readFile(fp, 'utf-8')
          return { filePath: fp, ...extractFile(fp, source, config) }
        } catch (e) {
          return {
            filePath: fp,
            messages: [] as ResolvedMessage[],
            errors: [
              {
                message: e instanceof Error ? e.message : String(e),
                file: fp,
                line: 1,
                col: 1
              }
            ]
          }
        }
      })
    )

    for (const { filePath, messages, errors } of batchResults) {
      if (messages.length > 0) {
        result.rawMessages.set(filePath, messages)
      }

      // Last-wins dedup, matching original formatjs behavior
      for (const msg of messages) {
        result.messages.set(msg.id, msg)
      }

      result.errors.push(...errors)
    }
  }

  return result
}

/**
 * Formats extracted messages as simple JSON: { [id]: defaultMessage }.
 * Uses json-stable-stringify for consistent alphabetical key ordering.
 * Output is byte-for-byte identical to formatjs simple formatter.
 */
export function formatSimpleJson(
  messages: Map<string, ResolvedMessage>
): string {
  const simple: Record<string, string> = {}
  for (const [id, msg] of messages) {
    simple[id] = msg.defaultMessage
  }
  return stringify(simple, { space: 2 })
}
```

**Step 2: Commit**

```bash
git add packages/sindarian-i18n-cli/src/extractor.ts
git commit -m "feat(sindarian-i18n-cli): add message extractor module"
```

**If Task Fails:**
1. Import resolution: ensure `@formatjs/ts-transformer` will be installed in Task 13.
2. Rollback: `git checkout -- packages/sindarian-i18n-cli/src/extractor.ts`

---

## Task 7: Create validator.ts

**Files:**
- Create: `packages/sindarian-i18n-cli/src/validator.ts`

**Step 1: Create `packages/sindarian-i18n-cli/src/validator.ts`**

```typescript
import type {
  ExtractionResult,
  ValidationIssue,
  ValidationResult
} from './types'

/**
 * Validates extracted messages for common i18n issues.
 * Checks: missing ID, missing defaultMessage, duplicate IDs with different defaultMessage.
 */
export function validate(result: ExtractionResult): ValidationResult {
  const issues: ValidationIssue[] = []

  // Track all occurrences of each id across files for duplicate detection
  const idOccurrences = new Map<
    string,
    Array<{ defaultMessage: string; file: string; line: number; col: number }>
  >()

  for (const [, messages] of result.rawMessages) {
    for (const msg of messages) {
      // Check missing ID
      if (!msg.id) {
        issues.push({
          severity: 'error',
          message: 'Missing id for message',
          file: msg.file,
          line: msg.line,
          col: msg.col
        })
        continue
      }

      // Check missing defaultMessage
      if (!msg.defaultMessage) {
        issues.push({
          severity: 'error',
          message: `Missing defaultMessage for id "${msg.id}"`,
          file: msg.file,
          line: msg.line,
          col: msg.col
        })
      }

      // Collect for duplicate detection
      const occurrences = idOccurrences.get(msg.id) ?? []
      occurrences.push({
        defaultMessage: msg.defaultMessage,
        file: msg.file,
        line: msg.line,
        col: msg.col
      })
      idOccurrences.set(msg.id, occurrences)
    }
  }

  // Check for duplicate IDs with different defaultMessage
  for (const [id, occurrences] of idOccurrences) {
    if (occurrences.length < 2) continue

    const first = occurrences[0]
    for (let i = 1; i < occurrences.length; i++) {
      const other = occurrences[i]
      if (other.defaultMessage !== first.defaultMessage) {
        issues.push({
          severity: 'error',
          message:
            `Duplicate id "${id}" with different defaultMessage ` +
            `(${first.file}:${first.line}:${first.col} vs ${other.file}:${other.line}:${other.col})`,
          file: other.file,
          line: other.line,
          col: other.col
        })
      }
    }
  }

  return {
    issues,
    errorCount: issues.filter((i) => i.severity === 'error').length,
    warningCount: issues.filter((i) => i.severity === 'warning').length
  }
}
```

**Step 2: Commit**

```bash
git add packages/sindarian-i18n-cli/src/validator.ts
git commit -m "feat(sindarian-i18n-cli): add message validator module"
```

**If Task Fails:**
1. Rollback: `git checkout -- packages/sindarian-i18n-cli/src/validator.ts`

---

## Task 8: Create key-differ.ts

**Files:**
- Create: `packages/sindarian-i18n-cli/src/key-differ.ts`

**Step 1: Create `packages/sindarian-i18n-cli/src/key-differ.ts`**

```typescript
import { readFile } from 'fs/promises'
import type { KeyDiffResult, ResolvedMessage } from './types'

/**
 * Compares extracted message keys against a locale JSON file.
 * Returns keys present in source but not locale (added) and vice versa (removed).
 */
export async function diffKeys(
  extractedMessages: Map<string, ResolvedMessage>,
  localeFilePath: string
): Promise<KeyDiffResult> {
  let localeKeys: Set<string> = new Set()

  let content: string | undefined

  try {
    content = await readFile(localeFilePath, 'utf-8')
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      localeKeys = new Set()
    } else {
      throw err
    }
  }

  if (content !== undefined) {
    try {
      localeKeys = new Set(Object.keys(JSON.parse(content)))
    } catch (err: unknown) {
      throw new Error(
        `Failed to parse locale file "${localeFilePath}": ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  const sourceKeys = new Set(extractedMessages.keys())

  const added = [...sourceKeys].filter((k) => !localeKeys.has(k)).sort()
  const removed = [...localeKeys].filter((k) => !sourceKeys.has(k)).sort()

  return { added, removed }
}

/**
 * Formats a key diff result as a human-readable report.
 * Returns empty string if no differences.
 */
export function formatKeyDiffReport(diff: KeyDiffResult): string {
  if (diff.added.length === 0 && diff.removed.length === 0) {
    return ''
  }

  const lines: string[] = []

  if (diff.added.length > 0) {
    lines.push(`New keys not yet extracted (${diff.added.length}):`)
    for (const key of diff.added) {
      lines.push(`  + ${key}`)
    }
  }

  if (diff.removed.length > 0) {
    if (lines.length > 0) lines.push('')
    lines.push(`Stale keys no longer in source (${diff.removed.length}):`)
    for (const key of diff.removed) {
      lines.push(`  - ${key}`)
    }
  }

  return lines.join('\n')
}
```

**Step 2: Commit**

```bash
git add packages/sindarian-i18n-cli/src/key-differ.ts
git commit -m "feat(sindarian-i18n-cli): add key-differ module"
```

**If Task Fails:**
1. Rollback: `git checkout -- packages/sindarian-i18n-cli/src/key-differ.ts`

---

## Task 9: Create reporter.ts

**Files:**
- Create: `packages/sindarian-i18n-cli/src/reporter.ts`

**Step 1: Create `packages/sindarian-i18n-cli/src/reporter.ts`**

```typescript
import type {
  ExtractionError,
  ValidationIssue,
  ValidationResult
} from './types'

const ANSI = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m',
  boldRed: '\x1b[1;31m',
  reset: '\x1b[0m'
}

function c(text: string, color: keyof typeof ANSI, useColors: boolean): string {
  return useColors ? `${ANSI[color]}${text}${ANSI.reset}` : text
}

function formatLocation(line: number, col: number): string {
  return `${line}:${col}`
}

/**
 * Formats validation issues in ESLint-like grouped output.
 * Groups by file, sorts by line:col within each file.
 */
export function formatValidationReport(
  result: ValidationResult,
  options?: { colors?: boolean }
): string {
  if (result.issues.length === 0) return ''

  const useColors = options?.colors ?? process.stdout.isTTY === true

  // Group by file
  const grouped = new Map<string, ValidationIssue[]>()
  for (const issue of result.issues) {
    const list = grouped.get(issue.file) ?? []
    list.push(issue)
    grouped.set(issue.file, list)
  }

  const lines: string[] = []

  for (const [file, issues] of grouped) {
    // Sort by line, then col
    issues.sort((a, b) => a.line - b.line || a.col - b.col)

    lines.push(c(file, 'dim', useColors))
    for (const issue of issues) {
      const loc = formatLocation(issue.line, issue.col).padEnd(8)
      const severity =
        issue.severity === 'error'
          ? c('error', 'red', useColors)
          : c('warning', 'yellow', useColors)
      lines.push(`  ${loc} ${severity}  ${issue.message}`)
    }
    lines.push('')
  }

  // Summary
  const parts: string[] = []
  if (result.errorCount > 0) {
    parts.push(`${result.errorCount} error${result.errorCount > 1 ? 's' : ''}`)
  }
  if (result.warningCount > 0) {
    parts.push(
      `${result.warningCount} warning${result.warningCount > 1 ? 's' : ''}`
    )
  }
  lines.push(c(`\u2716 ${parts.join(' and ')} found`, 'boldRed', useColors))

  return lines.join('\n')
}

/**
 * Formats extraction errors in ESLint-like grouped output.
 */
export function formatExtractionErrors(
  errors: ExtractionError[],
  options?: { colors?: boolean }
): string {
  if (errors.length === 0) return ''

  const useColors = options?.colors ?? process.stdout.isTTY === true

  // Group by file
  const grouped = new Map<string, ExtractionError[]>()
  for (const err of errors) {
    const list = grouped.get(err.file) ?? []
    list.push(err)
    grouped.set(err.file, list)
  }

  const lines: string[] = []

  for (const [file, errs] of grouped) {
    errs.sort((a, b) => a.line - b.line || a.col - b.col)

    lines.push(c(file, 'dim', useColors))
    for (const err of errs) {
      const loc = formatLocation(err.line, err.col).padEnd(8)
      lines.push(`  ${loc} ${c('error', 'red', useColors)}  ${err.message}`)
    }
    lines.push('')
  }

  lines.push(
    c(
      `\u2716 ${errors.length} extraction error${errors.length > 1 ? 's' : ''} found`,
      'boldRed',
      useColors
    )
  )

  return lines.join('\n')
}
```

**Step 2: Commit**

```bash
git add packages/sindarian-i18n-cli/src/reporter.ts
git commit -m "feat(sindarian-i18n-cli): add reporter module for ESLint-style output"
```

**If Task Fails:**
1. Rollback: `git checkout -- packages/sindarian-i18n-cli/src/reporter.ts`

---

## Task 10: Create config loader

**Files:**
- Create: `packages/sindarian-i18n-cli/src/config.ts`

**Step 1: Create `packages/sindarian-i18n-cli/src/config.ts`**

This module loads a project's i18n config file. It supports `.ts`, `.js`, `.cjs`, and `.mjs` files. For TypeScript, it uses `ts-node/register` to transpile on the fly.

```typescript
import path from 'path'
import type { I18nConfig } from './types'

const CONFIG_FILE_NAMES = [
  'sindarian-i18n.config.ts',
  'sindarian-i18n.config.js',
  'sindarian-i18n.config.cjs',
  'sindarian-i18n.config.mjs',
  'intl.config.ts',
  'intl.config.js'
]

/**
 * Validates that a loaded object conforms to the I18nConfig shape.
 * Throws a descriptive error if required fields are missing.
 */
function assertI18nConfig(obj: unknown, filePath: string): asserts obj is I18nConfig {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error(`Config file "${filePath}" must export an object.`)
  }

  const config = obj as Record<string, unknown>

  if (!Array.isArray(config.filePatterns) || config.filePatterns.length === 0) {
    throw new Error(
      `Config file "${filePath}" must export "filePatterns" as a non-empty string array.`
    )
  }

  if (typeof config.defaultLocale !== 'string' || config.defaultLocale.length === 0) {
    throw new Error(
      `Config file "${filePath}" must export "defaultLocale" as a non-empty string.`
    )
  }

  if (!Array.isArray(config.locales) || config.locales.length === 0) {
    throw new Error(
      `Config file "${filePath}" must export "locales" as a non-empty string array.`
    )
  }

  if (typeof config.localeDir !== 'string' || config.localeDir.length === 0) {
    throw new Error(
      `Config file "${filePath}" must export "localeDir" as a non-empty string.`
    )
  }
}

/**
 * Registers ts-node so that TypeScript config files can be required directly.
 * Only registers once; no-ops on subsequent calls.
 */
let tsNodeRegistered = false
function ensureTsNode(): void {
  if (tsNodeRegistered) return
  try {
    require('ts-node/register/transpile-only')
    tsNodeRegistered = true
  } catch {
    throw new Error(
      'ts-node is required to load TypeScript config files. Install it as a dev dependency.'
    )
  }
}

/**
 * Loads the i18n config from a specific file path.
 */
export function loadConfigFromFile(filePath: string): I18nConfig {
  const resolved = path.resolve(filePath)

  if (resolved.endsWith('.ts')) {
    ensureTsNode()
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(resolved)
  const exported = mod.default ?? mod.intlConfig ?? mod

  assertI18nConfig(exported, filePath)
  return exported
}

/**
 * Auto-detects a config file in the given directory by searching for known names.
 * Returns null if no config file is found.
 */
export function findConfigFile(cwd: string): string | null {
  const fs = require('fs') as typeof import('fs')
  for (const name of CONFIG_FILE_NAMES) {
    const candidate = path.join(cwd, name)
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

/**
 * Loads config from --config flag or auto-detects.
 * Throws if no config is found.
 */
export function loadConfig(configPath?: string): I18nConfig {
  if (configPath) {
    return loadConfigFromFile(configPath)
  }

  const found = findConfigFile(process.cwd())
  if (!found) {
    throw new Error(
      `No config file found. Create one of: ${CONFIG_FILE_NAMES.join(', ')}\n` +
        'Or pass --config <path> explicitly.'
    )
  }

  return loadConfigFromFile(found)
}
```

**Step 2: Commit**

```bash
git add packages/sindarian-i18n-cli/src/config.ts
git commit -m "feat(sindarian-i18n-cli): add config file loader with auto-detection"
```

**If Task Fails:**
1. Rollback: `git checkout -- packages/sindarian-i18n-cli/src/config.ts`

---

## Task 11: Create the library barrel export (index.ts)

**Files:**
- Create: `packages/sindarian-i18n-cli/src/index.ts`

**Step 1: Create `packages/sindarian-i18n-cli/src/index.ts`**

```typescript
// Types
export type {
  ResolvedMessage,
  ExtractionError,
  ExtractionResult,
  ValidationIssue,
  ValidationResult,
  KeyDiffResult,
  ExtractorConfig,
  IssueSeverity,
  I18nConfig
} from './types'

// Core extraction
export { extractAll, extractFile, calculateLineColFromOffset, formatSimpleJson } from './extractor'

// Validation
export { validate } from './validator'

// Key diff
export { diffKeys, formatKeyDiffReport } from './key-differ'

// Reporter
export { formatValidationReport, formatExtractionErrors } from './reporter'

// Config
export { loadConfig, loadConfigFromFile, findConfigFile } from './config'
```

**Step 2: Commit**

```bash
git add packages/sindarian-i18n-cli/src/index.ts
git commit -m "feat(sindarian-i18n-cli): add barrel export index.ts"
```

**If Task Fails:**
1. Rollback: `git checkout -- packages/sindarian-i18n-cli/src/index.ts`

---

## Task 12: Create the CLI entry point (cli.ts)

**Files:**
- Create: `packages/sindarian-i18n-cli/src/cli.ts`

**Step 1: Create `packages/sindarian-i18n-cli/src/cli.ts`**

```typescript
#!/usr/bin/env node

import { Command } from 'commander'
import path from 'path'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { loadConfig } from './config'
import { extractAll, formatSimpleJson } from './extractor'
import { validate } from './validator'
import { diffKeys, formatKeyDiffReport } from './key-differ'
import {
  formatValidationReport,
  formatExtractionErrors
} from './reporter'
import type { I18nConfig } from './types'

// Read version from package.json at runtime
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../package.json') as { version: string }

const program = new Command()

program
  .name('sindarian-i18n')
  .description('i18n message extraction, validation, and key diffing CLI')
  .version(pkg.version)
  .option('-c, --config <path>', 'Path to config file')

/**
 * Merges extracted keys with an existing locale file.
 * Preserves existing translations, adds new keys as empty strings,
 * and removes stale keys no longer present in source.
 */
async function mergeLocale(
  locale: string,
  extractedKeys: string[],
  localeDir: string
): Promise<void> {
  const localePath = path.join(localeDir, `${locale}.json`)

  let existing: Record<string, string> = {}
  try {
    const content = await readFile(localePath, 'utf-8')
    existing = JSON.parse(content)
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist yet -- start fresh
    } else {
      console.error(
        `Failed to read/parse locale file "${localePath}": ${(e as Error).message}`
      )
      process.exit(1)
    }
  }

  const merged: Record<string, string> = {}
  for (const key of extractedKeys) {
    merged[key] = existing[key] ?? ''
  }

  try {
    await writeFile(localePath, JSON.stringify(merged, null, 2), 'utf-8')
  } catch (e) {
    console.error(
      `Failed to write locale file "${localePath}": ${(e as Error).message}`
    )
    process.exit(1)
  }
}

// ── extract command ─────────────────────────────────────────────────

program
  .command('extract')
  .description('Extract i18n messages and write locale files')
  .action(async () => {
    const config = loadConfig(program.opts().config) as I18nConfig

    await mkdir(config.localeDir, { recursive: true })

    const result = await extractAll({
      filePatterns: config.filePatterns,
      additionalFunctionNames: config.additionalFunctionNames,
      concurrency: config.concurrency
    })

    let hasErrors = false

    if (result.errors.length > 0) {
      console.error(formatExtractionErrors(result.errors))
      hasErrors = true
    }

    const validation = validate(result)
    if (validation.errorCount > 0) {
      console.error(formatValidationReport(validation))
      hasErrors = true
    }

    if (hasErrors) {
      console.warn(
        '\nExtraction completed with errors above. Messages from valid files were still extracted.\n'
      )
    }

    // Write default locale (source-of-truth)
    const extracted = formatSimpleJson(result.messages)
    await writeFile(
      path.join(config.localeDir, `${config.defaultLocale}.json`),
      extracted,
      'utf-8'
    )

    // Merge non-default locales (preserves existing translations)
    const extractedKeys = [...result.messages.keys()]
    await Promise.all(
      config.locales
        .filter((locale) => locale !== config.defaultLocale)
        .map((locale) => mergeLocale(locale, extractedKeys, config.localeDir))
    )

    const localeCount = config.locales.length
    console.log(
      `Extracted ${result.messages.size} messages into ${localeCount} locale file${localeCount > 1 ? 's' : ''}.`
    )
  })

// ── check command ───────────────────────────────────────────────────

program
  .command('check')
  .description('Validate extracted i18n messages (exits 1 on errors)')
  .action(async () => {
    const config = loadConfig(program.opts().config) as I18nConfig

    const result = await extractAll({
      filePatterns: config.filePatterns,
      additionalFunctionNames: config.additionalFunctionNames,
      concurrency: config.concurrency
    })

    let hasErrors = false

    if (result.errors.length > 0) {
      console.error(formatExtractionErrors(result.errors))
      hasErrors = true
    }

    const validation = validate(result)
    if (validation.errorCount > 0) {
      console.error(formatValidationReport(validation))
      hasErrors = true
    }

    if (hasErrors) {
      process.exit(1)
    }

    console.log('All i18n messages are valid.')
  })

// ── check-keys command ──────────────────────────────────────────────

program
  .command('check-keys')
  .description('Diff extracted keys against locale file (exits 1 if out of sync)')
  .action(async () => {
    const config = loadConfig(program.opts().config) as I18nConfig

    const result = await extractAll({
      filePatterns: config.filePatterns,
      additionalFunctionNames: config.additionalFunctionNames,
      concurrency: config.concurrency
    })

    const localePath = path.join(
      config.localeDir,
      `${config.defaultLocale}.json`
    )
    const diff = await diffKeys(result.messages, localePath)

    if (diff.added.length > 0 || diff.removed.length > 0) {
      console.error(formatKeyDiffReport(diff))
      if (diff.added.length > 0) {
        console.error(
          '\nRun "sindarian-i18n extract" to update locale files.'
        )
      }
      process.exit(1)
    }

    console.log('All i18n keys are up to date.')
  })

program.parseAsync(process.argv).catch((err) => {
  console.error(err)
  process.exit(1)
})
```

**Step 2: Commit**

```bash
git add packages/sindarian-i18n-cli/src/cli.ts
git commit -m "feat(sindarian-i18n-cli): add Commander CLI with extract, check, and check-keys commands"
```

**If Task Fails:**
1. Rollback: `git checkout -- packages/sindarian-i18n-cli/src/cli.ts`

---

## Task 13: Install dependencies

**Step 1: Run npm install from the monorepo root**

Run:
```bash
npm install
```

**Expected output:** Should complete without errors. The workspace will be linked.

**Step 2: Verify the package is recognized by the workspace**

Run:
```bash
npm ls @lerianstudio/sindarian-i18n-cli
```

**Expected output:** Should show the package listed.

**Step 3: Commit the lockfile change**

```bash
git add package-lock.json
git commit -m "chore(sindarian-i18n-cli): install dependencies"
```

**If Task Fails:**
1. **Peer dependency conflict:** Check if `typescript` version in the new package conflicts with root. May need to move `typescript` to `peerDependencies`.
2. **Package not found:** Verify `packages/sindarian-i18n-cli/package.json` exists and `workspaces` in root `package.json` is `["packages/*"]`.
3. Rollback: `git checkout -- package-lock.json`

---

## Task 14: Build and verify compilation

**Step 1: Build the package**

Run:
```bash
npx turbo build --filter=@lerianstudio/sindarian-i18n-cli
```

**Expected output:** Build completes successfully, `packages/sindarian-i18n-cli/dist/` directory is created.

**Step 2: Verify dist output**

Run:
```bash
ls packages/sindarian-i18n-cli/dist/
```

**Expected output:** Should contain at minimum: `index.js`, `index.d.ts`, `cli.js`, `types.js`, `types.d.ts`, `extractor.js`, `validator.js`, `key-differ.js`, `reporter.js`, `config.js`.

**Step 3: Verify the CLI shebang is present**

Run:
```bash
head -1 packages/sindarian-i18n-cli/dist/cli.js
```

**Expected output:**
```
#!/usr/bin/env node
```

**Step 4: Verify CLI runs**

Run:
```bash
node packages/sindarian-i18n-cli/dist/cli.js --version
```

**Expected output:** `1.0.0-beta.1`

**Step 5: Commit** (no new files to commit -- dist is in .gitignore)

No commit needed for this task.

**If Task Fails:**
1. **tsc errors:** Run `cd packages/sindarian-i18n-cli && npx tsc --noEmit` to see specific errors.
2. **tsc-alias errors:** May need to install `tsc-alias` as a dev dependency if not already in root.
3. **Missing shebang:** Ensure `cli.ts` starts with `#!/usr/bin/env node`.

---

## Task 15: Create unit tests -- extractor.test.ts

**Files:**
- Create: `packages/sindarian-i18n-cli/src/__tests__/extractor.test.ts`

**Step 1: Create `packages/sindarian-i18n-cli/src/__tests__/extractor.test.ts`**

```typescript
/**
 * @jest-environment node
 */
import {
  calculateLineColFromOffset,
  extractFile,
  formatSimpleJson
} from '../extractor'
import type { ExtractorConfig, ResolvedMessage } from '../types'

const defaultConfig: ExtractorConfig = {
  filePatterns: [],
  additionalFunctionNames: []
}

describe('calculateLineColFromOffset', () => {
  it('returns line 1 col 1 when start is undefined', () => {
    expect(calculateLineColFromOffset('hello\nworld')).toEqual({
      line: 1,
      col: 1
    })
  })

  it('returns line 1 col 1 when start is 0', () => {
    expect(calculateLineColFromOffset('hello\nworld', 0)).toEqual({
      line: 1,
      col: 1
    })
  })

  it('converts byte offset on first line', () => {
    expect(calculateLineColFromOffset('hello world', 6)).toEqual({
      line: 1,
      col: 7
    })
  })

  it('converts byte offset on second line', () => {
    const source = 'line one\nline two'
    // offset 12 = 'line one\nlin' => line 2, col 4 (1-based)
    expect(calculateLineColFromOffset(source, 12)).toEqual({
      line: 2,
      col: 4
    })
  })

  it('handles multi-line source correctly', () => {
    const source = 'aaa\nbbb\nccc\nddd'
    // offset 8 = 'aaa\nbbb\n' => start of line 3 => line 3, col 1 (1-based)
    expect(calculateLineColFromOffset(source, 8)).toEqual({
      line: 3,
      col: 1
    })
  })
})

describe('extractFile', () => {
  it('extracts defineMessages calls', () => {
    const source = `
import { defineMessages } from 'react-intl'
const messages = defineMessages({
  greeting: {
    id: 'app.greeting',
    defaultMessage: 'Hello, World!'
  }
})
`
    const { messages, errors } = extractFile('test.ts', source, defaultConfig)
    expect(errors).toHaveLength(0)
    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatchObject({
      id: 'app.greeting',
      defaultMessage: 'Hello, World!',
      file: 'test.ts'
    })
    expect(messages[0].line).toBeGreaterThan(0)
  })

  it('extracts <FormattedMessage> JSX', () => {
    const source = `
import React from 'react'
import { FormattedMessage } from 'react-intl'
const Comp = () => <FormattedMessage id="app.welcome" defaultMessage="Welcome!" />
`
    const { messages, errors } = extractFile('test.tsx', source, defaultConfig)
    expect(errors).toHaveLength(0)
    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatchObject({
      id: 'app.welcome',
      defaultMessage: 'Welcome!'
    })
  })

  it('extracts intl.formatMessage() calls', () => {
    const source = `
intl.formatMessage({ id: 'app.goodbye', defaultMessage: 'Goodbye!' })
`
    const { messages, errors } = extractFile('test.ts', source, defaultConfig)
    expect(errors).toHaveLength(0)
    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatchObject({
      id: 'app.goodbye',
      defaultMessage: 'Goodbye!'
    })
  })

  it('extracts $t() when configured in additionalFunctionNames', () => {
    const source = `$t({ id: 'app.custom', defaultMessage: 'Custom function' })`
    const config: ExtractorConfig = {
      ...defaultConfig,
      additionalFunctionNames: ['$t']
    }
    const { messages, errors } = extractFile('test.ts', source, config)
    expect(errors).toHaveLength(0)
    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatchObject({
      id: 'app.custom',
      defaultMessage: 'Custom function'
    })
  })

  it('collects errors for dynamic ids without throwing', () => {
    const source = `
const id = 'dynamic'
intl.formatMessage({ id: id, defaultMessage: 'test' })
`
    const { errors } = extractFile('test.ts', source, defaultConfig)
    // The transformer may or may not report this as an error depending on
    // the version, but it should never throw
    expect(() => extractFile('test.ts', source, defaultConfig)).not.toThrow()
  })

  it('returns empty arrays for file with no messages', () => {
    const source = `const x = 1 + 2`
    const { messages, errors } = extractFile('test.ts', source, defaultConfig)
    expect(messages).toHaveLength(0)
    expect(errors).toHaveLength(0)
  })
})

describe('formatSimpleJson', () => {
  it('produces alphabetically sorted keys with 2-space indent', () => {
    const messages = new Map<string, ResolvedMessage>([
      [
        'zebra.message',
        {
          id: 'zebra.message',
          defaultMessage: 'Zebra',
          file: 'a.ts',
          line: 1,
          col: 1
        }
      ],
      [
        'alpha.message',
        {
          id: 'alpha.message',
          defaultMessage: 'Alpha',
          file: 'b.ts',
          line: 1,
          col: 1
        }
      ]
    ])

    const result = formatSimpleJson(messages)
    const parsed = JSON.parse(result)

    // Keys should be alphabetically sorted
    const keys = Object.keys(parsed)
    expect(keys).toEqual(['alpha.message', 'zebra.message'])

    // Values should be defaultMessage
    expect(parsed['alpha.message']).toBe('Alpha')
    expect(parsed['zebra.message']).toBe('Zebra')

    // Should have 2-space indent
    expect(result).toContain('  "alpha.message"')
  })

  it('returns empty object for empty map', () => {
    const result = formatSimpleJson(new Map())
    expect(JSON.parse(result)).toEqual({})
  })
})
```

**Step 2: Commit**

```bash
git add packages/sindarian-i18n-cli/src/__tests__/extractor.test.ts
git commit -m "test(sindarian-i18n-cli): add extractor unit tests"
```

**If Task Fails:**
1. Rollback: `git checkout -- packages/sindarian-i18n-cli/src/__tests__/extractor.test.ts`

---

## Task 16: Create unit tests -- validator.test.ts

**Files:**
- Create: `packages/sindarian-i18n-cli/src/__tests__/validator.test.ts`

**Step 1: Create `packages/sindarian-i18n-cli/src/__tests__/validator.test.ts`**

```typescript
/**
 * @jest-environment node
 */
import { validate } from '../validator'
import type { ExtractionResult, ResolvedMessage } from '../types'

function makeMessage(
  overrides: Partial<ResolvedMessage> & { id: string }
): ResolvedMessage {
  return {
    defaultMessage: 'Default',
    file: 'test.ts',
    line: 1,
    col: 1,
    ...overrides
  }
}

function makeResult(
  rawEntries: Array<[string, ResolvedMessage[]]>
): ExtractionResult {
  const messages = new Map<string, ResolvedMessage>()
  const rawMessages = new Map<string, ResolvedMessage[]>(rawEntries)
  for (const [, msgs] of rawEntries) {
    for (const msg of msgs) {
      if (!messages.has(msg.id)) {
        messages.set(msg.id, msg)
      }
    }
  }
  return { messages, rawMessages, errors: [] }
}

describe('validate', () => {
  it('detects missing ID (empty id)', () => {
    const result = makeResult([
      ['a.ts', [makeMessage({ id: '', file: 'a.ts', line: 5, col: 3 })]]
    ])

    const validation = validate(result)
    expect(validation.errorCount).toBe(1)
    expect(validation.issues[0]).toMatchObject({
      severity: 'error',
      file: 'a.ts',
      line: 5,
      col: 3
    })
    expect(validation.issues[0].message).toMatch(/missing id/i)
  })

  it('detects missing defaultMessage', () => {
    const result = makeResult([
      [
        'b.ts',
        [
          makeMessage({
            id: 'foo.bar',
            defaultMessage: '',
            file: 'b.ts',
            line: 10,
            col: 7
          })
        ]
      ]
    ])

    const validation = validate(result)
    expect(validation.errorCount).toBe(1)
    expect(validation.issues[0].message).toMatch(/missing defaultMessage/i)
  })

  it('duplicate ID with same defaultMessage produces no error', () => {
    const result = makeResult([
      [
        'a.ts',
        [makeMessage({ id: 'shared.ok', defaultMessage: 'OK', file: 'a.ts' })]
      ],
      [
        'b.ts',
        [makeMessage({ id: 'shared.ok', defaultMessage: 'OK', file: 'b.ts' })]
      ]
    ])

    const validation = validate(result)
    expect(validation.errorCount).toBe(0)
  })

  it('duplicate ID with different defaultMessage produces error referencing both locations', () => {
    const result = makeResult([
      [
        'a.ts',
        [
          makeMessage({
            id: 'dup.key',
            defaultMessage: 'Version A',
            file: 'a.ts',
            line: 3,
            col: 1
          })
        ]
      ],
      [
        'b.ts',
        [
          makeMessage({
            id: 'dup.key',
            defaultMessage: 'Version B',
            file: 'b.ts',
            line: 7,
            col: 2
          })
        ]
      ]
    ])

    const validation = validate(result)
    expect(validation.errorCount).toBe(1)
    expect(validation.issues[0].message).toContain('dup.key')
    expect(validation.issues[0].message).toMatch(/a\.ts/)
    expect(validation.issues[0].message).toMatch(/b\.ts/)
  })

  it('clean extraction returns errorCount 0', () => {
    const result = makeResult([
      [
        'clean.ts',
        [
          makeMessage({ id: 'clean.one', defaultMessage: 'One' }),
          makeMessage({ id: 'clean.two', defaultMessage: 'Two' })
        ]
      ]
    ])

    const validation = validate(result)
    expect(validation.errorCount).toBe(0)
    expect(validation.warningCount).toBe(0)
    expect(validation.issues).toHaveLength(0)
  })

  it('reports multiple issue types in single result', () => {
    const result = makeResult([
      [
        'multi.ts',
        [
          makeMessage({
            id: '',
            file: 'multi.ts',
            line: 1,
            col: 1
          }),
          makeMessage({
            id: 'has.id',
            defaultMessage: '',
            file: 'multi.ts',
            line: 5,
            col: 1
          })
        ]
      ]
    ])

    const validation = validate(result)
    expect(validation.errorCount).toBe(2)
    expect(validation.issues).toHaveLength(2)
  })
})
```

**Step 2: Commit**

```bash
git add packages/sindarian-i18n-cli/src/__tests__/validator.test.ts
git commit -m "test(sindarian-i18n-cli): add validator unit tests"
```

**If Task Fails:**
1. Rollback: `git checkout -- packages/sindarian-i18n-cli/src/__tests__/validator.test.ts`

---

## Task 17: Create unit tests -- key-differ.test.ts

**Files:**
- Create: `packages/sindarian-i18n-cli/src/__tests__/key-differ.test.ts`

**Step 1: Create `packages/sindarian-i18n-cli/src/__tests__/key-differ.test.ts`**

```typescript
/**
 * @jest-environment node
 */
import { diffKeys, formatKeyDiffReport } from '../key-differ'
import { writeFile, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import type { ResolvedMessage } from '../types'

function makeMessages(ids: string[]): Map<string, ResolvedMessage> {
  const map = new Map<string, ResolvedMessage>()
  for (const id of ids) {
    map.set(id, {
      id,
      defaultMessage: `msg for ${id}`,
      file: 'test.ts',
      line: 1,
      col: 1
    })
  }
  return map
}

describe('diffKeys', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = join(tmpdir(), `i18n-diff-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  afterAll(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it('detects added keys (in source, not in locale file)', async () => {
    const localePath = join(tempDir, 'added.json')
    await writeFile(localePath, JSON.stringify({ 'existing.key': 'value' }))

    const messages = makeMessages(['existing.key', 'new.key'])
    const result = await diffKeys(messages, localePath)

    expect(result.added).toEqual(['new.key'])
    expect(result.removed).toHaveLength(0)
  })

  it('detects removed keys (in locale file, not in source)', async () => {
    const localePath = join(tempDir, 'removed.json')
    await writeFile(
      localePath,
      JSON.stringify({ 'kept.key': 'v', 'stale.key': 'v' })
    )

    const messages = makeMessages(['kept.key'])
    const result = await diffKeys(messages, localePath)

    expect(result.added).toHaveLength(0)
    expect(result.removed).toEqual(['stale.key'])
  })

  it('no differences returns empty added/removed', async () => {
    const localePath = join(tempDir, 'nodiff.json')
    await writeFile(localePath, JSON.stringify({ 'a.key': 'v', 'b.key': 'v' }))

    const messages = makeMessages(['a.key', 'b.key'])
    const result = await diffKeys(messages, localePath)

    expect(result.added).toHaveLength(0)
    expect(result.removed).toHaveLength(0)
  })

  it('handles missing locale file gracefully', async () => {
    const localePath = join(tempDir, 'nonexistent.json')
    const messages = makeMessages(['a.key'])
    const result = await diffKeys(messages, localePath)

    expect(result.added).toEqual(['a.key'])
    expect(result.removed).toHaveLength(0)
  })

  it('throws descriptive error on malformed JSON', async () => {
    const localePath = join(tempDir, 'malformed.json')
    await writeFile(localePath, '{not valid json')

    const messages = makeMessages(['a.key'])
    await expect(diffKeys(messages, localePath)).rejects.toThrow(
      /Failed to parse locale file.*malformed\.json/
    )
  })
})

describe('formatKeyDiffReport', () => {
  it('formats added and removed keys', () => {
    const report = formatKeyDiffReport({
      added: ['new.one', 'new.two'],
      removed: ['old.one']
    })

    expect(report).toContain('new.one')
    expect(report).toContain('new.two')
    expect(report).toContain('old.one')
  })

  it('returns empty string for no differences', () => {
    const report = formatKeyDiffReport({ added: [], removed: [] })
    expect(report).toBe('')
  })
})
```

**Step 2: Commit**

```bash
git add packages/sindarian-i18n-cli/src/__tests__/key-differ.test.ts
git commit -m "test(sindarian-i18n-cli): add key-differ unit tests"
```

**If Task Fails:**
1. Rollback: `git checkout -- packages/sindarian-i18n-cli/src/__tests__/key-differ.test.ts`

---

## Task 18: Create unit tests -- reporter.test.ts

**Files:**
- Create: `packages/sindarian-i18n-cli/src/__tests__/reporter.test.ts`

**Step 1: Create `packages/sindarian-i18n-cli/src/__tests__/reporter.test.ts`**

```typescript
/**
 * @jest-environment node
 */
import { formatValidationReport, formatExtractionErrors } from '../reporter'
import type { ValidationResult, ExtractionError } from '../types'

describe('formatValidationReport', () => {
  it('groups issues by file path', () => {
    const result: ValidationResult = {
      issues: [
        {
          severity: 'error',
          message: 'Err in A',
          file: 'src/a.ts',
          line: 1,
          col: 1
        },
        {
          severity: 'error',
          message: 'Err in B',
          file: 'src/b.ts',
          line: 1,
          col: 1
        },
        {
          severity: 'error',
          message: 'Err2 in A',
          file: 'src/a.ts',
          line: 5,
          col: 3
        }
      ],
      errorCount: 3,
      warningCount: 0
    }

    const report = formatValidationReport(result, { colors: false })

    // Both file paths appear as group headers
    expect(report).toContain('src/a.ts')
    expect(report).toContain('src/b.ts')

    // Issues from same file grouped together
    const aIndex = report.indexOf('src/a.ts')
    const bIndex = report.indexOf('src/b.ts')
    const err2Index = report.indexOf('Err2 in A')
    // Err2 in A should appear after the src/a.ts header, before src/b.ts
    expect(err2Index).toBeGreaterThan(aIndex)
    expect(err2Index).toBeLessThan(bIndex)
  })

  it('sorts issues by line:col within each file', () => {
    const result: ValidationResult = {
      issues: [
        { severity: 'error', message: 'Late', file: 'f.ts', line: 20, col: 5 },
        { severity: 'error', message: 'Early', file: 'f.ts', line: 3, col: 1 },
        { severity: 'error', message: 'Mid', file: 'f.ts', line: 10, col: 2 }
      ],
      errorCount: 3,
      warningCount: 0
    }

    const report = formatValidationReport(result, { colors: false })
    const earlyIdx = report.indexOf('Early')
    const midIdx = report.indexOf('Mid')
    const lateIdx = report.indexOf('Late')

    expect(earlyIdx).toBeLessThan(midIdx)
    expect(midIdx).toBeLessThan(lateIdx)
  })

  it('summary line shows correct error count', () => {
    const result: ValidationResult = {
      issues: [
        { severity: 'error', message: 'E1', file: 'a.ts', line: 1, col: 1 },
        { severity: 'warning', message: 'W1', file: 'a.ts', line: 2, col: 1 }
      ],
      errorCount: 1,
      warningCount: 1
    }

    const report = formatValidationReport(result, { colors: false })
    expect(report).toContain('1 error')
    expect(report).toContain('1 warning')
  })

  it('empty result returns empty string', () => {
    const result: ValidationResult = {
      issues: [],
      errorCount: 0,
      warningCount: 0
    }

    const report = formatValidationReport(result, { colors: false })
    expect(report).toBe('')
  })
})

describe('formatExtractionErrors', () => {
  it('formats errors with file and location', () => {
    const errors: ExtractionError[] = [
      { message: 'Parse failed', file: 'src/broken.ts', line: 5, col: 10 }
    ]

    const report = formatExtractionErrors(errors, { colors: false })
    expect(report).toContain('src/broken.ts')
    expect(report).toContain('5:10')
    expect(report).toContain('Parse failed')
  })

  it('returns empty string for no errors', () => {
    expect(formatExtractionErrors([], { colors: false })).toBe('')
  })
})
```

**Step 2: Commit**

```bash
git add packages/sindarian-i18n-cli/src/__tests__/reporter.test.ts
git commit -m "test(sindarian-i18n-cli): add reporter unit tests"
```

**If Task Fails:**
1. Rollback: `git checkout -- packages/sindarian-i18n-cli/src/__tests__/reporter.test.ts`

---

## Task 19: Create unit tests -- config.test.ts

**Files:**
- Create: `packages/sindarian-i18n-cli/src/__tests__/config.test.ts`

**Step 1: Create `packages/sindarian-i18n-cli/src/__tests__/config.test.ts`**

```typescript
/**
 * @jest-environment node
 */
import { loadConfigFromFile, findConfigFile } from '../config'
import { writeFile, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

describe('loadConfigFromFile', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = join(tmpdir(), `i18n-config-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  afterAll(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it('loads a valid JS config file', async () => {
    const configPath = join(tempDir, 'valid.config.js')
    await writeFile(
      configPath,
      `module.exports = {
        filePatterns: ['./src/**/*.ts'],
        defaultLocale: 'en',
        locales: ['en', 'pt'],
        localeDir: './locales'
      };`
    )

    const config = loadConfigFromFile(configPath)
    expect(config.filePatterns).toEqual(['./src/**/*.ts'])
    expect(config.defaultLocale).toBe('en')
    expect(config.locales).toEqual(['en', 'pt'])
    expect(config.localeDir).toBe('./locales')
  })

  it('loads config exported as "intlConfig" named export', async () => {
    const configPath = join(tempDir, 'named.config.js')
    await writeFile(
      configPath,
      `module.exports.intlConfig = {
        filePatterns: ['./src/**/*.tsx'],
        defaultLocale: 'en',
        locales: ['en'],
        localeDir: './i18n'
      };`
    )

    const config = loadConfigFromFile(configPath)
    expect(config.filePatterns).toEqual(['./src/**/*.tsx'])
  })

  it('throws on missing filePatterns', async () => {
    const configPath = join(tempDir, 'missing-patterns.config.js')
    await writeFile(
      configPath,
      `module.exports = {
        defaultLocale: 'en',
        locales: ['en'],
        localeDir: './locales'
      };`
    )

    expect(() => loadConfigFromFile(configPath)).toThrow(/filePatterns/)
  })

  it('throws on missing defaultLocale', async () => {
    const configPath = join(tempDir, 'missing-locale.config.js')
    await writeFile(
      configPath,
      `module.exports = {
        filePatterns: ['./src/**/*.ts'],
        locales: ['en'],
        localeDir: './locales'
      };`
    )

    expect(() => loadConfigFromFile(configPath)).toThrow(/defaultLocale/)
  })

  it('throws on missing locales', async () => {
    const configPath = join(tempDir, 'missing-locales.config.js')
    await writeFile(
      configPath,
      `module.exports = {
        filePatterns: ['./src/**/*.ts'],
        defaultLocale: 'en',
        localeDir: './locales'
      };`
    )

    expect(() => loadConfigFromFile(configPath)).toThrow(/locales/)
  })

  it('throws on missing localeDir', async () => {
    const configPath = join(tempDir, 'missing-dir.config.js')
    await writeFile(
      configPath,
      `module.exports = {
        filePatterns: ['./src/**/*.ts'],
        defaultLocale: 'en',
        locales: ['en']
      };`
    )

    expect(() => loadConfigFromFile(configPath)).toThrow(/localeDir/)
  })

  it('throws on non-existent file', () => {
    expect(() =>
      loadConfigFromFile(join(tempDir, 'does-not-exist.js'))
    ).toThrow()
  })
})

describe('findConfigFile', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = join(tmpdir(), `i18n-find-config-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  afterAll(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it('returns null when no config file exists', () => {
    expect(findConfigFile(tempDir)).toBeNull()
  })

  it('finds sindarian-i18n.config.ts', async () => {
    const dir = join(tempDir, 'find-ts')
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'sindarian-i18n.config.ts'), '// placeholder')

    const result = findConfigFile(dir)
    expect(result).toContain('sindarian-i18n.config.ts')
  })

  it('finds intl.config.ts as fallback', async () => {
    const dir = join(tempDir, 'find-intl')
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'intl.config.ts'), '// placeholder')

    const result = findConfigFile(dir)
    expect(result).toContain('intl.config.ts')
  })
})
```

**Step 2: Commit**

```bash
git add packages/sindarian-i18n-cli/src/__tests__/config.test.ts
git commit -m "test(sindarian-i18n-cli): add config loader unit tests"
```

**If Task Fails:**
1. Rollback: `git checkout -- packages/sindarian-i18n-cli/src/__tests__/config.test.ts`

---

## Task 20: Run all tests and verify they pass

**Step 1: Run the tests**

Run:
```bash
cd packages/sindarian-i18n-cli && npx jest --verbose 2>&1
```

**Expected output:** All tests pass. You should see output like:
```
 PASS  src/__tests__/extractor.test.ts
 PASS  src/__tests__/validator.test.ts
 PASS  src/__tests__/key-differ.test.ts
 PASS  src/__tests__/reporter.test.ts
 PASS  src/__tests__/config.test.ts

Test Suites: 5 passed, 5 total
Tests:       X passed, X total
```

**Step 2: Run tests via turbo to confirm integration**

Run:
```bash
npx turbo test --filter=@lerianstudio/sindarian-i18n-cli
```

**Expected output:** Turbo runs tests successfully.

**If Task Fails:**
1. **Import errors:** Check that the test file imports use `../extractor` not `./extractor`.
2. **ts-jest config:** Verify `jest.config.ts` points to `tsconfig.eslint.json`.
3. **Module not found:** Run `npm install` from root to ensure all deps are linked.
4. **Specific test failure:** Read the Jest output carefully -- the error message will indicate the issue.

---

## Task 21: Run lint check

**Step 1: Run ESLint**

Run:
```bash
cd packages/sindarian-i18n-cli && npx eslint . 2>&1
```

**Expected output:** No errors (or only warnings that are acceptable).

**Step 2: Fix any lint issues**

If there are errors, run:
```bash
cd packages/sindarian-i18n-cli && npx eslint . --fix
```

**Step 3: Commit any lint fixes if needed**

```bash
git add packages/sindarian-i18n-cli/src/
git commit -m "style(sindarian-i18n-cli): fix lint issues"
```

**If Task Fails:**
1. **Parser errors:** Ensure `tsconfig.eslint.json` includes all source and test files.
2. **Missing plugin:** ESLint plugins should be installed at the root level already.

---

### Task 22: Run Code Review

1. **Dispatch all 3 reviewers in parallel:**
   - REQUIRED SUB-SKILL: Use ring-default:requesting-code-review
   - All reviewers run simultaneously (ring-default:code-reviewer, ring-default:business-logic-reviewer, ring-default:security-reviewer)
   - Wait for all to complete

2. **Handle findings by severity (MANDATORY):**

**Critical/High/Medium Issues:**
- Fix immediately (do NOT add TODO comments for these severities)
- Re-run all 3 reviewers in parallel after fixes
- Repeat until zero Critical/High/Medium issues remain

**Low Issues:**
- Add `TODO(review):` comments in code at the relevant location
- Format: `TODO(review): [Issue description] (reported by [reviewer] on [date], severity: Low)`
- This tracks tech debt for future resolution

**Cosmetic/Nitpick Issues:**
- Add `FIXME(nitpick):` comments in code at the relevant location
- Format: `FIXME(nitpick): [Issue description] (reported by [reviewer] on [date], severity: Cosmetic)`
- Low-priority improvements tracked inline

3. **Proceed only when:**
   - Zero Critical/High/Medium issues remain
   - All Low issues have TODO(review): comments added
   - All Cosmetic issues have FIXME(nitpick): comments added

---

## Task 23: Final verification -- end-to-end smoke test

**Step 1: Create a temporary test config file**

Run:
```bash
cd packages/sindarian-i18n-cli && node -e "
const fs = require('fs');
fs.mkdirSync('tmp-test/src', { recursive: true });
fs.writeFileSync('tmp-test/src/example.tsx', \`
import { defineMessages } from 'react-intl'
const msgs = defineMessages({
  hello: { id: 'app.hello', defaultMessage: 'Hello' },
  bye: { id: 'app.bye', defaultMessage: 'Goodbye' }
})
\`);
fs.writeFileSync('tmp-test/sindarian-i18n.config.js', \`
module.exports = {
  filePatterns: ['./tmp-test/src/**/*.tsx'],
  defaultLocale: 'en',
  locales: ['en', 'pt'],
  localeDir: './tmp-test/locales'
};
\`);
console.log('Test files created');
"
```

**Expected output:** `Test files created`

**Step 2: Run the extract command**

Run:
```bash
cd packages/sindarian-i18n-cli && node dist/cli.js extract --config tmp-test/sindarian-i18n.config.js
```

**Expected output:** Something like:
```
Extracted 2 messages into 2 locale files.
```

**Step 3: Verify locale files were created**

Run:
```bash
cat packages/sindarian-i18n-cli/tmp-test/locales/en.json
```

**Expected output:** JSON with `app.bye` and `app.hello` keys with their defaultMessages.

```bash
cat packages/sindarian-i18n-cli/tmp-test/locales/pt.json
```

**Expected output:** JSON with `app.bye` and `app.hello` keys with empty string values.

**Step 4: Run check command**

Run:
```bash
cd packages/sindarian-i18n-cli && node dist/cli.js check --config tmp-test/sindarian-i18n.config.js
```

**Expected output:** `All i18n messages are valid.`

**Step 5: Run check-keys command**

Run:
```bash
cd packages/sindarian-i18n-cli && node dist/cli.js check-keys --config tmp-test/sindarian-i18n.config.js
```

**Expected output:** `All i18n keys are up to date.`

**Step 6: Clean up test files**

Run:
```bash
rm -rf packages/sindarian-i18n-cli/tmp-test
```

**Step 7: Final commit (if any fixes were needed)**

If any fixes were made during smoke testing:
```bash
git add packages/sindarian-i18n-cli/
git commit -m "fix(sindarian-i18n-cli): address issues found during smoke testing"
```

**If Task Fails:**
1. **CLI not found:** Rebuild with `cd packages/sindarian-i18n-cli && npm run build`.
2. **Config not loading:** Check that `require()` resolves the config path correctly.
3. **Extract produces no messages:** Verify the glob pattern in the test config matches the test file path.

---

## Summary of all files created

```
packages/sindarian-i18n-cli/
  package.json
  tsconfig.json
  tsconfig.eslint.json
  eslint.config.mjs
  jest.config.ts
  src/
    index.ts              (barrel export)
    types.ts              (all TypeScript interfaces)
    extractor.ts          (message extraction with @formatjs/ts-transformer)
    validator.ts          (message validation)
    key-differ.ts         (locale key diffing)
    reporter.ts           (ESLint-style console output)
    config.ts             (config file loader with auto-detection)
    cli.ts                (Commander CLI entry point)
    __tests__/
      extractor.test.ts
      validator.test.ts
      key-differ.test.ts
      reporter.test.ts
      config.test.ts
```
