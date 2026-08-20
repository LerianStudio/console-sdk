import baseConfig from '../utils/eslint.config.mjs'

export default [
  ...baseConfig,

  {
    ignores: ['dist/**', '**/dist/**', 'coverage/**']
  }
]
