/**
 * @jest-environment node
 */
import {
  calculateLineColFromOffset,
  extractFile,
  formatSimpleJson
} from './extractor'
import type { ExtractorConfig, ResolvedMessage } from './types'

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
    expect(calculateLineColFromOffset(source, 12)).toEqual({
      line: 2,
      col: 4
    })
  })

  it('handles multi-line source correctly', () => {
    const source = 'aaa\nbbb\nccc\nddd'
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

  it('never throws on dynamic ids', () => {
    const source = `
const id = 'dynamic'
intl.formatMessage({ id: id, defaultMessage: 'test' })
`
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

    const keys = Object.keys(parsed)
    expect(keys).toEqual(['alpha.message', 'zebra.message'])
    expect(parsed['alpha.message']).toBe('Alpha')
    expect(parsed['zebra.message']).toBe('Zebra')
    expect(result).toContain('  "alpha.message"')
  })

  it('returns empty object for empty map', () => {
    const result = formatSimpleJson(new Map())
    expect(JSON.parse(result)).toEqual({})
  })
})
