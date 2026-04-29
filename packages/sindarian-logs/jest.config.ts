import type { Config } from 'jest'
import baseConfig from '../utils/jest.config'

const config: Config = {
  ...baseConfig,
  displayName: 'sindarian-logs',
  setupFiles: ['./setupJest.ts'],
  testEnvironment: 'node',
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
