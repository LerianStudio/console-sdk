## Sindarian i18n CLI

i18n message extraction, validation, and key diffing. Uses `@formatjs/ts-transformer` v4 under the hood.

### Build

- **Bundler:** `tsup` (not plain `tsc`) — outputs ESM with type declarations
- **Module system:** ESM-only (`"type": "module"` in package.json)
- **Module resolution:** `bundler` — allows clean extensionless imports
- **Type checking:** `tsc --noEmit` (tsup handles the actual build)
- **Entry points:** `src/index.ts` (library) and `src/cli.ts` (CLI binary)

### CLI Commands

| Command | Description |
|---------|-------------|
| `sindarian-i18n extract` | Extract messages and write locale JSON files |
| `sindarian-i18n check` | Validate extracted messages (exit 1 on errors) |
| `sindarian-i18n check-keys` | Diff extracted keys against locale file |

Global option: `-c, --config <path>` for config file path.

### Extraction Sources

Recognized patterns (via @formatjs):
- `defineMessages({ id, defaultMessage })`
- `<FormattedMessage id="..." defaultMessage="..." />`
- `formatMessage({ id, defaultMessage })`
- Custom functions via `additionalFunctionNames` config

### Config File

Searched in order: `sindarian-i18n.config.{ts,js,cjs}`, `intl.config.{ts,js}`

```typescript
export default {
  filePatterns: ['src/**/*.{ts,tsx}'],
  defaultLocale: 'en',
  locales: ['en', 'pt-BR'],
  localeDir: 'src/locales',
  additionalFunctionNames: [],  // optional
  concurrency: 10               // optional
}
```

### Architecture

- `extractAll()` → batch file processing with configurable concurrency
- `validate()` → checks missing IDs, empty messages, duplicate ID conflicts
- `diffKeys()` → compares extracted keys against existing locale JSON

Error handling is split: `extractAll()`, `extractFile()`, and `validate()` collect errors in return values and never throw. However, `loadConfig()`, `loadConfigFromFile()`, and `diffKeys()` throw on invalid config or malformed locale files.

### Library API

All CLI functions exported from `@lerianstudio/sindarian-i18n-cli` for programmatic use: `extractAll`, `validate`, `diffKeys`, `loadConfig`, `formatSimpleJson`, etc.

### Testing

- Jest with `@jest-environment node` and ESM support (`--experimental-vm-modules`)
- Config: `jest.config.mjs` (not `.ts`)
- Test source strings containing `defineMessages()` and `<FormattedMessage>`
- Validate extraction results, error handling, offset calculations
