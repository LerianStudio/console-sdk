/**
 * Jest configuration for sindarian-ui package
 * Extends the base configuration with package-specific settings
 *
 * The @jest-config-loader pragma forces Jest to use ts-node for parsing this config.
 * Jest 30+ uses Node's native TypeScript type stripping (Node 22+), which requires
 * explicit file extensions in imports. Cross-package imports like '../utils/jest.config'
 * fail without extensions. This pragma bypasses that limitation.
 * See: https://github.com/jestjs/jest/issues/15837
 *
 * @jest-config-loader ts-node
 */

import type { Config } from 'jest'
import baseConfig from '../utils/jest.config'

const config: Config = {
  ...baseConfig,
  displayName: 'sindarian-ui'
  // Package-specific configuration can be added here if needed
}

export default config
