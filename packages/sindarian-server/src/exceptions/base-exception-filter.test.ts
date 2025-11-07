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

  it('should handle ApiException without message (default message)', async () => {
    const exception = new ApiException(
      'TEST_ERROR',
      'Test Error',
      '', // empty message
      HttpStatus.NOT_FOUND
    )

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
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

  it('should handle non-ApiException with undefined message', async () => {
    const exception = {
      message: undefined
    }

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: undefined },
      { status: 500 }
    )
  })

  it('should handle non-ApiException with empty string message', async () => {
    const exception = {
      message: ''
    }

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: '' },
      { status: 500 }
    )
  })

  it('should handle non-ApiException with complex object message', async () => {
    const complexMessage = {
      error: 'Complex error',
      details: ['detail1', 'detail2']
    }
    const exception = {
      message: complexMessage
    }

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: complexMessage },
      { status: 500 }
    )
  })

  it('should handle string exception', async () => {
    const exception = 'Simple string error'

    await filter.catch(exception)

    expect(mockNextResponse.json).toHaveBeenCalledWith(
      { message: undefined }, // strings don't have message property
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

  it('should handle ApiException with custom status codes', async () => {
    const testCases = [
      { status: HttpStatus.OK, message: 'OK' },
      { status: HttpStatus.CREATED, message: 'Created' },
      { status: HttpStatus.NOT_FOUND, message: 'Not Found' },
      { status: HttpStatus.UNPROCESSABLE_ENTITY, message: 'Unprocessable Entity' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal Server Error' }
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
