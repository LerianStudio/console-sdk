import type { Preview } from '@storybook/nextjs'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import '../src/globals.css'
import './storybook.css'

dayjs.extend(relativeTime)

const preview: Preview = {
  parameters: {
    backgrounds: {
      values: [
        { name: 'Light', value: '#f4f4f5' },
        { name: 'Dark', value: '#09090b' }
      ],
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

export const decorators = [
  (Story, context) => {
    const background = context.globals?.backgrounds?.value ?? '#f4f4f5'
    const isDark = background === '#09090b'

    return (
      <div className={isDark ? 'dark' : ''}>
        <Story />
      </div>
    )
  }
]

export default preview
