/**
 * Base Jest configuration for the monorepo
 * This file contains shared configuration that can be extended by packages
 */

import type { Config } from 'jest'

const baseConfig: Config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // A preset that is used as a base for Jest's configuration
  preset: 'ts-jest',

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  // The test environment that will be used for testing
  testEnvironment: 'jsdom',

  // Never collect tests from build output. A built package leaves compiled
  // copies of its own test files in dist/, which Jest would run alongside the
  // real ones — and they fail spuriously, because moduleNameMapper resolves
  // '@/...' mocks to src/ while the compiled test imports its dist/ sibling.
  // Overriding this list in a package config replaces it, so re-include these
  // patterns there (see sindarian-server).
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // A list of paths to modules that run some code to configure or set up the
  // testing framework before each test. `jest.setup.ts` lives next to this file
  // and is addressed through <rootDir> so every package resolves it from its own
  // directory. Overriding this list in a package config replaces it — re-include
  // both entries there.
  setupFilesAfterEnv: [
    '@testing-library/jest-dom',
    '<rootDir>/../utils/jest.setup.ts'
  ]
}

export default baseConfig
