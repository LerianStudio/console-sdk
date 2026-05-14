/**
 * @file Jest configuration for the sindarian-i18n-cli package.
 *
 * Extends the shared base Jest config with CLI-specific settings.
 */

import type { Config } from 'jest'
import baseConfig from '../utils/jest.config'

const config: Config = {
  // Inherit common monorepo settings (paths, coverage, etc.)
  ...baseConfig,

  // Package label shown in Jest reports
  displayName: 'sindarian-i18n-cli',

  // Run tests in a Node environment for CLI code
  testEnvironment: 'node',

  // Transform TS via ts-jest; point to a tsconfig that includes test files
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // Use the ESLint TypeScript configuration that includes test files
        tsconfig: './tsconfig.eslint.json'
      }
    ]
  },

  // No DOM/React testing setup needed for CLI package
  setupFilesAfterEnv: undefined
}

export default config
