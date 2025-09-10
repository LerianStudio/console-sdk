import type { Preview } from '@storybook/nextjs'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import '../src/globals.css'
import './storybook.css'

dayjs.extend(relativeTime)

const preview: Preview = {
  parameters: {
    backgrounds: {
      values: [{ name: 'Light', value: '#f4f4f5' }],
      default: 'Light'
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
}

export const decorators = [(Story) => <Story />]

export default preview
