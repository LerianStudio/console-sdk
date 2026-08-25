/**
 * Shared jsdom setup for every package in the monorepo.
 *
 * jsdom ships no ResizeObserver, and Radix (scroll-area, radio-group,
 * hover-card, …) plus @tanstack/react-virtual construct one on mount. Without
 * it those components throw before rendering anything. Defined once here so
 * test files stop re-stubbing it copy by copy.
 *
 * A no-op is the right stub: jsdom has no layout engine, so a faithful
 * implementation would report zero-sized boxes anyway. Tests that need real
 * measurements stub offsetWidth/offsetHeight themselves.
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

export {}
