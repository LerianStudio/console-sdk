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

  // Asking whether a key needs cutting is a question about the KEY, and the
  // values in a record are a consumer's: `describeRequestError` may return a
  // class instance or a lazily computed field. Reading them to measure their
  // names ran every accessor twice, on the error path, for a question none of
  // them answers.
  it('reads a record value once on the path that cuts nothing', () => {
    let reads = 0
    const record = {
      get upstream() {
        reads++

        return { status: 409 }
      }
    }

    logErrorLine('Request error', () => record)

    expect(recordOf().upstream).toEqual({ status: 409 })
    expect(reads).toBe(1)
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

  // The mark is what makes a cut key unique, and it must not become the reason
  // the key is over the ceiling: a record whose keys are an upstream's own can
  // occupy the first candidates deliberately, and a mark that grows by one
  // character per retry would eventually push the cut past the bound this
  // whole function exists to hold.
  it('keeps every cut key within the ceiling when it has to retry', () => {
    const prefix = 'K'.repeat(5000)
    const withMark = (mark: string) =>
      prefix.slice(0, 2000 - mark.length) + mark

    // The oversized key is the third entry, so its first candidate carries the
    // mark `~2`, and the two before it are sitting on that name and the next.
    logErrorLine('Request error', () => ({
      [withMark('~2')]: 'a',
      [withMark('~2.1')]: 'b',
      [prefix]: 'c'
    }))

    const written = recordOf()

    expect(Object.keys(written)).toHaveLength(3)
    expect(Object.keys(written).every((key) => key.length <= 2000)).toBe(true)
    expect(Object.values(written).sort()).toEqual(['a', 'b', 'c'])
  })

  // And the adversarial version of it, because the keys of this record can be
  // an upstream's own: a body that occupies two thousand candidates in a row
  // forces the mark to keep growing, and a mark that grows one character at a
  // time eventually leaves no room for the key at all. Measured on the
  // one-character growth this started as, the emitted key was 7000 characters
  // long, inside the writer whose whole job is that one bad upstream cannot
  // fill a log sink.
  it('holds the ceiling against a record that occupies the candidates', () => {
    const prefix = 'K'.repeat(5000)
    const withMark = (mark: string) =>
      prefix.slice(0, 2000 - mark.length) + mark
    const record: Record<string, unknown> = {}
    const seeds = 2100

    // The oversized key goes in LAST, so its index is the seed count and every
    // name it reaches for is built from `~4200`. Both retry sequences are
    // occupied: the decimal one this counts in today, so the bounded path is
    // walked to its end rather than once, and the one-character-per-retry one
    // it used to count in, so this case stays red on that implementation.
    for (let attempt = 1; attempt <= seeds; attempt++) {
      record[withMark(`~${seeds * 2}.${attempt}`)] = attempt
    }

    let legacy = `~${seeds * 2}`
    for (let taken = 0; taken < seeds; taken++) {
      record[withMark(legacy)] = taken
      legacy += '~'
    }

    record[prefix] = 'the oversized one'

    logErrorLine('Request error', () => record)

    const written = recordOf()
    const longest = Object.keys(written).reduce(
      (worst, key) => Math.max(worst, key.length),
      0
    )

    expect(longest).toBe(2000)
    expect(Object.keys(written)).toHaveLength(seeds * 2 + 1)
    expect(Object.values(written)).toContain('the oversized one')
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

  // A record builder is a consumer's code, and a consumer may throw anything.
  // A bare `throw 'payer missing from body'` carries no `message` at all, and
  // the name of its TYPE is not a reason: this line is the only sentence that
  // says why the fields are missing, so it carries what was thrown.
  it('names what a record builder threw when it was not an Error', () => {
    logErrorLine('Request error', (): Record<string, unknown> => {
      throw 'payer missing from body'
    })

    expect(recordOf().record).toBe('unserialisable')
    expect(recordOf().cause).toBe('payer missing from body')
  })

  // And it is a string this package did not size either.
  it('bounds what a record builder threw', () => {
    logErrorLine('Request error', (): Record<string, unknown> => {
      throw 'x'.repeat(1_000_000)
    })

    expect(recordOf().cause).toHaveLength(2000)
  })
})
