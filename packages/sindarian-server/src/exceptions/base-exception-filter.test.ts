import { BaseExceptionFilter } from './base-exception-filter'
import { ApiException } from './api-exception'
import { NextResponse } from 'next/server'
import { HttpStatus } from '@/constants'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn()
  }
}))

const mockNextResponse = NextResponse as jest.Mocked<typeof NextResponse>

describe('BaseExceptionFilter', () => {
  let filter: BaseExceptionFilter
  let consoleError: jest.SpyInstance

  beforeEach(() => {
    filter = new BaseExceptionFilter()
    jest.clearAllMocks()

    // Hoisted, because every value that is not an ApiException now writes one
    // line here, not only an Error. Without the spy these cases print the log
    // of every shape they throw.
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})

    // Mock NextResponse.json to return a mock response
    mockNextResponse.json.mockReturnValue({
      status: 500,
      statusText: 'Internal Server Error'
    } as any)
  })

  afterEach(() => {
    consoleError.mockRestore()
  })

  it('should handle ApiException with getStatus method', async () => {
    const exception = new ApiException(
      'TEST_ERROR',
      'Test Error',
      'Test error message',
      HttpStatus.BAD_REQUEST
    )

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: 'Test error message' },
      { status: 400 }
    )
  })

  it('should handle exception without getStatus method (default to 500)', async () => {
    const exception = {
      message: 'Test error message'
    }

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: 'Internal server error', code: '0004' },
      { status: 500 }
    )
  })

  // An empty message used to survive the constructor, and this filter's
  // `message || 'Internal server error'` then told the user that an expired
  // token was a server fault. The constructor now substitutes a sentence that
  // names the real status, so the filter's own fallback stays unreached.
  it('names the real status when the message is empty', async () => {
    const exception = new ApiException(
      'TEST_ERROR',
      'Test Error',
      '', // empty message
      HttpStatus.NOT_FOUND
    )

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: expect.stringContaining('404') },
      { status: 404 }
    )
    expect(mockNextResponse.json).not.toHaveBeenCalledWith(
      { message: 'Internal server error' },
      { status: 404 }
    )
  })

  // The shape of an ordinary rethrow in a TypeScript route:
  // `catch (e) { throw { message: e.message } }`, or an upstream problem body
  // whose `message` is already a sentence. It is not an `Error`, so a
  // redaction keyed off `instanceof Error` let its text through, and this case
  // asserted that it did.
  it('should handle non-ApiException', async () => {
    const exception = {
      message:
        'connect ECONNREFUSED db-primary.internal:8080 for cpf 123.456.789-00'
    }

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: 'Internal server error', code: '0004' },
      { status: 500 }
    )
    expect(JSON.stringify(mockNextResponse.json.mock.calls)).not.toContain(
      '123.456.789-00'
    )
  })

  // A controller may throw anything at all, and this filter writes the last
  // body before the wire. `message` used to be whatever the thrown value
  // carried under that name: an object, an empty string, or nothing. A caller
  // that classifies a failure with string methods, which is every Console
  // route reading `error.message`, got a dead branch and answered a 500, and
  // an object landed in the browser under a field documented as a sentence.
  //
  // Every case below throws a DIFFERENT shape and asserts the SAME body. That
  // is the rule: past the ApiException narrowing, the thrown shape decides
  // nothing a caller can read. The cases stay one per shape because the shapes
  // are what a route actually throws, and a rule is only pinned where it can
  // be broken one shape at a time.
  describe('the body always carries a string message', () => {
    const messageOf = () => mockNextResponse.json.mock.calls[0][0] as any

    it('names a fallback when the thrown value has no message', async () => {
      await filter.catch({ message: undefined })

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error', code: '0004' },
        { status: 500 }
      )
    })

    it('names a fallback for an empty message', async () => {
      await filter.catch({ message: '' })

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error', code: '0004' },
        { status: 500 }
      )
    })

    it('names a fallback for an object message that classifies nothing', async () => {
      await filter.catch({
        message: { error: 'Complex error', details: ['detail1', 'detail2'] }
      })

      expect(typeof messageOf().message).toBe('string')
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error', code: '0004' },
        { status: 500 }
      )
    })

    // The transport keeps an upstream's `title` because the transport knows it
    // called an upstream and answers a typed exception for it. This frame does
    // not: past the narrowing above, a `title` is a word some other system
    // wrote about a failure this library could not classify, and passing it on
    // under the code that means UNCLASSIFIED is what made the code unreadable.
    // A caller reading `0004` can now trust that the sentence beside it is
    // ours.
    it('keeps no part of an upstream classification', async () => {
      await filter.catch({
        message: {
          title: 'Gateway Timeout',
          detail: 'cpf 123.456.789-00 timed out at db-primary.internal'
        }
      })

      expect(messageOf().message).toBe('Internal server error')
      expect(JSON.stringify(messageOf())).not.toContain('Gateway Timeout')
      expect(JSON.stringify(messageOf())).not.toContain('123.456.789-00')
      expect(JSON.stringify(messageOf())).not.toContain('db-primary.internal')
    })

    it('names a fallback for a thrown string', async () => {
      await filter.catch('Simple string error')

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error', code: '0004' },
        { status: 500 }
      )
    })

    // `throw null` used to make the filter itself throw on `.message`, and a
    // filter that throws escapes the whole request pipeline, so the route
    // produced no Response at all. Measured on Next 16.2.6 under `next start`:
    // `500`, a ZERO-BYTE body, no `content-type`, and a browser parsing that
    // as JSON gets `SyntaxError: Unexpected end of JSON input`.
    it('survives a thrown null', async () => {
      await expect(filter.catch(null)).resolves.toBeDefined()

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error', code: '0004' },
        { status: 500 }
      )
    })

    // Length was the only thing that ever stood between an untyped message and
    // the browser, and a 2000-character cap is not a redaction: the host, the
    // port and the taxpayer id are in the first eighty. The cap is gone from
    // this branch because the text is.
    it('drops an unbounded message rather than capping it', async () => {
      await filter.catch({ message: 'x'.repeat(5000) })

      expect(messageOf().message).toBe('Internal server error')
    })
  })

  // What a route threw that this library does not model. Its text is the
  // failure's own words and it used to be the response body; it is now the log
  // line, and the caller is told only that the failure was not classified.
  //
  // The log line is the half that is easy to get wrong, because nothing a
  // caller can see goes red when it is missing. An `Error` was the only shape
  // that wrote one, so an operator paged on a spike of 500s had no host, no
  // taxpayer id and no line to grep for every other shape, and the response no
  // longer carried them either: the text was not redacted, it was deleted.
  describe('an unexpected error', () => {
    it('answers the generic sentence and the code, never the Error text', async () => {
      await filter.catch(new Error('connect ECONNREFUSED 10.0.0.5:8080'))

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error', code: '0004' },
        { status: 500 }
      )
    })

    it('writes the Error text and its stack to the server log', async () => {
      const exception = new Error('connect ECONNREFUSED 10.0.0.5:8080')

      await filter.catch(exception)

      expect(consoleError).toHaveBeenCalledWith('Unhandled exception', {
        name: 'Error',
        message: 'connect ECONNREFUSED 10.0.0.5:8080',
        stack: exception.stack
      })
    })

    it('writes the text of a thrown object that is not an Error', async () => {
      await filter.catch({
        message: 'connect ECONNREFUSED 10.0.0.5:8080',
        code: 'ECONNREFUSED'
      })

      expect(consoleError).toHaveBeenCalledWith('Unhandled exception', {
        name: 'object',
        message: 'connect ECONNREFUSED 10.0.0.5:8080',
        stack: undefined
      })
    })

    // The upstream body a route rethrew has no `message` at all. It is handed
    // over whole rather than stringified, because `String({...})` is
    // `[object Object]` and the fields ARE the incident: this is the only copy
    // left once the response stopped carrying them.
    it('writes a thrown value that has no message at all', async () => {
      const exception = { code: 'E_NOPE', detail: 'timed out at db-primary' }

      await filter.catch(exception)

      expect(consoleError).toHaveBeenCalledWith('Unhandled exception', {
        name: 'object',
        message: exception,
        stack: undefined
      })
    })

    it('writes a thrown string', async () => {
      await filter.catch('payment gateway rejected the settlement')

      expect(consoleError).toHaveBeenCalledWith('Unhandled exception', {
        name: 'string',
        message: 'payment gateway rejected the settlement',
        stack: undefined
      })
    })

    // A line even here, so a 500 in the log is never a 500 with no line. The
    // reads are all optional: a filter that throws while handling a throw
    // escapes the pipeline and the route answers no body at all.
    it('writes a line for a thrown null without throwing', async () => {
      await expect(filter.catch(null)).resolves.toBeDefined()

      expect(consoleError).toHaveBeenCalledWith('Unhandled exception', {
        name: 'object',
        message: null,
        stack: undefined
      })
    })

    // Length is no longer what stands between the text and the browser, so an
    // Error is not capped, it is dropped. This case exists because the cap
    // above used to be the only thing holding a 5000-character Error back.
    it('drops an unbounded Error text rather than capping it', async () => {
      await filter.catch(new Error('x'.repeat(5000)))

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error', code: '0004' },
        { status: 500 }
      )
    })

    // An ApiException IS an Error. Redacting by `instanceof Error` alone would
    // take the message off every 401, 404 and 422 this library raises, which
    // is the whole sentence a caller shows a user.
    it('never redacts an ApiException, which is an Error too', async () => {
      await filter.catch(
        new ApiException(
          '0003',
          'Not Found',
          'Ledger not found',
          HttpStatus.NOT_FOUND
        )
      )

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Ledger not found' },
        { status: 404 }
      )
      expect(consoleError).not.toHaveBeenCalled()
    })
  })

  it('should return the NextResponse from NextResponse.json', async () => {
    const mockResponse = { status: 400, statusText: 'Bad Request' }
    mockNextResponse.json.mockReturnValue(mockResponse as any)

    const exception = { message: 'Test', getStatus: () => 400 }
    const result = await filter.catch(exception)

    expect(result).toBe(mockResponse)
  })

  it('should handle ApiException with custom status codes', async () => {
    const testCases = [
      { status: HttpStatus.OK, message: 'OK' },
      { status: HttpStatus.CREATED, message: 'Created' },
      { status: HttpStatus.NOT_FOUND, message: 'Not Found' },
      {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'Unprocessable Entity'
      },
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error'
      }
    ]

    for (const testCase of testCases) {
      jest.clearAllMocks()

      const exception = new ApiException(
        'TEST_ERROR',
        'Test Error',
        testCase.message,
        testCase.status
      )

      await filter.catch(exception)

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: testCase.message },
        { status: testCase.status }
      )
    }
  })
})
