import { logErrorLine } from './log-error-line'

/**
 * The bound, tested on the function rather than through a caller.
 *
 * Every other assertion of it in this package reads a TOP-LEVEL field of one of
 * the three records this package itself writes, and all three are flat with
 * fixed keys. So a bound narrowed to the top level, or one that never looked at
 * a key at all, passed the whole suite. What reaches here from a consumer is
 * neither flat nor named by us: `describeRequestError` is documented as
 * overridable, and an override that spreads part of an upstream body brings
 * both the depth and the keys with it.
 */
describe('logErrorLine', () => {
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  const recordOf = () => JSON.parse(consoleError.mock.calls[0][1] as string)

  it('writes the label and one physical line', () => {
    logErrorLine('Request error', () => ({ status: 409 }))

    expect(consoleError.mock.calls[0][0]).toBe('Request error')
    expect(consoleError.mock.calls[0][1]).toBe('{"status":409}')
  })

  it('bounds a string value at two thousand characters', () => {
    logErrorLine('Request error', () => ({ detail: 'x'.repeat(5000) }))

    expect(recordOf().detail).toHaveLength(2000)
  })

  // A KEY is text the consumer chose too, and nothing was cutting it: an
  // override that turns an upstream's field map into keys writes them here at
  // whatever length that upstream sent.
  it('bounds a key at two thousand characters', () => {
    logErrorLine('Request error', () => ({ ['K'.repeat(5000)]: 'v' }))

    expect(Object.keys(recordOf())[0]).toHaveLength(2000)
  })

  // Depth, which is the half nothing pinned: the record this package writes is
  // flat, so a top-level-only bound was indistinguishable from this one.
  it('bounds a string three levels down', () => {
    logErrorLine('Request error', () => ({
      upstream: { body: { detail: 'x'.repeat(5000) } }
    }))

    expect(recordOf().upstream.body.detail).toHaveLength(2000)
  })

  it('bounds a key three levels down', () => {
    logErrorLine('Request error', () => ({
      upstream: { body: { ['K'.repeat(5000)]: 'v' } }
    }))

    expect(Object.keys(recordOf().upstream.body)[0]).toHaveLength(2000)
  })

  // Bounding a key means rebuilding the object it belongs to, and an array is
  // an object: rebuilt as one it would reach a collector as `{"0":...}` and
  // stop being a list.
  it('keeps an array a list', () => {
    logErrorLine('Request error', () => ({ errors: ['a', 'b'] }))

    expect(recordOf().errors).toEqual(['a', 'b'])
  })

  // And the one shape where that is not free: an array can carry a named
  // property beside its indices, so the "does anything here need cutting"
  // question can answer yes for an ARRAY. `JSON.stringify` drops such a
  // property from a list; rebuilding the list to bound it would keep the
  // property and lose the list.
  it('keeps an array a list even when it carries an oversized name', () => {
    const errors: string[] & { [key: string]: unknown } = ['a', 'b']
    errors['K'.repeat(5000)] = 'v'

    logErrorLine('Request error', () => ({ errors }))

    expect(recordOf().errors).toEqual(['a', 'b'])
  })

  // Cutting a key can make two keys the SAME key, and an object cannot hold
  // both: the later field wins and the earlier one leaves the record with
  // nothing saying it was there. An upstream field map keyed by long URNs is
  // exactly the shape that shares a prefix, and the bound must not be the
  // reason a field is missing from the last copy of what broke.
  it('keeps both fields when two keys share their first two thousand characters', () => {
    const prefix = 'K'.repeat(2000)

    logErrorLine('Request error', () => ({
      [`${prefix}-first`]: 'a',
      [`${prefix}-second`]: 'b'
    }))

    const written = recordOf()

    expect(Object.keys(written)).toHaveLength(2)
    expect(Object.values(written).sort()).toEqual(['a', 'b'])
    expect(Object.keys(written).every((key) => key.length <= 2000)).toBe(true)
  })

  // The other collision: a key that is already exactly at the ceiling, and an
  // oversized one whose cut lands on it. The one that was never over the
  // ceiling keeps its name; the cut one moves.
  it('keeps both fields when a cut key lands on an existing one', () => {
    const atCeiling = 'K'.repeat(2000)

    logErrorLine('Request error', () => ({
      [atCeiling]: 'a',
      [`${atCeiling}-over`]: 'b'
    }))

    const written = recordOf()

    expect(Object.keys(written)).toHaveLength(2)
    expect(written[atCeiling]).toBe('a')
    expect(Object.values(written).sort()).toEqual(['a', 'b'])
  })

  // The identity of an object that needs no cutting is preserved, which is what
  // lets the serialiser see a cycle as a cycle and refuse it once, instead of
  // recursing through copies.
  it('announces a cyclic record with the reason', () => {
    const cyclic: Record<string, unknown> = { method: 'GET' }
    cyclic.self = cyclic

    logErrorLine('Request error', () => cyclic)

    expect(recordOf().record).toBe('unserialisable')
    expect(recordOf().cause).toContain('Converting circular structure to JSON')
  })
})
