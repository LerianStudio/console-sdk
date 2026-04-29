import baseConfig from '../utils/eslint.config.mjs'

export default [
  // Apply recommended configs
  ...baseConfig,

  // Ignore patterns
  {
    ignores: ['dist/**', '**/dist/**']
  },

  // Global configuration to disable certain rules
  {
    rules: {
      '@typescript-eslint/no-unsafe-function-type': 'off'
    }
  },

  // Configuration for TypeScript test files that use reflect-metadata
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      // Allow usage of reflect-metadata methods that are globally extended
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-return': 'off'
    }
  }
]
