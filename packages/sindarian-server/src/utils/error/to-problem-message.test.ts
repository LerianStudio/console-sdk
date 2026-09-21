import {
  readWireField,
  readWireStatus,
  toProblemMessage
} from './to-problem-message'

// The only thing standing between an upstream's free text and the sentence
// `getResponse()` serialises to the browser. Every row here is a body shape
// that reached it, or a bound that something downstream relies on.
describe('toProblemMessage', () => {
  const fallback = 'Upstream error body carried no problem details (status 500)'

  describe('a parsed problem body', () => {
    it('takes the title', () => {
      expect(toProblemMessage({ title: 'Conflict' }, fallback)).toBe('Conflict')
    })

    it('prefers the title over the code', () => {
      expect(
        toProblemMessage({ title: 'Conflict', code: '0042' }, fallback)
      ).toBe('Conflict')
    })

    // An upstream that renders an empty `title` used to produce the message
    // '', and an exception filter showing `message || 'Internal server error'`
    // then told the user an expired token was a server fault.
    it('falls through an empty title to the code', () => {
      expect(
        toProblemMessage({ title: '', code: 'TOKEN_EXPIRED' }, fallback)
      ).toBe('TOKEN_EXPIRED')
    })

    it('uses the fallback when title and code are both empty', () => {
      expect(toProblemMessage({ title: '', code: '' }, fallback)).toBe(fallback)
    })

    // A non-string code is not a classification, and interpolating it would
    // throw inside `cap()` one frame up.
    it('uses the fallback for a non-string code', () => {
      expect(toProblemMessage({ code: 123 }, fallback)).toBe(fallback)
    })

    it('uses the fallback for a non-string title', () => {
      expect(toProblemMessage({ title: { en: 'Conflict' } }, fallback)).toBe(
        fallback
      )
    })

    it('caps an unbounded code at 200 characters', () => {
      expect(
        toProblemMessage({ code: 'c'.repeat(4000) }, fallback)
      ).toHaveLength(200)
    })

    it('caps an unbounded title at 200 characters', () => {
      expect(
        toProblemMessage({ title: 'T'.repeat(4000) }, fallback)
      ).toHaveLength(200)
    })

    it('uses the fallback when the body classifies nothing', () => {
      expect(
        toProblemMessage({ detail: 'cpf 123.456.789-00 not found' }, fallback)
      ).toBe(fallback)
    })
  })

  describe('a bare string', () => {
    it('is returned as written', () => {
      expect(toProblemMessage('Signing artifact expired', fallback)).toBe(
        'Signing artifact expired'
      )
    })

    // Not the 200 a classification field gets: the BFF writes its own messages
    // through here too, and `ValidationApiException` aggregates every Zod issue
    // of a rejected form into one legitimately long sentence. 200 would cut it
    // off mid-field. 2000 is a ceiling against an unbounded string, not a bound
    // on a message we wrote.
    it('survives intact at 1500 characters', () => {
      expect(toProblemMessage('m'.repeat(1500), fallback)).toHaveLength(1500)
    })

    it('is capped at 2000 characters', () => {
      expect(toProblemMessage('m'.repeat(5000), fallback)).toHaveLength(2000)
    })

    it('uses the fallback when empty', () => {
      expect(toProblemMessage('', fallback)).toBe(fallback)
    })
  })

  // Three live Console transports do `throw new ServiceUnavailableApiException(
  // error)` from a `catch (error: any)` — midaz-http-service.ts:248,286 and
  // btg-http-service.ts:211. Returning the Error's own message serialised
  // `fetch failed: connect ECONNREFUSED 10.0.0.5:8080` straight to the browser.
  describe('an Error', () => {
    it('never lends its message to the wire', () => {
      expect(
        toProblemMessage(
          new TypeError('fetch failed: connect ECONNREFUSED 10.0.0.5:8080'),
          fallback
        )
      ).toBe(fallback)
    })

    it('gives nothing up through a subclass either', () => {
      class UpstreamError extends Error {}

      expect(
        toProblemMessage(
          new UpstreamError('db-primary.internal:5432'),
          fallback
        )
      ).toBe(fallback)
    })
  })

  describe('nothing usable at all', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['an array', []],
      ['a number', 502],
      ['a boolean', false]
    ])('uses the fallback for %s', (_label, value) => {
      expect(toProblemMessage(value, fallback)).toBe(fallback)
    })
  })
})

