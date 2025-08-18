import baseConfig from '../utils/eslint.config.mjs'

export default [
  // Apply recommended configs
  ...baseConfig,

  // Configuration for TypeScript test files that use reflect-metadata
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: '.'
      }
    },
    rules: {
      // Allow usage of reflect-metadata methods that are globally extended
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // Disable the rule that checks for unknown properties on types
      '@typescript-eslint/no-unsafe-return': 'off'
    }
  }
]
