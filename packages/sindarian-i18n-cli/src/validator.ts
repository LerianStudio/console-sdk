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

  const idOccurrences = new Map<
    string,
    Array<{ defaultMessage: string; file: string; line: number; col: number }>
  >()

  for (const [, messages] of result.rawMessages) {
    for (const msg of messages) {
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

      if (!msg.defaultMessage) {
        issues.push({
          severity: 'error',
          message: `Missing defaultMessage for id "${msg.id}"`,
          file: msg.file,
          line: msg.line,
          col: msg.col
        })
      }

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
