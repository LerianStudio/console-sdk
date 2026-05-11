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
 */
export interface I18nConfig {
  /** Glob patterns to scan for i18n messages */
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
