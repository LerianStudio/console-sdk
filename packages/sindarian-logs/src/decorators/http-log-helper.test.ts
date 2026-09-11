import { logHttpEvent } from './http-log-helper'
import { LoggerAggregator } from '@/aggregator/logger-aggregator'

describe('logHttpEvent', () => {
  let mockLogger: jest.Mocked<
    Pick<LoggerAggregator, 'info' | 'error' | 'warn' | 'debug' | 'audit'>
  >

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      audit: jest.fn()
    }
  })

  describe('onBeforeFetch', () => {
    it('should log request method and URL', () => {
      const request = new Request('https://api.example.com/users', {
        method: 'POST'
      })

      logHttpEvent(mockLogger as any, 'UserService', 'onBeforeFetch', [request])

      expect(mockLogger.info).toHaveBeenCalledWith(
        'UserService.onBeforeFetch',
        'POST https://api.example.com/users'
      )
    })

    it('should not log if first arg is not a Request', () => {
      logHttpEvent(mockLogger as any, 'Svc', 'onBeforeFetch', ['not-request'])

      expect(mockLogger.info).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('onAfterFetch', () => {
    it('should log info for successful responses', () => {
      const request = new Request('https://api.example.com/users', {
        method: 'GET'
      })
      const response = new Response(null, { status: 200 })

      logHttpEvent(mockLogger as any, 'UserService', 'onAfterFetch', [
        request,
        response
      ])

      expect(mockLogger.info).toHaveBeenCalledWith(
        'UserService.onAfterFetch',
        'GET https://api.example.com/users → 200'
      )
    })

    it('should log error for failed responses', () => {
      const request = new Request('https://api.example.com/users', {
        method: 'GET'
      })
      const response = new Response(null, { status: 500 })

      logHttpEvent(mockLogger as any, 'UserService', 'onAfterFetch', [
        request,
        response
      ])

      expect(mockLogger.error).toHaveBeenCalledWith(
        'UserService.onAfterFetch',
        'GET https://api.example.com/users → 500'
      )
    })

    it('should not log if second arg is not a Response', () => {
      const request = new Request('https://api.example.com/users')

      logHttpEvent(mockLogger as any, 'Svc', 'onAfterFetch', [
        request,
        'not-response'
      ])

      expect(mockLogger.info).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })

  describe('catch', () => {
    it('should log error with message from error object', () => {
      const request = new Request('https://api.example.com/users', {
        method: 'POST'
      })
      const response = new Response(null, { status: 500 })
      const error = { message: 'Internal Server Error' }

      logHttpEvent(mockLogger as any, 'UserService', 'catch', [
        request,
        response,
        error
      ])

      expect(mockLogger.error).toHaveBeenCalledWith(
        'UserService.catch',
        'POST https://api.example.com/users → 500: Internal Server Error'
      )
    })

    // Was `stringContaining('VALIDATION_ERROR')`, which passed for the bare
    // identifier AND for the whole serialised body, so it could not see the
    // difference between the two. The exact string is what makes it see.
    it('falls back to the identifier alone when the body has no message', () => {
      const request = new Request('https://api.example.com/users', {
        method: 'GET'
      })
      const response = new Response(null, { status: 400 })
      const error = { code: 'VALIDATION_ERROR' }

      logHttpEvent(mockLogger as any, 'UserService', 'catch', [
        request,
        response,
        error
      ])

      expect(mockLogger.error).toHaveBeenCalledWith(
        'UserService.catch',
        'GET https://api.example.com/users → 400: VALIDATION_ERROR'
      )
    })

    it('keeps an unnamed body out of the line entirely', () => {
      const request = new Request('https://api.example.com/users', {
        method: 'POST'
      })
      const response = new Response(null, { status: 502 })
      // Markers, not PAN- and CPF-shaped literals. The case asserts the exact
      // line, so the planted values only have to be findable; a card-shaped
      // number here is a standing SAST false positive for somebody to triage
      // forever.
      const error = {
        fields: {
          cardNumber: 'card-number-must-not-log',
          taxId: 'tax-id-must-not-log'
        },
        queryParams: { status: 'must be one of: OPEN, CLOSED' }
      }

      logHttpEvent(mockLogger as any, 'UserService', 'catch', [
        request,
        response,
        error
      ])

      expect(mockLogger.error).toHaveBeenCalledWith(
        'UserService.catch',
        'POST https://api.example.com/users → 502'
      )

      const logged = JSON.stringify(mockLogger.error.mock.calls)
      expect(logged).not.toContain('card-number-must-not-log')
      expect(logged).not.toContain('tax-id-must-not-log')
    })

    it('reaches for the identifier when the message is present but empty', () => {
      const request = new Request('https://api.example.com/users', {
        method: 'PUT'
      })
      const response = new Response(null, { status: 422 })
      const error = { message: '', code: 'VALIDATION_ERROR' }

      logHttpEvent(mockLogger as any, 'UserService', 'catch', [
        request,
        response,
        error
      ])

      expect(mockLogger.error).toHaveBeenCalledWith(
        'UserService.catch',
        'PUT https://api.example.com/users → 422: VALIDATION_ERROR'
      )
    })

    // `HttpService` hands a `text/plain` upstream body over as `{ text }`, and
    // that key is chosen precisely because no transport reads it. Reading it
    // here would re-open the leak in every service that inherits the hook, so
    // the absence is the contract, not an oversight.
    it('never reaches for the text a plain-text body arrives under', () => {
      const request = new Request('https://api.example.com/v1/accounts', {
        method: 'GET'
      })
      const response = new Response(null, { status: 401 })
      const error = {
        text: 'token expired for cpf 123.456.789-00 at db-primary.internal:5432'
      }

      logHttpEvent(mockLogger as any, 'UserService', 'catch', [
        request,
        response,
        error
      ])

      expect(mockLogger.error).toHaveBeenCalledWith(
        'UserService.catch',
        'GET https://api.example.com/v1/accounts → 401'
      )

      const logged = JSON.stringify(mockLogger.error.mock.calls)
      expect(logged).not.toContain('cpf')
      expect(logged).not.toContain('123.456')
      expect(logged).not.toContain('db-primary')
    })
  })

  // The logged URL is the destination, never the payload. A query string on an
  // upstream call carries whatever the caller filtered by — a tax id, a document
  // number, a cursor — and these four log lines are emitted by every service that
  // inherits the hooks, so a service cannot opt out of the leak.
  describe('query strings', () => {
    const NOISY = 'https://api.example/v1/x?taxId=123.456.789-00&cursor=abc'

    const assertNoQuery = (call: unknown) => {
      const logged = JSON.stringify(call)
      expect(logged).not.toContain('taxId')
      expect(logged).not.toContain('123.456')
      expect(logged).not.toContain('cursor=')
    }

    it('keeps the query string out of the outgoing request line', () => {
      logHttpEvent(mockLogger as any, 'UserService', 'onBeforeFetch', [
        new Request(NOISY, { method: 'POST' })
      ])

      expect(mockLogger.info).toHaveBeenCalledWith(
        'UserService.onBeforeFetch',
        'POST https://api.example/v1/x'
      )
      assertNoQuery(mockLogger.info.mock.calls)
    })

    it('keeps the query string out of a successful response line', () => {
      logHttpEvent(mockLogger as any, 'UserService', 'onAfterFetch', [
        new Request(NOISY, { method: 'GET' }),
        new Response(null, { status: 200 })
      ])

      expect(mockLogger.info).toHaveBeenCalledWith(
        'UserService.onAfterFetch',
        'GET https://api.example/v1/x → 200'
      )
      assertNoQuery(mockLogger.info.mock.calls)
    })

    it('keeps the query string out of a failed response line', () => {
      logHttpEvent(mockLogger as any, 'UserService', 'onAfterFetch', [
        new Request(NOISY, { method: 'GET' }),
        new Response(null, { status: 500 })
      ])

      expect(mockLogger.error).toHaveBeenCalledWith(
        'UserService.onAfterFetch',
        'GET https://api.example/v1/x → 500'
      )
      assertNoQuery(mockLogger.error.mock.calls)
    })

    it('keeps the query string out of the thrown-error line, detail intact', () => {
      logHttpEvent(mockLogger as any, 'UserService', 'catch', [
        new Request(NOISY, { method: 'POST' }),
        new Response(null, { status: 422 }),
        { message: 'Invalid document' }
      ])

      expect(mockLogger.error).toHaveBeenCalledWith(
        'UserService.catch',
        'POST https://api.example/v1/x → 422: Invalid document'
      )
      assertNoQuery(mockLogger.error.mock.calls)
    })

    // Node refuses to build a Request from a URL carrying credentials, so this
    // shape can only reach the logger through the unguarded catch hook. The port
    // is part of the destination and stays.
    it('drops credentials and fragment along with the query string', () => {
      logHttpEvent(mockLogger as any, 'UserService', 'catch', [
        {
          method: 'GET',
          url: 'https://user:pw-must-not-log@api.example:8443/v1/x?q=1#frag'
        },
        new Response(null, { status: 500 }),
        undefined
      ])

      expect(mockLogger.error).toHaveBeenCalledWith(
        'UserService.catch',
        'GET https://api.example:8443/v1/x → 500'
      )
      expect(JSON.stringify(mockLogger.error.mock.calls)).not.toContain(
        'pw-must-not-log'
      )
    })

    // The catch hook has no `instanceof Request` guard, so a caller can reach it
    // A fragment is the other half of that fallback. Nothing forces a caller
    // to use `?`: a relative URL carrying its parameters after `#` reaches the
    // same unparseable path, and splitting on `?` alone logs the lot.
    it('still truncates a relative URL that carries a fragment', () => {
      logHttpEvent(mockLogger as any, 'UserService', 'catch', [
        { method: 'GET', url: '/v1/x#taxId=123.456.789-00&cursor=abc' },
        new Response(null, { status: 400 }),
        undefined
      ])

      expect(mockLogger.error).toHaveBeenCalledWith(
        'UserService.catch',
        'GET /v1/x → 400'
      )
      assertNoQuery(mockLogger.error.mock.calls)
    })

    // with a relative URL that no parser accepts.
    it('still truncates a relative URL that cannot be parsed', () => {
      logHttpEvent(mockLogger as any, 'UserService', 'catch', [
        { method: 'GET', url: '/v1/x?taxId=123.456.789-00&cursor=abc' },
        new Response(null, { status: 400 }),
        undefined
      ])

      expect(mockLogger.error).toHaveBeenCalledWith(
        'UserService.catch',
        'GET /v1/x → 400'
      )
      assertNoQuery(mockLogger.error.mock.calls)
    })
  })

  describe('unknown method', () => {
    it('should not log for unrecognized method names', () => {
      logHttpEvent(mockLogger as any, 'Svc', 'unknownMethod', ['arg'])

      expect(mockLogger.info).not.toHaveBeenCalled()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })
  })
})
