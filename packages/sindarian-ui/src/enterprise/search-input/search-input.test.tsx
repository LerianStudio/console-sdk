import { act, fireEvent, render, screen } from '@testing-library/react'
import { SearchInput } from '.'

describe('SearchInput', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('labels the field from the placeholder by default', () => {
    render(<SearchInput value="" onValueChange={jest.fn()} />)
    expect(screen.getByRole('searchbox', { name: 'Search…' })).toHaveValue('')
  })

  it('prefers an explicit aria-label', () => {
    render(
      <SearchInput value="" onValueChange={jest.fn()} aria-label="Find rows" />
    )
    expect(
      screen.getByRole('searchbox', { name: 'Find rows' })
    ).toBeInTheDocument()
  })

  it('updates the visible field immediately but debounces the emission', () => {
    const onValueChange = jest.fn()
    render(
      <SearchInput value="" onValueChange={onValueChange} debounceMs={250} />
    )

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'pix' } })

    expect(input).toHaveValue('pix')
    expect(onValueChange).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(250)
    })
    expect(onValueChange).toHaveBeenCalledWith('pix')
  })

  it('emits only the last keystroke of a burst', () => {
    const onValueChange = jest.fn()
    render(<SearchInput value="" onValueChange={onValueChange} />)

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'p' } })
    fireEvent.change(input, { target: { value: 'pi' } })
    fireEvent.change(input, { target: { value: 'pix' } })

    act(() => {
      jest.advanceTimersByTime(250)
    })
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith('pix')
  })

  it('shows the clear button only when there is text, and clears synchronously', () => {
    const onValueChange = jest.fn()
    const { rerender } = render(
      <SearchInput value="" onValueChange={onValueChange} />
    )
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull()

    rerender(<SearchInput value="pix" onValueChange={onValueChange} />)
    const clear = screen.getByRole('button', { name: 'Clear search' })

    fireEvent.click(clear)
    expect(onValueChange).toHaveBeenCalledWith('')
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('follows an out-of-band value change from the parent', () => {
    const { rerender } = render(
      <SearchInput value="pix" onValueChange={jest.fn()} />
    )
    expect(screen.getByRole('searchbox')).toHaveValue('pix')

    rerender(<SearchInput value="" onValueChange={jest.fn()} />)
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('never fires a pending emission after unmount', () => {
    const onValueChange = jest.fn()
    const { unmount } = render(
      <SearchInput value="" onValueChange={onValueChange} />
    )

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'stale' }
    })
    unmount()

    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
