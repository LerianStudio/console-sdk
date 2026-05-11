/**
 * @jest-environment node
 */
import { validate } from './validator'
import type { ExtractionResult, ResolvedMessage } from './types'

function makeMessage(
  overrides: Partial<ResolvedMessage> & { id: string }
): ResolvedMessage {
  return {
    defaultMessage: 'Default',
    file: 'test.ts',
    line: 1,
    col: 1,
    ...overrides
  }
}

function makeResult(
  rawEntries: Array<[string, ResolvedMessage[]]>
): ExtractionResult {
  const messages = new Map<string, ResolvedMessage>()
  const rawMessages = new Map<string, ResolvedMessage[]>(rawEntries)
  for (const [, msgs] of rawEntries) {
    for (const msg of msgs) {
      if (!messages.has(msg.id)) {
        messages.set(msg.id, msg)
      }
    }
  }
  return { messages, rawMessages, errors: [] }
}

describe('validate', () => {
  it('detects missing ID (empty id)', () => {
    const result = makeResult([
      ['a.ts', [makeMessage({ id: '', file: 'a.ts', line: 5, col: 3 })]]
    ])

    const validation = validate(result)
    expect(validation.errorCount).toBe(1)
    expect(validation.issues[0]).toMatchObject({
      severity: 'error',
      file: 'a.ts',
      line: 5,
      col: 3
    })
    expect(validation.issues[0].message).toMatch(/missing id/i)
  })

  it('detects missing defaultMessage', () => {
    const result = makeResult([
      [
        'b.ts',
        [
          makeMessage({
            id: 'foo.bar',
            defaultMessage: '',
            file: 'b.ts',
            line: 10,
            col: 7
          })
        ]
      ]
    ])

    const validation = validate(result)
    expect(validation.errorCount).toBe(1)
    expect(validation.issues[0].message).toMatch(/missing defaultMessage/i)
  })

  it('duplicate ID with same defaultMessage produces no error', () => {
    const result = makeResult([
      [
        'a.ts',
        [makeMessage({ id: 'shared.ok', defaultMessage: 'OK', file: 'a.ts' })]
      ],
      [
        'b.ts',
        [makeMessage({ id: 'shared.ok', defaultMessage: 'OK', file: 'b.ts' })]
      ]
    ])

    const validation = validate(result)
    expect(validation.errorCount).toBe(0)
  })

  it('duplicate ID with different defaultMessage produces error', () => {
    const result = makeResult([
      [
        'a.ts',
        [
          makeMessage({
            id: 'dup.key',
            defaultMessage: 'Version A',
            file: 'a.ts',
            line: 3,
            col: 1
          })
        ]
      ],
      [
        'b.ts',
        [
          makeMessage({
            id: 'dup.key',
            defaultMessage: 'Version B',
            file: 'b.ts',
            line: 7,
            col: 2
          })
        ]
      ]
    ])

    const validation = validate(result)
    expect(validation.errorCount).toBe(1)
    expect(validation.issues[0].message).toContain('dup.key')
    expect(validation.issues[0].message).toMatch(/a\.ts/)
    expect(validation.issues[0].message).toMatch(/b\.ts/)
  })

  it('clean extraction returns errorCount 0', () => {
    const result = makeResult([
      [
        'clean.ts',
        [
          makeMessage({ id: 'clean.one', defaultMessage: 'One' }),
          makeMessage({ id: 'clean.two', defaultMessage: 'Two' })
        ]
      ]
    ])

    const validation = validate(result)
    expect(validation.errorCount).toBe(0)
    expect(validation.warningCount).toBe(0)
    expect(validation.issues).toHaveLength(0)
  })

  it('reports multiple issue types in single result', () => {
    const result = makeResult([
      [
        'multi.ts',
        [
          makeMessage({ id: '', file: 'multi.ts', line: 1, col: 1 }),
          makeMessage({
            id: 'has.id',
            defaultMessage: '',
            file: 'multi.ts',
            line: 5,
            col: 1
          })
        ]
      ]
    ])

    const validation = validate(result)
    expect(validation.errorCount).toBe(2)
    expect(validation.issues).toHaveLength(2)
  })
})
