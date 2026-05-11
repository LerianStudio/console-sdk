/**
 * @jest-environment node
 */
import { loadConfigFromFile, findConfigFile } from './config'
import { writeFile, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

describe('loadConfigFromFile', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = join(tmpdir(), `i18n-config-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  afterAll(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it('loads a valid JS config file', async () => {
    const configPath = join(tempDir, 'valid.config.js')
    await writeFile(
      configPath,
      `module.exports = {
        filePatterns: ['./src/**/*.ts'],
        defaultLocale: 'en',
        locales: ['en', 'pt'],
        localeDir: './locales'
      };`
    )

    const config = loadConfigFromFile(configPath)
    expect(config.filePatterns).toEqual(['./src/**/*.ts'])
    expect(config.defaultLocale).toBe('en')
    expect(config.locales).toEqual(['en', 'pt'])
    expect(config.localeDir).toBe('./locales')
  })

  it('loads config exported as "intlConfig" named export', async () => {
    const configPath = join(tempDir, 'named.config.js')
    await writeFile(
      configPath,
      `module.exports.intlConfig = {
        filePatterns: ['./src/**/*.tsx'],
        defaultLocale: 'en',
        locales: ['en'],
        localeDir: './i18n'
      };`
    )

    const config = loadConfigFromFile(configPath)
    expect(config.filePatterns).toEqual(['./src/**/*.tsx'])
  })

  it('throws on missing filePatterns', async () => {
    const configPath = join(tempDir, 'missing-patterns.config.js')
    await writeFile(
      configPath,
      `module.exports = {
        defaultLocale: 'en',
        locales: ['en'],
        localeDir: './locales'
      };`
    )

    expect(() => loadConfigFromFile(configPath)).toThrow(/filePatterns/)
  })

  it('throws on missing defaultLocale', async () => {
    const configPath = join(tempDir, 'missing-locale.config.js')
    await writeFile(
      configPath,
      `module.exports = {
        filePatterns: ['./src/**/*.ts'],
        locales: ['en'],
        localeDir: './locales'
      };`
    )

    expect(() => loadConfigFromFile(configPath)).toThrow(/defaultLocale/)
  })

  it('throws on missing locales', async () => {
    const configPath = join(tempDir, 'missing-locales.config.js')
    await writeFile(
      configPath,
      `module.exports = {
        filePatterns: ['./src/**/*.ts'],
        defaultLocale: 'en',
        localeDir: './locales'
      };`
    )

    expect(() => loadConfigFromFile(configPath)).toThrow(/locales/)
  })

  it('throws on missing localeDir', async () => {
    const configPath = join(tempDir, 'missing-dir.config.js')
    await writeFile(
      configPath,
      `module.exports = {
        filePatterns: ['./src/**/*.ts'],
        defaultLocale: 'en',
        locales: ['en']
      };`
    )

    expect(() => loadConfigFromFile(configPath)).toThrow(/localeDir/)
  })

  it('throws on non-existent file', () => {
    expect(() =>
      loadConfigFromFile(join(tempDir, 'does-not-exist.js'))
    ).toThrow()
  })
})

describe('findConfigFile', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = join(tmpdir(), `i18n-find-config-test-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
  })

  afterAll(async () => {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true })
    }
  })

  it('returns null when no config file exists', () => {
    expect(findConfigFile(tempDir)).toBeNull()
  })

  it('finds sindarian-i18n.config.ts', async () => {
    const dir = join(tempDir, 'find-ts')
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'sindarian-i18n.config.ts'), '// placeholder')

    const result = findConfigFile(dir)
    expect(result).toContain('sindarian-i18n.config.ts')
  })

  it('finds intl.config.ts as fallback', async () => {
    const dir = join(tempDir, 'find-intl')
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'intl.config.ts'), '// placeholder')

    const result = findConfigFile(dir)
    expect(result).toContain('intl.config.ts')
  })
})
