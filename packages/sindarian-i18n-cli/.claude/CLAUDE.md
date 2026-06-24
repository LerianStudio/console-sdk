## Sindarian i18n CLI

i18n message extraction, validation, and key diffing. Uses `@formatjs/ts-transformer` under the hood.

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
- Never throws — all errors collected in return values

### Library API

All CLI functions exported from `@lerianstudio/sindarian-i18n-cli` for programmatic use: `extractAll`, `validate`, `diffKeys`, `loadConfig`, `formatSimpleJson`, etc.

### Testing

- Jest with `@jest-environment node`
- Test source strings containing `defineMessages()` and `<FormattedMessage>`
- Validate extraction results, error handling, offset calculations
