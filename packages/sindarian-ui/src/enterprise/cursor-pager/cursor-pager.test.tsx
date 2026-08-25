import { fireEvent, render, screen } from '@testing-library/react'
import { CursorPager } from '.'

describe('CursorPager', () => {
  it.each([
    {
      name: 'both cursors available',
      props: { prevCursor: 'previous', nextCursor: 'next', hasMore: true },
      disabled: [false, false]
    },
    {
      name: 'missing previous cursor',
      props: { prevCursor: null, nextCursor: 'next', hasMore: true },
      disabled: [true, false]
    },
    {
      name: 'missing next cursor',
      props: { prevCursor: 'previous', nextCursor: null, hasMore: true },
      disabled: [false, true]
    },
    {
      name: 'hasMore is false',
      props: { prevCursor: 'previous', nextCursor: 'next', hasMore: false },
      disabled: [false, true]
    },
    {
      name: 'pager disabled',
      props: {
        prevCursor: 'previous',
        nextCursor: 'next',
        hasMore: true,
        disabled: true
      },
      disabled: [true, true]
    }
  ])('implements the enablement truth table: $name', ({ props, disabled }) => {
    render(<CursorPager {...props} onCursorChange={jest.fn()} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    expect(buttons.map((button) => button.hasAttribute('disabled'))).toEqual(
      disabled
    )
  })

  it('emits the previous and next cursors', () => {
    const onCursorChange = jest.fn()
    render(
      <CursorPager
        prevCursor="prev-token"
        nextCursor="next-token"
        hasMore
        onCursorChange={onCursorChange}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Previous/ }))
    expect(onCursorChange).toHaveBeenCalledWith('prev-token')

    fireEvent.click(screen.getByRole('button', { name: /Next/ }))
    expect(onCursorChange).toHaveBeenCalledWith('next-token')
  })

  it('renders the summary and custom button labels', () => {
    render(
      <CursorPager
        prevCursor="previous"
        nextCursor="next"
        hasMore
        summary="Showing settlements 21 to 40"
        previousLabel="Newer settlements"
        nextLabel="Older settlements"
        onCursorChange={jest.fn()}
      />
    )

    expect(screen.getByText('Showing settlements 21 to 40')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Newer settlements/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Older settlements/ })
    ).toBeInTheDocument()
  })

  it('renders the default navigation labels', () => {
    render(
      <CursorPager
        prevCursor={null}
        nextCursor={null}
        hasMore={false}
        onCursorChange={jest.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /Previous/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next/ })).toBeInTheDocument()
  })
})
