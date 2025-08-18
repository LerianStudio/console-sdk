import { FlatCompat } from '@eslint/eslintrc'
import tsParser from '@typescript-eslint/parser'
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin'
import globals from 'globals'
import js from '@eslint/js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default [
  // Base JavaScript recommended config
  js.configs.recommended,

  // TypeScript and Prettier configs using compat
  ...compat.extends(
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ),

  // Main configuration
  {
    languageOptions: {
      parser: tsParser,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest
      }
    },

    plugins: {
      '@typescript-eslint': typescriptEslintPlugin
    },

    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/semi': 'off',

      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto'
        }
      ]
    }
  }
]
