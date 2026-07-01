import { readFile } from 'fs/promises'
import type { KeyDiffResult, ResolvedMessage } from './types.js'

/**
 * Compares extracted message keys against a locale JSON file.
 */
export async function diffKeys(
  extractedMessages: Map<string, ResolvedMessage>,
  localeFilePath: string
): Promise<KeyDiffResult> {
  let localeKeys: Set<string> = new Set()
  let content: string | undefined

  try {
    content = await readFile(localeFilePath, 'utf-8')
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      localeKeys = new Set()
    } else {
      throw err
    }
  }

  if (content !== undefined) {
    try {
      localeKeys = new Set(Object.keys(JSON.parse(content)))
    } catch (err: unknown) {
      const error = new Error(
        `Failed to parse locale file "${localeFilePath}": ${err instanceof Error ? err.message : String(err)}`
      )
      ;(error as any).cause = err
      throw error
    }
  }

  const sourceKeys = new Set(extractedMessages.keys())
  const added = [...sourceKeys].filter((k) => !localeKeys.has(k)).sort()
  const removed = [...localeKeys].filter((k) => !sourceKeys.has(k)).sort()

  return { added, removed }
}

/**
 * Formats a key diff result as a human-readable report.
 */
export function formatKeyDiffReport(diff: KeyDiffResult): string {
  if (diff.added.length === 0 && diff.removed.length === 0) {
    return ''
  }

  const lines: string[] = []

  if (diff.added.length > 0) {
    lines.push(`New keys not yet extracted (${diff.added.length}):`)
    for (const key of diff.added) {
      lines.push(`  + ${key}`)
    }
  }

  if (diff.removed.length > 0) {
    if (lines.length > 0) lines.push('')
    lines.push(`Stale keys no longer in source (${diff.removed.length}):`)
    for (const key of diff.removed) {
      lines.push(`  - ${key}`)
    }
  }

  return lines.join('\n')
}
