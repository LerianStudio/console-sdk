import path from 'path'
import type { I18nConfig } from './types'

const CONFIG_FILE_NAMES = [
  'sindarian-i18n.config.ts',
  'sindarian-i18n.config.js',
  'sindarian-i18n.config.cjs',
  'sindarian-i18n.config.mjs',
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

  if (!Array.isArray(config.filePatterns) || config.filePatterns.length === 0) {
    throw new Error(
      `Config file "${filePath}" must export "filePatterns" as a non-empty string array.`
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

  if (!Array.isArray(config.locales) || config.locales.length === 0) {
    throw new Error(
      `Config file "${filePath}" must export "locales" as a non-empty string array.`
    )
  }

  if (
    typeof config.localeDir !== 'string' ||
    config.localeDir.length === 0
  ) {
    throw new Error(
      `Config file "${filePath}" must export "localeDir" as a non-empty string.`
    )
  }
}

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

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(resolved)
  const exported = mod.default ?? mod.intlConfig ?? mod

  assertI18nConfig(exported, filePath)
  return exported
}

/**
 * Auto-detects a config file in the given directory by searching for known names.
 */
export function findConfigFile(cwd: string): string | null {
  const fs = require('fs') as typeof import('fs')
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
