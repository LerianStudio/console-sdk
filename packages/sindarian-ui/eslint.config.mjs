import baseConfig from '../utils/eslint.config.mjs'

export default [
  // Apply recommended configs
  ...baseConfig,

  // The two CommonJS islands (sidebar's next/link probe, the countries
  // dataset) exist precisely so `require()` survives into the ESM build —
  // see src/components/ui/sidebar/next-router.cjs. In a .cjs file, require IS
  // the import syntax.
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
    rules: { '@typescript-eslint/no-require-imports': 'off' }
  },

  // Ignore patterns
  {
    ignores: ['dist/**', '**/dist/**']
  }
]
