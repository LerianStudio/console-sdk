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

  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['@testing-library/jest-dom']
}

export default baseConfig