// The band a response may actually be built with, pinned on the function
// rather than through a frame: every caller of it answers a Response, and both
// frames that read a status mock `NextResponse.json` in their own tests, so
// nothing there can refuse a status the runtime refuses.
describe('readWireStatus', () => {
  const statusOf = (status: unknown) =>
    readWireStatus({ getStatus: () => status })

  // Both ends of the band, so an off-by-one on either side is a red test. 600
  // is the likeliest wrong value after 700, being just past the end, and it
  // was the one value no case covered.
  it.each([[200], [404], [599]])('answers %s as it is given', (status) =>
    expect(statusOf(status)).toBe(status)
  )

  // A number a Response refuses, whichever way it refuses it. 199 and 600 are
  // outside the range and raise a `RangeError`; 204, 205 and 304 are inside it
  // and raise a `TypeError` the moment a body is attached, which is the failure
  // one frame later and the one the range check cannot see. A fraction is a
  // number no status line has, and it is what `Number.isInteger` is for.
  it.each([[199], [600], [204], [205], [304], [0], [700], [NaN], [404.5]])(
    'answers 500 for the unusable status %s',
    (status) => expect(statusOf(status)).toBe(500)
  )

  it.each([
    ['a string', '404'],
    ['undefined', undefined],
    ['null', null]
  ])('answers 500 for %s', (_label, status) =>
    expect(statusOf(status)).toBe(500)
  )

  // The accessor belongs to a subclass, so it may not be there and it may
  // throw. Neither costs the route its response.
  it('answers 500 when getStatus throws', () => {
    expect(
      readWireStatus({
        getStatus: () => {
          throw new Error('trap')
        }
      })
    ).toBe(500)
  })

  it('answers 500 when there is no getStatus at all', () => {
    expect(readWireStatus({})).toBe(500)
  })
})

// The guarded single read every other field reader in this package is built on
// (`readWireMessage`, and `ApiException.readWireClassification` for `code` and
// `title`), pinned here on its own for the first time. Its DEFAULT rule is the
// classification rule, which no test reached: the `text` rule is the one
// `readWireMessage` passes, so every branch below was asserted only by
// accident of a caller, or not at all.
describe('readWireField', () => {
  const limit = 200

  it('returns a string as written', () => {
    expect(readWireField(() => 'TOKEN_EXPIRED', limit)).toBe('TOKEN_EXPIRED')
  })

  // A pg `INT` error-code column and a driver's `bigint` are what the `any` a
  // database row carries actually is, and `{"code":5}` served a caller
  // perfectly well before this package read the field at all. Substituting for
  // them would destroy a value that was fine and name it nowhere.
  it.each([
    { label: 'a number', value: 5, text: '5' },
    { label: 'a bigint', value: 9007199254740993n, text: '9007199254740993' },
    { label: 'a boolean', value: false, text: 'false' },
    { label: 'NaN', value: NaN, text: 'NaN' },
    { label: 'Infinity', value: Infinity, text: 'Infinity' }
  ])('answers $label as it is spelled', ({ value, text }) => {
    expect(readWireField(() => value, limit)).toBe(text)
  })

  // A value whose text would be a SERIALISATION of something else: `String({})`
  // is `[object Object]`, `String(['a'])` is `a`, a function stringifies to its
  // own source. Those are the shapes an upstream body arrives as, and the
  // defect this reader exists for.
  it.each([
    { label: 'an object', value: { en: 'Conflict' } },
    { label: 'an array', value: ['0042'] },
    { label: 'a function', value: () => '0042' },
    { label: 'a symbol', value: Symbol('0042') },
    { label: 'null', value: null },
    { label: 'undefined', value: undefined }
  ])('answers nothing for $label', ({ value }) => {
    expect(readWireField(() => value, limit)).toBeUndefined()
  })

  it('cuts a string at the limit the caller names', () => {
    expect(readWireField(() => 'c'.repeat(4000), limit)).toHaveLength(limit)
  })

  // Every caller is the last frame before a body, and a throw here escapes the
  // request pipeline: the route answers a zero-byte body with no content-type.
  it('answers nothing when the read throws, and does not propagate', () => {
    const source = {
      get code(): string {
        throw new Error('trap')
      }
    }

    expect(readWireField(() => source.code, limit)).toBeUndefined()
  })

  // The whole point of the function: a check on one read and a use of another
  // is not a guard. A `message` getter answering a sentence first and an object
  // second passed a `typeof` and handed the object over.
  it('reads the value exactly once', () => {
    const read = jest.fn(() => 'TOKEN_EXPIRED')

    readWireField(read, limit)

    expect(read).toHaveBeenCalledTimes(1)
  })

  it('lets the caller replace the rule', () => {
    const text = (value: unknown) => typeof value === 'string'

    expect(readWireField(() => 5, limit, text)).toBeUndefined()
    expect(readWireField(() => 'a sentence', limit, text)).toBe('a sentence')
  })
})
