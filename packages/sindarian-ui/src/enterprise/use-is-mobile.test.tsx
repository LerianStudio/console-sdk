import { act, renderHook } from '@testing-library/react'
import { MOBILE_BREAKPOINT, useIsMobile } from './use-is-mobile'

type Listener = () => void

/**
 * `matches` is a LIVE getter, exactly like the real MediaQueryList: the hook
 * must read it at event time, not capture a snapshot taken when the query was
 * created.
 */
function mockMatchMedia() {
  const listeners = new Set<Listener>()
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    get matches() {
      return window.innerWidth < 768
    },
    media: query,
    addEventListener: (_: string, cb: Listener) => listeners.add(cb),
    removeEventListener: (_: string, cb: Listener) => listeners.delete(cb)
  }))
  return {
    resize(width: number) {
      window.innerWidth = width
      act(() => {
        listeners.forEach((cb) => cb())
      })
    },
    get listenerCount() {
      return listeners.size
    }
  }
}

describe('useIsMobile', () => {
  const originalWidth = window.innerWidth

  afterEach(() => {
    window.innerWidth = originalWidth
  })

  it('subscribes at the query built from MOBILE_BREAKPOINT', () => {
    // The mock derives `matches` from its own hardcoded 768, not from the query
    // it receives — so every breakpoint test below would keep passing if the
    // hook stopped using MOBILE_BREAKPOINT. This is the one assertion that ties
    // the mock to the query the hook actually subscribes at.
    window.innerWidth = 1280
    mockMatchMedia()

    renderHook(() => useIsMobile())

    expect(window.matchMedia).toHaveBeenCalledWith(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`
    )
  })

  it('is false on a desktop-width viewport', () => {
    window.innerWidth = 1280
    mockMatchMedia()

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('is true below the 768px breakpoint', () => {
    window.innerWidth = 500
    mockMatchMedia()

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('treats exactly 768px as desktop', () => {
    window.innerWidth = 768
    mockMatchMedia()

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('renders false before the effect runs, even on a narrow viewport', () => {
    // Hydration safety: the server has no viewport, so the first client render
    // must match its `false` regardless of how narrow the window actually is.
    window.innerWidth = 400
    mockMatchMedia()

    let firstRender: boolean | undefined
    renderHook(() => {
      const value = useIsMobile()
      firstRender ??= value
      return value
    })

    expect(firstRender).toBe(false)
  })

  it('resolves from the media query, not window.innerWidth', () => {
    // Diverge the two sources: matchMedia says mobile, innerWidth says desktop.
    // The hook must follow the media query it subscribed to.
    window.innerWidth = 1280
    const listeners = new Set<Listener>()
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: (_: string, cb: Listener) => listeners.add(cb),
      removeEventListener: (_: string, cb: Listener) => listeners.delete(cb)
    }))

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('tracks viewport changes', () => {
    window.innerWidth = 1280
    const media = mockMatchMedia()

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    media.resize(400)
    expect(result.current).toBe(true)

    media.resize(1024)
    expect(result.current).toBe(false)
  })

  it('detaches its listener on unmount', () => {
    window.innerWidth = 1280
    const media = mockMatchMedia()

    const { unmount } = renderHook(() => useIsMobile())
    expect(media.listenerCount).toBe(1)

    unmount()
    expect(media.listenerCount).toBe(0)
  })
})
