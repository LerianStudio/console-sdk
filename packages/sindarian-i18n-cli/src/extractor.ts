import * as ts from 'typescript'
import { transformWithTs } from '@formatjs/ts-transformer'
import { readFile } from 'fs/promises'
import { glob } from 'glob'
import * as stringifyNs from 'json-stable-stringify'
import type {
  ExtractorConfig,
  ExtractionError,
  ExtractionResult,
  ResolvedMessage
} from './types'

const stringify: (obj: unknown, opts?: { space?: number }) => string =
  (stringifyNs as any).default || stringifyNs

/**
 * Converts a byte offset within source text to line:col.
 * Replicates @formatjs/cli-lib calculateLineColFromOffset.
 */
export function calculateLineColFromOffset(
  text: string,
  start?: number
): { line: number; col: number } {
  if (start == null) {
    return { line: 1, col: 1 }
  }
  const chunk = text.slice(0, start)
  const lines = chunk.split('\n')
  const lastLine = lines[lines.length - 1]
  return {
    line: lines.length,
    col: lastLine.length + 1
  }
}

/**
 * Extracts i18n messages from a single file's source text.
 * Never throws -- all errors are collected in the return value.
 */
export function extractFile(
  filePath: string,
  source: string,
  config: ExtractorConfig
): { messages: ResolvedMessage[]; errors: ExtractionError[] } {
  const messages: ResolvedMessage[] = []
  const errors: ExtractionError[] = []

  const transformerOpts = {
    throws: false,
    extractSourceLocation: true,
    additionalFunctionNames: config.additionalFunctionNames,
    onMsgExtracted(
      _fp: string,
      msgs: Array<{
        id: string
        defaultMessage?: string
        start?: number
      }>
    ) {
      for (const msg of msgs) {
        const { line, col } = calculateLineColFromOffset(source, msg.start)
        messages.push({
          id: msg.id ?? '',
          defaultMessage: msg.defaultMessage ?? '',
          file: filePath,
          line,
          col
        })
      }
    },
    onMsgError(_fp: string, error: Error) {
      errors.push({
        message: error.message,
        file: filePath,
        line: 1,
        col: 1
      })
    }
  }

  try {
    const output = ts.transpileModule(source, {
      compilerOptions: {
        allowJs: true,
        target: ts.ScriptTarget.ESNext,
        noEmit: true,
        experimentalDecorators: true
      },
      reportDiagnostics: true,
      fileName: filePath,
      transformers: {
        before: [
          // Cast needed: @formatjs/ts-transformer bundles its own TS 5.x types
          // which are structurally identical but nominally incompatible with TS 6
          transformWithTs(
            ts as any,
            transformerOpts
          ) as unknown as ts.TransformerFactory<ts.SourceFile>
        ]
      }
    })

    if (output.diagnostics) {
      const errs = output.diagnostics.filter(
        (d) => d.category === ts.DiagnosticCategory.Error
      )
      for (const diag of errs) {
        let line = 1
        let col = 1
        if (diag.file && diag.start != null) {
          const pos = diag.file.getLineAndCharacterOfPosition(diag.start)
          line = pos.line + 1
          col = pos.character + 1
        }
        errors.push({
          message: ts.flattenDiagnosticMessageText(diag.messageText, '\n'),
          file: filePath,
          line,
          col
        })
      }
    }
  } catch (e) {
    errors.push({
      message: e instanceof Error ? e.message : String(e),
      file: filePath,
      line: 1,
      col: 1
    })
  }

  return { messages, errors }
}

/**
 * Extracts i18n messages from all files matching the configured patterns.
 * Processes files in batches for concurrency control.
 * Never throws -- all errors are collected in the result.
 */
export async function extractAll(
  config: ExtractorConfig
): Promise<ExtractionResult> {
  const result: ExtractionResult = {
    messages: new Map(),
    rawMessages: new Map(),
    errors: []
  }

  const fileSet = new Set<string>()
  const allMatches = await Promise.all(config.filePatterns.map((p) => glob(p)))
  for (const matched of allMatches) {
    for (const fp of matched) fileSet.add(fp)
  }
  const filePaths = [...fileSet]

  const concurrency = Math.max(1, config.concurrency ?? 10)
  for (let i = 0; i < filePaths.length; i += concurrency) {
    const batch = filePaths.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(async (fp) => {
        try {
          const source = await readFile(fp, 'utf-8')
          return { filePath: fp, ...extractFile(fp, source, config) }
        } catch (e) {
          return {
            filePath: fp,
            messages: [] as ResolvedMessage[],
            errors: [
              {
                message: e instanceof Error ? e.message : String(e),
                file: fp,
                line: 1,
                col: 1
              }
            ]
          }
        }
      })
    )

    for (const { filePath, messages, errors } of batchResults) {
      if (messages.length > 0) {
        result.rawMessages.set(filePath, messages)
      }

      for (const msg of messages) {
        result.messages.set(msg.id, msg)
      }

      result.errors.push(...errors)
    }
  }

  return result
}

/**
 * Formats extracted messages as simple JSON: { [id]: defaultMessage }.
 * Uses json-stable-stringify for consistent alphabetical key ordering.
 */
export function formatSimpleJson(
  messages: Map<string, ResolvedMessage>
): string {
  const simple: Record<string, string> = {}
  for (const [id, msg] of messages) {
    simple[id] = msg.defaultMessage
  }
  return stringify(simple, { space: 2 })
}
