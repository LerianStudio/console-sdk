import 'reflect-metadata'
import { REQUEST_KEY } from '../../constants/keys'
import {
  requestDecoratorHandler,
  Request,
  Req,
  RequestMetadata
} from './request-decorator'
import { getNextRequestArgument } from '../../utils/nextjs/get-next-arguments'

// Mock the utility function
jest.mock('../../utils/nextjs/get-next-arguments')
const mockGetNextRequestArgument =
  getNextRequestArgument as jest.MockedFunction<typeof getNextRequestArgument>

describe('requestDecoratorHandler', () => {
  const mockRequest = {
    url: '/test',
    method: 'GET',
    headers: { 'content-type': 'application/json' }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetNextRequestArgument.mockReturnValue(mockRequest as any)
  })

  afterEach(() => {
    // Clear all metadata after each test to avoid interference
    const methods = ['testMethod', 'anotherMethod']
    methods.forEach((method) => {
      try {
        Reflect.deleteMetadata(REQUEST_KEY, TestClass.prototype, method)
      } catch (error) {
        // Ignore errors if metadata doesn't exist
      }
    })
  })

  class TestClass {
    testMethod() {}
    anotherMethod() {}
  }

  it('should return null when no metadata is found', () => {
    const result = requestDecoratorHandler(TestClass.prototype, 'testMethod', [
      mockRequest
    ])

    expect(result).toBeNull()
    expect(mockGetNextRequestArgument).not.toHaveBeenCalled()
  })

  it('should return request object and parameter index when metadata exists', () => {
    // Set metadata
    const metadata: RequestMetadata = {
      propertyKey: 'testMethod',
      parameterIndex: 0
    }
    Reflect.defineMetadata(
      REQUEST_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    const result = requestDecoratorHandler(TestClass.prototype, 'testMethod', [
      mockRequest
    ])

    expect(result).toEqual({
      parameter: mockRequest,
      parameterIndex: 0
    })
    expect(mockGetNextRequestArgument).toHaveBeenCalledTimes(1)
    expect(mockGetNextRequestArgument).toHaveBeenCalledWith([mockRequest])
  })

  it('should work with different parameter indices', () => {
    // Set metadata with different parameter index
    const metadata: RequestMetadata = {
      propertyKey: 'testMethod',
      parameterIndex: 2
    }
    Reflect.defineMetadata(
      REQUEST_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    const result = requestDecoratorHandler(TestClass.prototype, 'testMethod', [
      mockRequest,
      'other',
      'params'
    ])

    expect(result).toEqual({
      parameter: mockRequest,
      parameterIndex: 2
    })
    expect(mockGetNextRequestArgument).toHaveBeenCalledWith([
      mockRequest,
      'other',
      'params'
    ])
  })

  it('should work with symbol property keys', () => {
    const symbolKey = Symbol('testSymbol')

    // Set metadata with symbol property key
    const metadata: RequestMetadata = {
      propertyKey: symbolKey,
      parameterIndex: 1
    }
    Reflect.defineMetadata(
      REQUEST_KEY,
      metadata,
      TestClass.prototype,
      symbolKey
    )

    const result = requestDecoratorHandler(TestClass.prototype, symbolKey, [
      mockRequest
    ])

    expect(result).toEqual({
      parameter: mockRequest,
      parameterIndex: 1
    })
    expect(mockGetNextRequestArgument).toHaveBeenCalledWith([mockRequest])
  })

  it('should handle empty args array', () => {
    const metadata: RequestMetadata = {
      propertyKey: 'testMethod',
      parameterIndex: 0
    }
    Reflect.defineMetadata(
      REQUEST_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    mockGetNextRequestArgument.mockReturnValue(undefined)

    const result = requestDecoratorHandler(
      TestClass.prototype,
      'testMethod',
      []
    )

    expect(result).toEqual({
      parameter: undefined,
      parameterIndex: 0
    })
    expect(mockGetNextRequestArgument).toHaveBeenCalledWith([])
  })

  it('should handle null args', () => {
    const metadata: RequestMetadata = {
      propertyKey: 'testMethod',
      parameterIndex: 0
    }
    Reflect.defineMetadata(
      REQUEST_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    mockGetNextRequestArgument.mockReturnValue(undefined)

    const result = requestDecoratorHandler(
      TestClass.prototype,
      'testMethod',
      null as any
    )

    expect(result).toEqual({
      parameter: undefined,
      parameterIndex: 0
    })
    expect(mockGetNextRequestArgument).toHaveBeenCalledWith(null)
  })

  it('should handle different request objects', () => {
    const customRequest = {
      url: '/custom',
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
      headers: { authorization: 'Bearer token' }
    }

    mockGetNextRequestArgument.mockReturnValue(customRequest)

    const metadata: RequestMetadata = {
      propertyKey: 'testMethod',
      parameterIndex: 0
    }
    Reflect.defineMetadata(
      REQUEST_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    const result = requestDecoratorHandler(TestClass.prototype, 'testMethod', [
      customRequest
    ])

    expect(result).toEqual({
      parameter: customRequest,
      parameterIndex: 0
    })
  })

  it('should work with different methods on same class', () => {
    // Set metadata for different methods
    const metadata1: RequestMetadata = {
      propertyKey: 'testMethod',
      parameterIndex: 0
    }
    const metadata2: RequestMetadata = {
      propertyKey: 'anotherMethod',
      parameterIndex: 1
    }

    Reflect.defineMetadata(
      REQUEST_KEY,
      metadata1,
      TestClass.prototype,
      'testMethod'
    )
    Reflect.defineMetadata(
      REQUEST_KEY,
      metadata2,
      TestClass.prototype,
      'anotherMethod'
    )

    const result1 = requestDecoratorHandler(TestClass.prototype, 'testMethod', [
      mockRequest
    ])
    const result2 = requestDecoratorHandler(
      TestClass.prototype,
      'anotherMethod',
      [mockRequest, 'param']
    )

    expect(result1).toEqual({
      parameter: mockRequest,
      parameterIndex: 0
    })
    expect(result2).toEqual({
      parameter: mockRequest,
      parameterIndex: 1
    })
  })

  it('should return null for method without metadata even if other methods have metadata', () => {
    // Set metadata only for testMethod
    const metadata: RequestMetadata = {
      propertyKey: 'testMethod',
      parameterIndex: 0
    }
    Reflect.defineMetadata(
      REQUEST_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    // Try to get metadata for anotherMethod (which doesn't have metadata)
    const result = requestDecoratorHandler(
      TestClass.prototype,
      'anotherMethod',
      [mockRequest]
    )

    expect(result).toBeNull()
    expect(mockGetNextRequestArgument).not.toHaveBeenCalled()
  })
})

describe('Request decorator', () => {
  class TestClass {
    testMethod(request: any) {}
    anotherMethod(param1: string, request: any) {}
    methodWithMultipleParams(param1: string, param2: number, request: any) {}
  }

  beforeEach(() => {
    // Clear metadata before each test
    const methods = ['testMethod', 'anotherMethod', 'methodWithMultipleParams']
    methods.forEach((method) => {
      try {
        Reflect.deleteMetadata(REQUEST_KEY, TestClass.prototype, method)
      } catch (error) {
        // Ignore errors if metadata doesn't exist
      }
    })
  })

  it('should set metadata for parameter at index 0', () => {
    // Apply the decorator manually
    const decorator = Request()
    decorator(TestClass.prototype, 'testMethod', 0)

    const metadata = Reflect.getOwnMetadata(
      REQUEST_KEY,
      TestClass.prototype,
      'testMethod'
    )

    expect(metadata).toEqual({
      propertyKey: 'testMethod',
      parameterIndex: 0
    })
  })

  it('should set metadata for parameter at different indices', () => {
    // Apply decorators at different parameter indices
    const decorator1 = Request()
    const decorator2 = Request()

    decorator1(TestClass.prototype, 'anotherMethod', 1)
    decorator2(TestClass.prototype, 'methodWithMultipleParams', 2)

    const metadata1 = Reflect.getOwnMetadata(
      REQUEST_KEY,
      TestClass.prototype,
      'anotherMethod'
    )
    const metadata2 = Reflect.getOwnMetadata(
      REQUEST_KEY,
      TestClass.prototype,
      'methodWithMultipleParams'
    )

    expect(metadata1).toEqual({
      propertyKey: 'anotherMethod',
      parameterIndex: 1
    })
    expect(metadata2).toEqual({
      propertyKey: 'methodWithMultipleParams',
      parameterIndex: 2
    })
  })

  it('should work with symbol property keys', () => {
    const symbolKey = Symbol('testSymbol')

    const decorator = Request()
    decorator(TestClass.prototype, symbolKey, 0)

    const metadata = Reflect.getOwnMetadata(
      REQUEST_KEY,
      TestClass.prototype,
      symbolKey
    )

    expect(metadata).toEqual({
      propertyKey: symbolKey,
      parameterIndex: 0
    })
  })

  it('should overwrite metadata when applied multiple times to same method', () => {
    const decorator1 = Request()
    const decorator2 = Request()

    // Apply first decorator
    decorator1(TestClass.prototype, 'testMethod', 0)

    let metadata = Reflect.getOwnMetadata(
      REQUEST_KEY,
      TestClass.prototype,
      'testMethod'
    )
    expect(metadata.parameterIndex).toBe(0)

    // Apply second decorator (should overwrite)
    decorator2(TestClass.prototype, 'testMethod', 1)

    metadata = Reflect.getOwnMetadata(
      REQUEST_KEY,
      TestClass.prototype,
      'testMethod'
    )
    expect(metadata).toEqual({
      propertyKey: 'testMethod',
      parameterIndex: 1
    })
  })

  it('should set independent metadata for different methods', () => {
    const decorator1 = Request()
    const decorator2 = Request()
    const decorator3 = Request()

    decorator1(TestClass.prototype, 'testMethod', 0)
    decorator2(TestClass.prototype, 'anotherMethod', 1)
    decorator3(TestClass.prototype, 'methodWithMultipleParams', 2)

    const metadata1 = Reflect.getOwnMetadata(
      REQUEST_KEY,
      TestClass.prototype,
      'testMethod'
    )
    const metadata2 = Reflect.getOwnMetadata(
      REQUEST_KEY,
      TestClass.prototype,
      'anotherMethod'
    )
    const metadata3 = Reflect.getOwnMetadata(
      REQUEST_KEY,
      TestClass.prototype,
      'methodWithMultipleParams'
    )

    expect(metadata1).toEqual({
      propertyKey: 'testMethod',
      parameterIndex: 0
    })
    expect(metadata2).toEqual({
      propertyKey: 'anotherMethod',
      parameterIndex: 1
    })
    expect(metadata3).toEqual({
      propertyKey: 'methodWithMultipleParams',
      parameterIndex: 2
    })

    // Verify they don't interfere with each other
    expect(metadata1).not.toEqual(metadata2)
    expect(metadata2).not.toEqual(metadata3)
    expect(metadata1).not.toEqual(metadata3)
  })

  it('should handle edge case parameter indices', () => {
    const decorator1 = Request()
    const decorator2 = Request()

    // Test with index 0 and a high index
    decorator1(TestClass.prototype, 'testMethod', 0)
    decorator2(TestClass.prototype, 'anotherMethod', 10)

    const metadata1 = Reflect.getOwnMetadata(
      REQUEST_KEY,
      TestClass.prototype,
      'testMethod'
    )
    const metadata2 = Reflect.getOwnMetadata(
      REQUEST_KEY,
      TestClass.prototype,
      'anotherMethod'
    )

    expect(metadata1.parameterIndex).toBe(0)
    expect(metadata2.parameterIndex).toBe(10)
  })
})

describe('Req alias', () => {
  it('should be the same function as Request', () => {
    expect(Req).toBe(Request)
  })

  it('should work identically to Request decorator', () => {
    class TestClass {
      testMethod(request: any) {}
    }

    // Test that Req works the same as Request
    const requestDecorator = Request()
    const reqDecorator = Req()

    requestDecorator(TestClass.prototype, 'testMethod', 0)

    const requestMetadata = Reflect.getOwnMetadata(
      REQUEST_KEY,
      TestClass.prototype,
      'testMethod'
    )

    // Clear metadata and test with Req
    Reflect.deleteMetadata(REQUEST_KEY, TestClass.prototype, 'testMethod')

    reqDecorator(TestClass.prototype, 'testMethod', 0)

    const reqMetadata = Reflect.getOwnMetadata(
      REQUEST_KEY,
      TestClass.prototype,
      'testMethod'
    )

    expect(reqMetadata).toEqual(requestMetadata)
    expect(reqMetadata).toEqual({
      propertyKey: 'testMethod',
      parameterIndex: 0
    })
  })
})

describe('RequestMetadata type', () => {
  it('should allow string property keys', () => {
    const metadata: RequestMetadata = {
      propertyKey: 'testMethod',
      parameterIndex: 0
    }

    expect(typeof metadata.propertyKey).toBe('string')
    expect(typeof metadata.parameterIndex).toBe('number')
  })

  it('should allow symbol property keys', () => {
    const symbolKey = Symbol('test')
    const metadata: RequestMetadata = {
      propertyKey: symbolKey,
      parameterIndex: 1
    }

    expect(typeof metadata.propertyKey).toBe('symbol')
    expect(typeof metadata.parameterIndex).toBe('number')
  })
})
