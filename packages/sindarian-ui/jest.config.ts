/**
 * Jest configuration for sindarian-ui package
 * Extends the base configuration with package-specific settings
 */

import type { Config } from 'jest'
import baseConfig from '../utils/jest.config'

const config: Config = {
  ...baseConfig,
  displayName: 'sindarian-ui'

}

export default config
