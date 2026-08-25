import { act, renderHook } from '@testing-library/react'
import { useIsMobile } from './use-is-mobile'

type Listener = () => void

function mockMatchMedia() {
  const listeners = new Set<Listener>()
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: window.innerWidth < 768,
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
