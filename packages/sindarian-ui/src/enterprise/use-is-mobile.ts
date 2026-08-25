'use client'

import * as React from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * True while the viewport is narrower than the 768px mobile breakpoint.
 *
 * Always false on the FIRST render, server and client alike, so a narrow
 * viewport can never produce a hydration mismatch; the effect corrects it
 * before paint. Every reading comes from the media query itself rather than a
 * mix of `matchMedia` and `window.innerWidth`, so the initial value and the
 * change events can never disagree at the breakpoint boundary.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return isMobile
}
