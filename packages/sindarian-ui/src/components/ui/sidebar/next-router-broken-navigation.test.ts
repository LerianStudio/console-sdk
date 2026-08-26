/**
 * The failure warning must name the entry that ACTUALLY failed.
 *
 * Both `next/link` and `next/navigation` are required inside one try block, and
 * the message said "next/link" unconditionally — so a broken `next/navigation`
 * sent whoever read the warning to inspect the wrong module.
 *
 * `next/link` is left to load normally here; only `next/navigation` breaks, and
 * with a missing INNER dependency (not itself), which is the broken-install shape
 * the warning exists for.
 */
jest.mock('next/navigation', () => {
  throw new Error("Cannot find module 'next/dist/client/components/navigation'")
})

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadNextRouter } = require('./next-router.cjs')

describe('loadNextRouter when next/navigation is the broken entry', () => {
  it('names next/navigation, not next/link', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})

    expect(loadNextRouter()).toBeNull()

    expect(warn).toHaveBeenCalledTimes(1)
    const message = String(warn.mock.calls[0][0])
    expect(message).toContain('next/navigation failed to load')
    expect(message).not.toContain('next/link failed to load')

    warn.mockRestore()
  })
})
