/**
 * The development warning in `next-router.cjs` has to fire for exactly ONE
 * situation: `next` is installed, but loading it fails because something INSIDE
 * it is missing. That is a broken install, and it silently downgrades the Console
 * to plain anchors and full page loads.
 *
 * The silent counterpart — `next` simply absent, every Vite consumer — is covered
 * by `sidebar-router-no-next.test.tsx`, which mocks the two entries to report
 * themselves as not found.
 *
 * Here the mock throws for a DIFFERENT module, which is what a missing inner
 * dependency looks like. `next` itself is installed in this repo, so this is the
 * genuine broken-install shape.
 */
jest.mock('next/link', () => {
  throw new Error("Cannot find module 'styled-jsx/style'")
})

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadNextRouter } = require('./next-router.cjs')

describe('loadNextRouter on a broken next install', () => {
  it('falls back and says so in development', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    expect(loadNextRouter()).toBeNull()

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('next is installed but next/link failed to load'),
      expect.objectContaining({
        message: expect.stringContaining('styled-jsx/style')
      })
    )

    warn.mockRestore()
  })

  it('stays silent in production, where the warning would be noise', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const previous = process.env.NODE_ENV

    try {
      process.env.NODE_ENV = 'production'
      expect(loadNextRouter()).toBeNull()
      expect(warn).not.toHaveBeenCalled()
    } finally {
      process.env.NODE_ENV = previous
      warn.mockRestore()
    }
  })
})
