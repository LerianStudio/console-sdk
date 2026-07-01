import type {
  ExtractionError,
  ValidationIssue,
  ValidationResult
} from './types.js'

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
 */
export function formatValidationReport(
  result: ValidationResult,
  options?: { colors?: boolean }
): string {
  if (result.issues.length === 0) return ''

  const useColors = options?.colors ?? process.stdout.isTTY === true

  const grouped = new Map<string, ValidationIssue[]>()
  for (const issue of result.issues) {
    const list = grouped.get(issue.file) ?? []
    list.push(issue)
    grouped.set(issue.file, list)
  }

  const lines: string[] = []

  for (const file of [...grouped.keys()].sort()) {
    const issues = grouped.get(file)!
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

  const grouped = new Map<string, ExtractionError[]>()
  for (const err of errors) {
    const list = grouped.get(err.file) ?? []
    list.push(err)
    grouped.set(err.file, list)
  }

  const lines: string[] = []

  for (const file of [...grouped.keys()].sort()) {
    const errs = grouped.get(file)!
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
