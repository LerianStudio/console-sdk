import { BaseExceptionFilter } from './base-exception-filter'
import { NextResponse } from 'next/server'

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

  it('should handle exception with getStatus method', async () => {
    const exception = {
      message: 'Test error message',
      getStatus: jest.fn().mockReturnValue(400)
    }

    await filter.catch(exception)

    expect(exception.getStatus).toHaveBeenCalled()
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

  it('should handle exception without message (default message)', async () => {
    const exception = {
      getStatus: jest.fn().mockReturnValue(404)
    }

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: 'Internal server error' },
      { status: 404 }
    )
  })

  it('should handle exception with null message', async () => {
    const exception = {
      message: null,
      getStatus: jest.fn().mockReturnValue(422)
    }

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: 'Internal server error' },
      { status: 422 }
    )
  })

  it('should handle exception with undefined message', async () => {
    const exception = {
      message: undefined,
      getStatus: jest.fn().mockReturnValue(401)
    }

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: 'Internal server error' },
      { status: 401 }
    )
  })

  it('should handle exception with empty string message', async () => {
    const exception = {
      message: '',
      getStatus: jest.fn().mockReturnValue(403)
    }

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: 'Internal server error' },
      { status: 403 }
    )
  })

  it('should handle exception with complex object message', async () => {
    const complexMessage = {
      error: 'Complex error',
      details: ['detail1', 'detail2']
    }
    const exception = {
      message: complexMessage,
      getStatus: jest.fn().mockReturnValue(400)
    }

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: complexMessage },
      { status: 400 }
    )
  })

  it('should handle string exception', async () => {
    const exception = 'Simple string error'

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: 'Internal server error' },
      { status: 500 }
    )
  })

  it('should handle null exception', async () => {
    const exception = null

    await expect(filter.catch(exception)).rejects.toThrow()
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

  it('should handle exception with custom status codes', async () => {
    const testCases = [
      { status: 200, message: 'OK' },
      { status: 201, message: 'Created' },
      { status: 404, message: 'Not Found' },
      { status: 422, message: 'Unprocessable Entity' },
      { status: 500, message: 'Internal Server Error' }
    ]

    for (const testCase of testCases) {
      jest.clearAllMocks()

      const exception = {
        message: testCase.message,
        getStatus: jest.fn().mockReturnValue(testCase.status)
      }

      await filter.catch(exception)

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        { message: testCase.message },
        { status: testCase.status }
      )
    }
  })
})
