import { Meta, StoryObj } from '@storybook/nextjs'
import { Breadcrumb } from '.'

/**
 * The composed breadcrumb — the one every console page renders, from a `paths`
 * array rather than hand-assembled primitives.
 *
 * It decides two things the caller does not have to: a separator goes BETWEEN
 * crumbs and never after the last, and the last crumb is the current page
 * (`aria-current="page"`, rendered as text) whether or not the caller gave it
 * an href. Both used to be the caller's problem, and both shipped wrong.
 */
const meta: Meta<typeof Breadcrumb> = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb
}

export default meta

export const Primary: StoryObj<typeof Breadcrumb> = {
  args: {
    paths: [
      { name: 'Reporter', href: '#reporter' },
      { name: 'Reports', href: '#reports' },
      { name: 'Overview', href: '#overview' }
    ]
  }
}

/**
 * A single crumb renders no separator at all.
 */
export const SingleCrumb: StoryObj<typeof Breadcrumb> = {
  args: {
    paths: [{ name: 'Reporter', href: '#reporter' }]
  }
}

/**
 * An ancestor with no href is plain text and is NOT the current page; only the
 * last crumb carries `aria-current`.
 */
export const GroupingAncestor: StoryObj<typeof Breadcrumb> = {
  args: {
    paths: [
      { name: 'Plugins' },
      { name: 'Reporter', href: '#reporter' },
      { name: 'Overview' }
    ]
  }
}
