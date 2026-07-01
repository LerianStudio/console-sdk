/**
 * @file Jest configuration for the sindarian-i18n-cli package.
 *
 * Extends the shared base Jest config with CLI-specific settings.
 * Uses .mjs to avoid ts-node ESM resolution issues with the base config.
 */

/** @type {import('jest').Config} */
const config = {
  // Shared monorepo settings (inlined from ../utils/jest.config.ts)
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  preset: 'ts-jest',

  // Package label shown in Jest reports
  displayName: 'sindarian-i18n-cli',

  // Run tests in a Node environment for CLI code
  testEnvironment: 'node',

  // Transform TS via ts-jest with ESM support
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        // Use the ESLint TypeScript configuration that includes test files
        tsconfig: './tsconfig.eslint.json'
      }
    ]
  },

  // Remap path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
}

export default config
