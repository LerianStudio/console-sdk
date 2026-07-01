import fs from 'fs'
import path from 'path'
import { createRequire } from 'node:module'
import type { I18nConfig } from './types.js'

const CONFIG_FILE_NAMES = [
  'sindarian-i18n.config.ts',
  'sindarian-i18n.config.js',
  'sindarian-i18n.config.cjs',
  'intl.config.ts',
  'intl.config.js'
]

function assertI18nConfig(
  obj: unknown,
  filePath: string
): asserts obj is I18nConfig {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error(`Config file "${filePath}" must export an object.`)
  }

  const config = obj as Record<string, unknown>

  if (
    !Array.isArray(config.filePatterns) ||
    config.filePatterns.length === 0 ||
    !config.filePatterns.every((p) => typeof p === 'string' && p.length > 0)
  ) {
    throw new Error(
      `Config file "${filePath}" must export "filePatterns" as a non-empty array of non-empty strings.`
    )
  }

  if (
    typeof config.defaultLocale !== 'string' ||
    config.defaultLocale.length === 0
  ) {
    throw new Error(
      `Config file "${filePath}" must export "defaultLocale" as a non-empty string.`
    )
  }

  if (
    !Array.isArray(config.locales) ||
    config.locales.length === 0 ||
    !config.locales.every((l) => typeof l === 'string' && l.length > 0)
  ) {
    throw new Error(
      `Config file "${filePath}" must export "locales" as a non-empty array of non-empty strings.`
    )
  }

  if (!config.locales.includes(config.defaultLocale as string)) {
    throw new Error(
      `Config file "${filePath}": "defaultLocale" ("${config.defaultLocale}") must be included in "locales" ([${(config.locales as string[]).join(', ')}]).`
    )
  }

  if (typeof config.localeDir !== 'string' || config.localeDir.length === 0) {
    throw new Error(
      `Config file "${filePath}" must export "localeDir" as a non-empty string.`
    )
  }
}

const require = createRequire(import.meta.url)

let tsNodeRegistered = false
function ensureTsNode(): void {
  if (tsNodeRegistered) return
  try {
    require('ts-node/register/transpile-only')
    tsNodeRegistered = true
  } catch {
    throw new Error(
      'ts-node is required to load TypeScript config files. Install it as a dev dependency.'
    )
  }
}

/**
 * Loads the i18n config from a specific file path.
 */
export function loadConfigFromFile(filePath: string): I18nConfig {
  const resolved = path.resolve(filePath)

  if (resolved.endsWith('.ts')) {
    ensureTsNode()
  }

  const mod = require(resolved)
  const exported = mod.default ?? mod.intlConfig ?? mod

  assertI18nConfig(exported, filePath)
  return exported
}

/**
 * Auto-detects a config file in the given directory by searching for known names.
 */
export function findConfigFile(cwd: string): string | null {
  for (const name of CONFIG_FILE_NAMES) {
    const candidate = path.join(cwd, name)
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

/**
 * Loads config from --config flag or auto-detects.
 */
export function loadConfig(configPath?: string): I18nConfig {
  if (configPath) {
    return loadConfigFromFile(configPath)
  }

  const found = findConfigFile(process.cwd())
  if (!found) {
    throw new Error(
      `No config file found. Create one of: ${CONFIG_FILE_NAMES.join(', ')}\n` +
        'Or pass --config <path> explicitly.'
    )
  }

  return loadConfigFromFile(found)
}
