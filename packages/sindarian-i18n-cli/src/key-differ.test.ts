/**
 * @jest-environment node
 */
import { diffKeys, formatKeyDiffReport } from './key-differ'
import { writeFile, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import type { ResolvedMessage } from './types'

function makeMessages(ids: string[]): Map<string, ResolvedMessage> {
  const map = new Map<string, ResolvedMessage>()
  for (const id of ids) {
    map.set(id, {
      id,
      defaultMessage: `msg for ${id}`,
      file: 'test.ts',
      line: 1,
      col: 1
    })
  }
  return map
}

describe('diffKeys', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = join(tmpdir(), `i18n-diff-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  afterAll(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it('detects added keys', async () => {
    const localePath = join(tempDir, 'added.json')
    await writeFile(localePath, JSON.stringify({ 'existing.key': 'value' }))

    const messages = makeMessages(['existing.key', 'new.key'])
    const result = await diffKeys(messages, localePath)

    expect(result.added).toEqual(['new.key'])
    expect(result.removed).toHaveLength(0)
  })

  it('detects removed keys', async () => {
    const localePath = join(tempDir, 'removed.json')
    await writeFile(
      localePath,
      JSON.stringify({ 'kept.key': 'v', 'stale.key': 'v' })
    )

    const messages = makeMessages(['kept.key'])
    const result = await diffKeys(messages, localePath)

    expect(result.added).toHaveLength(0)
    expect(result.removed).toEqual(['stale.key'])
  })

  it('no differences returns empty added/removed', async () => {
    const localePath = join(tempDir, 'nodiff.json')
    await writeFile(localePath, JSON.stringify({ 'a.key': 'v', 'b.key': 'v' }))

    const messages = makeMessages(['a.key', 'b.key'])
    const result = await diffKeys(messages, localePath)

    expect(result.added).toHaveLength(0)
    expect(result.removed).toHaveLength(0)
  })

  it('handles missing locale file gracefully', async () => {
    const localePath = join(tempDir, 'nonexistent.json')
    const messages = makeMessages(['a.key'])
    const result = await diffKeys(messages, localePath)

    expect(result.added).toEqual(['a.key'])
    expect(result.removed).toHaveLength(0)
  })

  it('throws descriptive error on malformed JSON', async () => {
    const localePath = join(tempDir, 'malformed.json')
    await writeFile(localePath, '{not valid json')

    const messages = makeMessages(['a.key'])
    await expect(diffKeys(messages, localePath)).rejects.toThrow(
      /Failed to parse locale file.*malformed\.json/
    )
  })
})

describe('formatKeyDiffReport', () => {
  it('formats added and removed keys', () => {
    const report = formatKeyDiffReport({
      added: ['new.one', 'new.two'],
      removed: ['old.one']
    })

    expect(report).toContain('new.one')
    expect(report).toContain('new.two')
    expect(report).toContain('old.one')
  })

  it('returns empty string for no differences', () => {
    const report = formatKeyDiffReport({ added: [], removed: [] })
    expect(report).toBe('')
  })
})
