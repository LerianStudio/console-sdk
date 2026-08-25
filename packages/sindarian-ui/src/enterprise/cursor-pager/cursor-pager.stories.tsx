import { Meta, StoryObj } from '@storybook/nextjs'
import { CursorPager, CursorPagerProps } from '.'

const meta: Meta<CursorPagerProps> = {
  title: 'Enterprise/CursorPager',
  component: CursorPager,
  // `onCursorChange` is required, so every story needs one. Defaulting it here
  // keeps each story to the props it is actually demonstrating.
  args: { onCursorChange: () => {} },
  argTypes: {
    disabled: { control: 'boolean' },
    hasMore: { control: 'boolean' }
  }
}

export default meta

export const MidList: StoryObj<CursorPagerProps> = {
  args: {
    prevCursor: 'cursor_prev',
    nextCursor: 'cursor_next',
    hasMore: true,
    summary: 'Showing 21 to 40'
  }
}

export const FirstPage: StoryObj<CursorPagerProps> = {
  args: { prevCursor: null, nextCursor: 'cursor_next', hasMore: true }
}

export const LastPage: StoryObj<CursorPagerProps> = {
  args: { prevCursor: 'cursor_prev', nextCursor: null, hasMore: false }
}

export const Fetching: StoryObj<CursorPagerProps> = {
  args: {
    prevCursor: 'cursor_prev',
    nextCursor: 'cursor_next',
    hasMore: true,
    disabled: true,
    summary: 'Loading…'
  }
}

export const LocalizedLabels: StoryObj<CursorPagerProps> = {
  args: {
    prevCursor: 'cursor_prev',
    nextCursor: 'cursor_next',
    hasMore: true,
    previousLabel: 'Anterior',
    nextLabel: 'Próxima',
    summary: '50 por página'
  }
}
