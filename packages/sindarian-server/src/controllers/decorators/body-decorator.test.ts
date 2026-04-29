import 'reflect-metadata'
import { z } from 'zod'
import { BODY_KEY } from '../../constants/keys'
import { BodyHandler, Body, BodyMetadata } from './body-decorator'
import { getNextRequestArgument } from '../../utils/nextjs/get-next-arguments'
import { ValidationApiException } from '../../exceptions'

// Mock the utility function
jest.mock('../../utils/nextjs/get-next-arguments')
const mockGetNextRequestArgument =
  getNextRequestArgument as jest.MockedFunction<typeof getNextRequestArgument>

describe('BodyHandler.handle', () => {
  const mockRequest = {
    json: jest.fn(),
    text: jest.fn(),
    formData: jest.fn(),
    headers: {
      get: jest.fn()
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Create a fresh mock request for each test to avoid cache issues
    const freshMockRequest = {
      json: jest.fn(),
      text: jest.fn(),
      formData: jest.fn(),
      headers: {
        get: jest.fn().mockReturnValue('application/json')
      }
    }

    Object.assign(mockRequest, freshMockRequest)
    mockGetNextRequestArgument.mockReturnValue(mockRequest as any)
  })

  afterEach(() => {
    // Clear all metadata after each test to avoid interference
    Reflect.getMetadataKeys(TestClass.prototype).forEach((key) => {
      Reflect.deleteMetadata(key, TestClass.prototype, 'testMethod')
    })
  })

  class TestClass {
    testMethod() {}
  }

  it('should return null when no metadata is found', async () => {
    const result = await BodyHandler.handle(TestClass.prototype, 'testMethod', [
      mockRequest
    ])

    expect(result).toBeNull()
  })

  it('should return parsed body when metadata exists without schema', async () => {
    const mockBody = { name: 'John', age: 30 }
    mockRequest.json.mockResolvedValue(mockBody)

    // Set metadata without schema
    const metadata: BodyMetadata = {
      parameterIndex: 0
    }
    Reflect.defineMetadata(
      BODY_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    const result = await BodyHandler.handle(TestClass.prototype, 'testMethod', [
      mockRequest
    ])

    expect(result).toEqual({
      type: 'body',
      parameter: mockBody,
      parameterIndex: 0
    })
    expect(mockRequest.json).toHaveBeenCalledTimes(1)
  })

  it('should handle request.json() rejection', async () => {
    const jsonError = new Error('Failed to parse JSON')
    // Create a new mock request to avoid cache
    const errorMockRequest = {
      json: jest.fn().mockRejectedValue(jsonError),
      text: jest.fn(),
      formData: jest.fn(),
      headers: {
        get: jest.fn().mockReturnValue('application/json')
      }
    }
    mockGetNextRequestArgument.mockReturnValue(errorMockRequest as any)

    // Set metadata without schema
    const metadata: BodyMetadata = {
      parameterIndex: 0
    }
    Reflect.defineMetadata(
      BODY_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    await expect(
      BodyHandler.handle(TestClass.prototype, 'testMethod', [errorMockRequest])
    ).rejects.toThrow('Missing or invalid request body')

    expect(errorMockRequest.json).toHaveBeenCalledTimes(1)
  })

  it('should handle empty body object', async () => {
    const mockBody = {}

    // Create a new mock request for this test
    const emptyMockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
      text: jest.fn(),
      formData: jest.fn(),
      headers: {
        get: jest.fn().mockReturnValue('application/json')
      }
    }
    mockGetNextRequestArgument.mockReturnValue(emptyMockRequest as any)

    // Set metadata without schema
    const metadata: BodyMetadata = {
      parameterIndex: 0
    }
    Reflect.defineMetadata(
      BODY_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    const result = await BodyHandler.handle(TestClass.prototype, 'testMethod', [
      emptyMockRequest
    ])

    expect(result).toEqual({
      type: 'body',
      parameter: mockBody,
      parameterIndex: 0
    })
    expect(emptyMockRequest.json).toHaveBeenCalledTimes(1)
  })

  it('should handle null body', async () => {
    const mockBody = null

    // Create a new mock request for this test
    const nullMockRequest = {
      json: jest.fn().mockResolvedValue(mockBody),
      text: jest.fn(),
      formData: jest.fn(),
      headers: {
        get: jest.fn().mockReturnValue('application/json')
      }
    }
    mockGetNextRequestArgument.mockReturnValue(nullMockRequest as any)

    // Set metadata without schema
    const metadata: BodyMetadata = {
      parameterIndex: 0
    }
    Reflect.defineMetadata(
      BODY_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    const result = await BodyHandler.handle(TestClass.prototype, 'testMethod', [
      nullMockRequest
    ])

    expect(result).toEqual({
      type: 'body',
      parameter: mockBody,
      parameterIndex: 0
    })
    expect(nullMockRequest.json).toHaveBeenCalledTimes(1)
  })
})

describe('Body decorator', () => {
  class TestClass {
    testMethod(body: any) {}
    testMethodWithSchema(body: string) {}
  }

  beforeEach(() => {
    // Clear metadata before each test
    Reflect.getMetadataKeys(TestClass.prototype).forEach((key) => {
      Reflect.deleteMetadata(key, TestClass.prototype, 'testMethod')
      Reflect.deleteMetadata(key, TestClass.prototype, 'testMethodWithSchema')
    })
  })

  it('should set metadata without schema', () => {
    // Apply the decorator manually since TypeScript decorators run at class definition time
    const decorator = Body()
    decorator(TestClass.prototype, 'testMethod', 0)

    const metadata = Reflect.getOwnMetadata(
      BODY_KEY,
      TestClass.prototype,
      'testMethod'
    )

    expect(metadata).toEqual({
      parameterIndex: 0
    })
  })
})
