import baseConfig from '../utils/eslint.config.mjs'

export default [
  // Apply recommended configs
  ...baseConfig,

  // Ignore patterns
  {
    ignores: ['dist/**', '**/dist/**']
  }
]
