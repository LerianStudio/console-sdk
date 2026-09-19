import type { Decorator, Preview } from '@storybook/nextjs'
import { useLayoutEffect } from 'react'
import { INITIAL_VIEWPORTS, MINIMAL_VIEWPORTS } from 'storybook/viewport'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import '../src/globals.css'
import './storybook.css'

dayjs.extend(relativeTime)

const preview: Preview = {
  parameters: {
    /**
     * ⛔ AN UNKNOWN VIEWPORT KEY IS NOT AN ERROR, IT IS `mobile1`.
     *
     * The manager resolves `options[value] ?? options[keys[0]]`, and `options`
     * defaults to `MINIMAL_VIEWPORTS` — four keys, `mobile1` first. So a story
     * asking for a device name it believes in, `iphone12`, silently opened at
     * 320x568 with "Small mobile" in the toolbar. Two stories written to
     * demonstrate a 390px phone opened at the 320px case their own docblocks
     * held up as the counterexample.
     *
     * Both families are registered, not one: the device list does not contain
     * `mobile1`..`desktop`, so replacing rather than merging would have moved
     * the three sidebar stories that name `mobile1` onto the same silent
     * fallback, pointing the other way.
     */
    viewport: {
      options: { ...INITIAL_VIEWPORTS, ...MINIMAL_VIEWPORTS }
    },
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

export const decorators: Decorator[] = [
  (Story, context) => {
    const background = context.globals?.backgrounds?.value
    const isDark = background === 'dark' || background === '#09090b'

    useLayoutEffect(() => {
      const root = document.documentElement
      root.classList.toggle('dark', isDark)
      document.body.style.backgroundColor = isDark ? '#09090b' : '#f4f4f5'
    }, [isDark])

    return <Story />
  }
]

export default preview
