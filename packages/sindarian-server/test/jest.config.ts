import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/setup.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          baseUrl: '.',
          module: 'CommonJS',
          moduleResolution: 'node',
          target: 'ES2021',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          emitDecoratorMetadata: true, // Keep disabled due to Zod schema circular dependency issue
          experimentalDecorators: true,
          resolveJsonModule: true,
          allowSyntheticDefaultImports: true,
          forceConsistentCasingInFileNames: true,
          types: ['jest', 'reflect-metadata', 'node']
        }
      }
    ]
  },
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  collectCoverageFrom: ['**/*.{ts,tsx}', '!**/*.d.ts', '!**/node_modules/**']
}

export default config
