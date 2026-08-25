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

  it('keeps keystrokes typed while the parent echoes an earlier emission', () => {
    // The lost-keystroke race: emit "pi", parent echoes value="pi" one render
    // later, but the user has already typed "pix". Syncing the draft to that
    // echo would rewind the field to "pi" and drop the "x".
    const onValueChange = jest.fn()
    const { rerender } = render(
      <SearchInput value="" onValueChange={onValueChange} debounceMs={250} />
    )

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'pi' } })

    act(() => {
      jest.advanceTimersByTime(250)
    })
    expect(onValueChange).toHaveBeenLastCalledWith('pi')

    // User types on before the parent's re-render lands.
    fireEvent.change(input, { target: { value: 'pix' } })
    // Parent now echoes the earlier emission.
    rerender(
      <SearchInput value="pi" onValueChange={onValueChange} debounceMs={250} />
    )

    expect(input).toHaveValue('pix')

    act(() => {
      jest.advanceTimersByTime(250)
    })
    expect(onValueChange).toHaveBeenLastCalledWith('pix')
  })

  it('restores the draft when the parent cycles back to the initial value', () => {
    // foo -> bar -> foo. Seeding the echo token with the INITIAL value would
    // make the return to "foo" look like an echo and strand the draft on "bar".
    const { rerender } = render(
      <SearchInput value="foo" onValueChange={jest.fn()} />
    )
    expect(screen.getByRole('searchbox')).toHaveValue('foo')

    rerender(<SearchInput value="bar" onValueChange={jest.fn()} />)
    expect(screen.getByRole('searchbox')).toHaveValue('bar')

    rerender(<SearchInput value="foo" onValueChange={jest.fn()} />)
    expect(screen.getByRole('searchbox')).toHaveValue('foo')
  })

  it('consumes the echo token so a later external change to the same text lands', () => {
    const onValueChange = jest.fn()
    const { rerender } = render(
      <SearchInput value="" onValueChange={onValueChange} />
    )

    const input = screen.getByRole('searchbox')
    fireEvent.change(input, { target: { value: 'pix' } })
    act(() => {
      jest.advanceTimersByTime(250)
    })
    expect(onValueChange).toHaveBeenLastCalledWith('pix')

    // Parent echoes our emission — draft must not be disturbed.
    rerender(<SearchInput value="pix" onValueChange={onValueChange} />)
    expect(input).toHaveValue('pix')

    // Parent resets, then externally sets the SAME text again. That second
    // "pix" is a genuine external change, not a stale echo.
    rerender(<SearchInput value="" onValueChange={onValueChange} />)
    expect(input).toHaveValue('')

    rerender(<SearchInput value="pix" onValueChange={onValueChange} />)
    expect(input).toHaveValue('pix')
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
