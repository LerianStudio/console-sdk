import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  framework: '@storybook/nextjs',

  // One glob over all of src/: the sindarian-x absorption put stories under
  // enterprise/, theme/, toast/, charts/ and domain/ as well as components/,
  // and a per-directory list only goes stale again the next time a surface is
  // added. `__tests__` is the only src/ subtree that never holds a story.
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  staticDirs: ['../src/public'],

  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-links',
    '@chromatic-com/storybook'
  ],

  typescript: {
    reactDocgen: 'react-docgen-typescript'
  }
}

export default config
