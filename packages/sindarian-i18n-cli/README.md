# @lerianstudio/sindarian-i18n-cli

i18n message extraction, validation, and key diffing CLI + library for React/TypeScript projects using [react-intl](https://formatjs.io/docs/react-intl/).

Part of the [Lerian Studio console-sdk](https://github.com/LerianStudio/console-sdk) monorepo.

## ✨ Features

- **Extract** i18n messages from source files — supports `defineMessages()`, `<FormattedMessage>`, `intl.formatMessage()`, and custom function names (e.g. `$t()`)
- **Validate** extracted messages — detects missing IDs, missing `defaultMessage`, and duplicate IDs with conflicting text
- **Diff keys** against locale JSON files — finds new untranslated keys and stale keys no longer in source
- **Report** issues in ESLint-style grouped output with `file:line:col` and ANSI colors

---

## 📦 Installation

```bash
npm install @lerianstudio/sindarian-i18n-cli
```

Or as a dev dependency:

```bash
npm install --save-dev @lerianstudio/sindarian-i18n-cli
```

---

## 🚀 Quick start

### 1. Create a config file

Create `sindarian-i18n.config.ts` in your project root:

```typescript
import type { I18nConfig } from '@lerianstudio/sindarian-i18n-cli'

const config: I18nConfig = {
  filePatterns: ['./src/**/!(*.d).{ts,tsx}'],
  additionalFunctionNames: ['$t'],
  defaultLocale: 'en',
  locales: ['en', 'pt'],
  localeDir: './locales/extracted',
  concurrency: 10
}

export default config
```

### 2. Extract messages

```bash
npx sindarian-i18n extract
```

This scans your source files, extracts all i18n messages, and writes locale JSON files to the configured `localeDir`. The default locale file contains `{ "message.id": "Default message text" }` pairs. Other locale files are merged — existing translations are preserved, new keys get empty strings, and stale keys are removed.

### 3. Validate messages

```bash
npx sindarian-i18n check
```

Exits with code 1 if any errors are found (missing IDs, missing `defaultMessage`, duplicate IDs with different text).

### 4. Check key sync

```bash
npx sindarian-i18n check-keys
```

Exits with code 1 if the locale file is out of sync with your source code. Reports which keys were added or removed.

---

## 🔧 CLI reference

```
sindarian-i18n [options] <command>

Options:
  -c, --config <path>   Path to config file
  -V, --version         Output the version number
  -h, --help            Display help

Commands:
  extract               Extract i18n messages and write locale files
  check                 Validate extracted i18n messages (exits 1 on errors)
  check-keys            Diff extracted keys against locale file (exits 1 if out of sync)
```

### `extract`

Scans files matching `filePatterns`, extracts messages, validates them, and writes locale JSON files. If extraction or validation errors occur, they are printed but extraction still completes for valid files.

### `check`

Runs extraction and validation without writing any files. Exits with code 1 on errors — useful as a CI gate.

### `check-keys`

Runs extraction, then compares the extracted keys against the default locale JSON file. Exits with code 1 if keys are out of sync. Tells you to run `extract` when new keys are found.

---

## ⚙️ Configuration

The CLI auto-detects config files in this order:

1. `sindarian-i18n.config.ts`
2. `sindarian-i18n.config.js`
3. `intl.config.ts`

You can override this with the `-c` / `--config` flag.

### Config options

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `filePatterns` | `string[]` | Yes | — | Glob patterns to scan for i18n messages |
| `additionalFunctionNames` | `string[]` | No | `[]` | Extra function names to extract besides `defineMessages` / `FormattedMessage` / `formatMessage` |
| `defaultLocale` | `string` | Yes | — | Source-of-truth locale code (e.g. `'en'`) |
| `locales` | `string[]` | Yes | — | All locale codes including `defaultLocale` (e.g. `['en', 'pt']`) |
| `localeDir` | `string` | Yes | — | Directory where locale JSON files are stored |
| `concurrency` | `number` | No | `10` | Max file-read concurrency during extraction |

---

## 🔌 Programmatic API

All core functions are exported for use in scripts, custom tooling, or build pipelines.

```typescript
import {
  extractAll,
  extractFile,
  formatSimpleJson,
  validate,
  diffKeys,
  formatValidationReport,
  formatExtractionErrors,
  formatKeyDiffReport,
  loadConfig,
  loadConfigFromFile,
  findConfigFile
} from '@lerianstudio/sindarian-i18n-cli'
```

### Extraction

```typescript
import { extractAll, formatSimpleJson } from '@lerianstudio/sindarian-i18n-cli'

const result = await extractAll({
  filePatterns: ['./src/**/*.tsx'],
  additionalFunctionNames: ['$t'],
  concurrency: 10
})

// result.messages  — Map<string, ResolvedMessage> (deduplicated by id)
// result.rawMessages — Map<string, ResolvedMessage[]> (grouped by file)
// result.errors — ExtractionError[]

const json = formatSimpleJson(result.messages)
// '{ "app.title": "My App", "app.greeting": "Hello, {name}!" }'
```

### Validation

```typescript
import { extractAll, validate, formatValidationReport } from '@lerianstudio/sindarian-i18n-cli'

const result = await extractAll({ filePatterns: ['./src/**/*.tsx'] })
const validation = validate(result)

if (validation.errorCount > 0) {
  console.error(formatValidationReport(validation))
  process.exit(1)
}
```

### Key diffing

```typescript
import { extractAll, diffKeys, formatKeyDiffReport } from '@lerianstudio/sindarian-i18n-cli'

const result = await extractAll({ filePatterns: ['./src/**/*.tsx'] })
const diff = await diffKeys(result.messages, './locales/extracted/en.json')

if (diff.added.length > 0 || diff.removed.length > 0) {
  console.error(formatKeyDiffReport(diff))
}
```

### Config loading

```typescript
import { loadConfig, findConfigFile } from '@lerianstudio/sindarian-i18n-cli'

// Auto-detect and load config
const config = loadConfig()

// Or load from a specific path
import { loadConfigFromFile } from '@lerianstudio/sindarian-i18n-cli'
const config2 = loadConfigFromFile('./my-custom-config.ts')
```

### Exported types

```typescript
import type {
  I18nConfig,
  ResolvedMessage,
  ExtractionResult,
  ExtractionError,
  ExtractorConfig,
  ValidationResult,
  ValidationIssue,
  IssueSeverity,
  KeyDiffResult
} from '@lerianstudio/sindarian-i18n-cli'
```

---

## 🤖 CI integration

Add validation and key-sync checks to your CI pipeline to catch i18n issues before merge.

### GitHub Actions example

```yaml
- name: Check i18n messages
  run: npx sindarian-i18n check

- name: Check i18n key sync
  run: npx sindarian-i18n check-keys
```

### npm scripts

```json
{
  "scripts": {
    "i18n:extract": "sindarian-i18n extract",
    "i18n:check": "sindarian-i18n check",
    "i18n:check-keys": "sindarian-i18n check-keys"
  }
}
```

Both `check` and `check-keys` exit with code 1 on failure, so they work out of the box as CI gates.

---

## 📄 License

ISC
