/**
 * @file Jest configuration for the sindarian-server package.
 *
 * Extends the shared base Jest config with server-specific settings.
 * NOTE: This change is comments-only and does not alter runtime behavior.
 */

import type { Config } from 'jest'
import baseConfig from '../utils/jest.config'

const config: Config = {
  // Inherit common monorepo settings (paths, coverage, etc.)
  ...baseConfig,

  // Package label shown in Jest reports
  displayName: 'sindarian-server',

  // Files executed before tests (e.g., mocks, polyfills)
  setupFiles: ['./setupJest.ts'],

  // Run tests in a Node environment for server-side code
  testEnvironment: 'node',

  // Transform TS/TSX via ts-jest; point to a tsconfig that includes test files
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // Use the ESLint TypeScript configuration that includes test files
        tsconfig: './tsconfig.eslint.json'
      }
    ]
  },

  // Make explicit that no UI-specific after-env setup is used in this package
  setupFilesAfterEnv: undefined,

  // Ignore test files in the `test` directory (e.g., integration tests)
  testPathIgnorePatterns: ['<rootDir>/test']
}

export default config
