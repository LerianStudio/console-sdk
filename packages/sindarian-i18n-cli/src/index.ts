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
export {
  extractAll,
  extractFile,
  calculateLineColFromOffset,
  formatSimpleJson
} from './extractor'

// Validation
export { validate } from './validator'

// Key diff
export { diffKeys, formatKeyDiffReport } from './key-differ'

// Reporter
export { formatValidationReport, formatExtractionErrors } from './reporter'

// Config
export { loadConfig, loadConfigFromFile, findConfigFile } from './config'
