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
} from './types.js'

// Core extraction
export {
  extractAll,
  extractFile,
  calculateLineColFromOffset,
  formatSimpleJson
} from './extractor.js'

// Validation
export { validate } from './validator.js'

// Key diff
export { diffKeys, formatKeyDiffReport } from './key-differ.js'

// Reporter
export { formatValidationReport, formatExtractionErrors } from './reporter.js'

// Config
export { loadConfig, loadConfigFromFile, findConfigFile } from './config.js'
