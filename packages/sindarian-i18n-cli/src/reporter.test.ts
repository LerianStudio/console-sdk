/**
 * @jest-environment node
 */
import { formatValidationReport, formatExtractionErrors } from './reporter'
import type { ValidationResult, ExtractionError } from './types'

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

    expect(report).toContain('src/a.ts')
    expect(report).toContain('src/b.ts')

    const aIndex = report.indexOf('src/a.ts')
    const bIndex = report.indexOf('src/b.ts')
    const err2Index = report.indexOf('Err2 in A')
    expect(err2Index).toBeGreaterThan(aIndex)
    expect(err2Index).toBeLessThan(bIndex)
  })

  it('sorts issues by line:col within each file', () => {
    const result: ValidationResult = {
      issues: [
        { severity: 'error', message: 'Late', file: 'f.ts', line: 20, col: 5 },
        {
          severity: 'error',
          message: 'Early',
          file: 'f.ts',
          line: 3,
          col: 1
        },
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

  it('summary line shows correct counts', () => {
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

    expect(formatValidationReport(result, { colors: false })).toBe('')
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
