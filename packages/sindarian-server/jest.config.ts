/**
 * Jest configuration for sindarian-server package
 * Extends the base configuration with package-specific settings
 */

import type { Config } from 'jest'
import baseConfig from '../utils/jest.config'

const config: Config = {
  ...baseConfig,
  displayName: 'sindarian-server',
  setupFiles: ['./setupJest.ts'],
  testEnvironment: 'node',

  // Override transform configuration for server-specific TypeScript handling
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // Use the ESLint TypeScript configuration that includes test files
        tsconfig: './tsconfig.eslint.json'
      }
    ]
  },

  // Remove UI-specific setup
  setupFilesAfterEnv: undefined
}

export default config
