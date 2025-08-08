import { Meta, StoryObj } from '@storybook/nextjs'
import { Pagination } from '.'

const meta: Meta = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: {
    backgrounds: {
      default: 'Light'
    }
  },
  argTypes: {}
}

export default meta

export const Primary: StoryObj = {
  args: {
    page: 1,
    limit: 10,
    total: 100,
    setLimit: () => {},
    setPage: () => {},
    nextPage: () => {},
    previousPage: () => {},
    previousLabel: 'Previous',
    nextLabel: 'Next'
  },
  render: (args) => (
    <Pagination
      page={0}
      limit={0}
      setLimit={() => {}}
      setPage={() => {}}
      nextPage={() => {}}
      previousPage={() => {}}
      {...args}
    />
  )
}
