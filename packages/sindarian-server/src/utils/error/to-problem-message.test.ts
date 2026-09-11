import { toProblemMessage } from './to-problem-message'

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
