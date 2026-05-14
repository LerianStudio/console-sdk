#!/usr/bin/env node

import { Command } from 'commander'
import path from 'path'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { loadConfig } from './config'
import { extractAll, formatSimpleJson } from './extractor'
import { validate } from './validator'
import { diffKeys, formatKeyDiffReport } from './key-differ'
import { formatValidationReport, formatExtractionErrors } from './reporter'
import type { I18nConfig } from './types'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../package.json') as { version: string }

const program = new Command()

program
  .name('sindarian-i18n')
  .description('i18n message extraction, validation, and key diffing CLI')
  .version(pkg.version)
  .option('-c, --config <path>', 'Path to config file')

async function mergeLocale(
  locale: string,
  extractedKeys: string[],
  localeDir: string
): Promise<void> {
  const localePath = path.join(localeDir, `${locale}.json`)

  let existing: Record<string, string> = {}
  try {
    const content = await readFile(localePath, 'utf-8')
    existing = JSON.parse(content)
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist yet
    } else {
      console.error(
        `Failed to read/parse locale file "${localePath}": ${(e as Error).message}`
      )
      process.exit(1)
    }
  }

  const merged: Record<string, string> = {}
  for (const key of extractedKeys) {
    merged[key] = existing[key] ?? ''
  }

  try {
    await writeFile(localePath, JSON.stringify(merged, null, 2), 'utf-8')
  } catch (e) {
    console.error(
      `Failed to write locale file "${localePath}": ${(e as Error).message}`
    )
    process.exit(1)
  }
}

// ── extract command ─────────────────────────────────────────────────

program
  .command('extract')
  .description('Extract i18n messages and write locale files')
  .action(async () => {
    const config = loadConfig(program.opts().config) as I18nConfig

    await mkdir(config.localeDir, { recursive: true })

    const result = await extractAll({
      filePatterns: config.filePatterns,
      additionalFunctionNames: config.additionalFunctionNames,
      concurrency: config.concurrency
    })

    let hasErrors = false

    if (result.errors.length > 0) {
      console.error(formatExtractionErrors(result.errors))
      hasErrors = true
    }

    const validation = validate(result)
    if (validation.errorCount > 0) {
      console.error(formatValidationReport(validation))
      hasErrors = true
    }

    if (hasErrors) {
      console.warn(
        '\nExtraction completed with errors above. Messages from valid files were still extracted.\n'
      )
    }

    const extracted = formatSimpleJson(result.messages)
    await writeFile(
      path.join(config.localeDir, `${config.defaultLocale}.json`),
      extracted,
      'utf-8'
    )

    const extractedKeys = [...result.messages.keys()]
    await Promise.all(
      config.locales
        .filter((locale) => locale !== config.defaultLocale)
        .map((locale) => mergeLocale(locale, extractedKeys, config.localeDir))
    )

    const localeCount = config.locales.length
    console.log(
      `Extracted ${result.messages.size} messages into ${localeCount} locale file${localeCount > 1 ? 's' : ''}.`
    )
  })

// ── check command ───────────────────────────────────────────────────

program
  .command('check')
  .description('Validate extracted i18n messages (exits 1 on errors)')
  .action(async () => {
    const config = loadConfig(program.opts().config) as I18nConfig

    const result = await extractAll({
      filePatterns: config.filePatterns,
      additionalFunctionNames: config.additionalFunctionNames,
      concurrency: config.concurrency
    })

    let hasErrors = false

    if (result.errors.length > 0) {
      console.error(formatExtractionErrors(result.errors))
      hasErrors = true
    }

    const validation = validate(result)
    if (validation.errorCount > 0) {
      console.error(formatValidationReport(validation))
      hasErrors = true
    }

    if (hasErrors) {
      process.exit(1)
    }

    console.log('All i18n messages are valid.')
  })

// ── check-keys command ──────────────────────────────────────────────

program
  .command('check-keys')
  .description(
    'Diff extracted keys against locale file (exits 1 if out of sync)'
  )
  .action(async () => {
    const config = loadConfig(program.opts().config) as I18nConfig

    const result = await extractAll({
      filePatterns: config.filePatterns,
      additionalFunctionNames: config.additionalFunctionNames,
      concurrency: config.concurrency
    })

    const localePath = path.join(
      config.localeDir,
      `${config.defaultLocale}.json`
    )
    const diff = await diffKeys(result.messages, localePath)

    if (diff.added.length > 0 || diff.removed.length > 0) {
      console.error(formatKeyDiffReport(diff))
      if (diff.added.length > 0) {
        console.error('\nRun "sindarian-i18n extract" to update locale files.')
      }
      process.exit(1)
    }

    console.log('All i18n keys are up to date.')
  })

program.parseAsync(process.argv).catch((err) => {
  console.error(err)
  process.exit(1)
})
