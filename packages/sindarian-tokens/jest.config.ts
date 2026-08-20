import type { Config } from 'jest'
import baseConfig from '../utils/jest.config'

const config: Config = {
  ...baseConfig,
  displayName: 'sindarian-tokens',
  testEnvironment: 'node',

  // src/__tests__/contrast.ts is the measurement instrument, not a suite.
  // ts-jest's default testMatch would claim it and fail it as an empty suite.
  testMatch: ['**/*.test.ts'],

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.eslint.json'
      }
    ]
  },
  setupFilesAfterEnv: undefined
}

export default config
