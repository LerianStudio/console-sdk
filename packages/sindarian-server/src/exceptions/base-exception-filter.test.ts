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

  beforeEach(() => {
    filter = new BaseExceptionFilter()
    jest.clearAllMocks()

    // Mock NextResponse.json to return a mock response
    mockNextResponse.json.mockReturnValue({
      status: 500,
      statusText: 'Internal Server Error'
    } as any)
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
      { message: 'Test error message' },
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

  it('should handle non-ApiException', async () => {
    const exception = {
      message: 'Non-API error'
    }

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: 'Non-API error' },
      { status: 500 }
    )
  })

  // A controller may throw anything at all, and this filter writes the last
  // body before the wire. `message` used to be whatever the thrown value
  // carried under that name: an object, an empty string, or nothing. A caller
  // that classifies a failure with string methods, which is every Console
  // route reading `error.message`, got a dead branch and answered a 500, and
  // an object landed in the browser under a field documented as a sentence.
  describe('the body always carries a string message', () => {
    const messageOf = () => mockNextResponse.json.mock.calls[0][0] as any

    it('names a fallback when the thrown value has no message', async () => {
      await filter.catch({ message: undefined })

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error' },
        { status: 500 }
      )
    })

    it('names a fallback for an empty message', async () => {
      await filter.catch({ message: '' })

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error' },
        { status: 500 }
      )
    })

    it('reduces an object message that classifies nothing', async () => {
      await filter.catch({
        message: { error: 'Complex error', details: ['detail1', 'detail2'] }
      })

      expect(typeof messageOf().message).toBe('string')
      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error' },
        { status: 500 }
      )
    })

    // Same reduction the exception constructor already does one frame down:
    // an upstream problem body classifies in `title` and `code`, and
    // describes in `detail` and `errors[]`, which carry the caller's own
    // rejected values and never leave the upstream.
    it('reduces an object message to its classification only', async () => {
      await filter.catch({
        message: {
          title: 'Gateway Timeout',
          detail: 'cpf 123.456.789-00 timed out at db-primary.internal'
        }
      })

      expect(messageOf().message).toBe('Gateway Timeout')
      expect(JSON.stringify(messageOf())).not.toContain('123.456.789-00')
      expect(JSON.stringify(messageOf())).not.toContain('db-primary.internal')
    })

    it('names a fallback for a thrown string', async () => {
      await filter.catch('Simple string error')

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error' },
        { status: 500 }
      )
    })

    // `throw null` used to make the filter itself throw on `.message`, and a
    // filter that throws escapes the whole request pipeline: the caller got
    // Next's own HTML error page where a JSON envelope was promised, and a
    // browser parsing it as JSON failed on the first character.
    it('survives a thrown null', async () => {
      await expect(filter.catch(null)).resolves.toBeDefined()

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: 'Internal server error' },
        { status: 500 }
      )
    })

    // The ApiException branch has been bounded since the message stopped
    // being the upstream body; this branch serialised whatever it was handed.
    it('caps an unbounded message', async () => {
      await filter.catch(new Error('x'.repeat(5000)))

      expect(messageOf().message).toHaveLength(2000)
    })
  })

  it('should handle Error instance', async () => {
    const exception = new Error('Standard Error instance')

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: 'Standard Error instance' },
      { status: 500 }
    )
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
