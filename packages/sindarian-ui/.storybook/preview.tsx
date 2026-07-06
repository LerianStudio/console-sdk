import type { Preview } from '@storybook/nextjs'
import { useEffect } from 'react'
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
    const background = context.globals?.backgrounds?.value
    const isDark = background === 'dark' || background === '#09090b'

    useEffect(() => {
      const root = document.documentElement
      root.classList.toggle('dark', isDark)
      document.body.style.backgroundColor = isDark ? '#09090b' : '#f4f4f5'
    }, [isDark])

    return <Story />
  }
]

export default preview
