import 'reflect-metadata'
import { Route, Get, Post, Put, Patch, Delete } from './route-decorator'
import { GET_KEY, ROUTE_KEY } from '../../constants/keys'
import { HttpMethods } from '../../constants/http-methods'
import { BodyHandler } from './body-decorator'
import { ParamHandler } from './param-decorator'
import { QueryHandler } from './query-decorator'
import { RequestHandler } from './request-decorator'

// Mock all decorator handlers
jest.mock('./body-decorator')
jest.mock('./param-decorator')
jest.mock('./query-decorator')
jest.mock('./request-decorator')

type DecoratorHandlerResult =
  | { parameter: any; parameterIndex: number }
  | { parameter: any; parameterIndex: number }[]
  | null
type AsyncDecoratorHandlerResult = Promise<DecoratorHandlerResult>

const mockBodyHandler = BodyHandler.handle as jest.MockedFunction<
  typeof BodyHandler.handle
>
const mockParamHandler = ParamHandler.handle as jest.MockedFunction<
  typeof ParamHandler.handle
>
const mockQueryHandler = QueryHandler.handle as jest.MockedFunction<
  typeof QueryHandler.handle
>
const mockRequestHandler = RequestHandler.handle as jest.MockedFunction<
  typeof RequestHandler.handle
>

// Mock NextResponse
jest.mock('next/server', () => {
  const mockJson = jest.fn()
  const mockNextResponseJson = jest.fn().mockReturnValue({
    status: 200,
    json: mockJson
  })
  const MockedNextResponse: any = jest.fn().mockImplementation(() => ({
    json: mockJson,
    status: 200
  }))
  MockedNextResponse.json = mockNextResponseJson

  return {
    NextResponse: MockedNextResponse
  }
})

// Get reference to mocked NextResponse after the module is imported
import { NextResponse } from 'next/server'
const MockedNextResponse = NextResponse as any

describe('Route Decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  class TestController {
    testMethod(arg1?: any, arg2?: any, arg3?: any): any {
      return { message: 'test response' }
    }

    async asyncTestMethod(arg1?: any, arg2?: any): Promise<any> {
      return { message: 'async test response' }
    }

    nextResponseMethod(): any {
      return new MockedNextResponse()
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Clear metadata between tests
    Reflect.getMetadataKeys(TestController.prototype).forEach((key) => {
      Reflect.deleteMetadata(key, TestController.prototype, 'testMethod')
      Reflect.deleteMetadata(key, TestController.prototype, 'asyncTestMethod')
      Reflect.deleteMetadata(
        key,
        TestController.prototype,
        'nextResponseMethod'
      )
    })
  })

  describe('Route decorator', () => {
    it('should set correct metadata for route with path', () => {
      const testPath = '/test-path'
      const decorator = Route(HttpMethods.GET, testPath)

      decorator(TestController.prototype, 'testMethod', {
        value: TestController.prototype.testMethod
      } as PropertyDescriptor)

      const metadata = Reflect.getMetadata(
        ROUTE_KEY,
        TestController.prototype,
        'testMethod'
      )

      expect(metadata).toEqual({
        methodName: 'testMethod',
        method: HttpMethods.GET,
        path: testPath,
        paramTypes: []
      })
    })

    it('should set correct metadata for route without path', () => {
      const decorator = Route(HttpMethods.POST, '')

      decorator(TestController.prototype, 'testMethod', {
        value: TestController.prototype.testMethod
      } as PropertyDescriptor)

      const metadata = Reflect.getMetadata(
        ROUTE_KEY,
        TestController.prototype,
        'testMethod'
      )

      expect(metadata).toEqual({
        methodName: 'testMethod',
        method: HttpMethods.POST,
        path: '',
        paramTypes: []
      })
    })

    it('should wrap original method and handle responses correctly', async () => {
      const originalMethod = jest.fn().mockResolvedValue({ success: true })
      const descriptor = {
        value: originalMethod
      }

      const decorator = Route(GET_KEY, '/test')
      decorator(TestController.prototype, 'testMethod', descriptor)

      // Verify route metadata was stored
      const metadata = Reflect.getOwnMetadata(
        ROUTE_KEY,
        TestController.prototype,
        'testMethod'
      )
      expect(metadata).toEqual({
        methodName: 'testMethod',
        method: GET_KEY,
        path: '/test',
        paramTypes: expect.any(Array) // paramTypes should be an array (can be empty)
      })

      // Test method execution
      const originalArgs = ['arg1', 'arg2']
      const result = await descriptor.value(...originalArgs)

      // Original method should be called with same args
      expect(originalMethod).toHaveBeenCalledWith('arg1', 'arg2')

      // Result should be wrapped in NextResponse.json
      expect(MockedNextResponse.json).toHaveBeenCalledWith({ success: true })
      expect(result).toBeDefined()
    })

    it('should return NextResponse as-is if original method returns NextResponse', async () => {
      const nextResponse = new MockedNextResponse()
      // Ensure the mock passes instanceof check
      Object.setPrototypeOf(nextResponse, MockedNextResponse.prototype)

      const originalMethod = jest.fn().mockResolvedValue(nextResponse)
      const descriptor = { value: originalMethod }

      const decorator = Route(GET_KEY, '/test')
      decorator(TestController.prototype, 'testMethod', descriptor)

      const result = await descriptor.value('arg1', 'arg2')

      // Should return the NextResponse directly without wrapping
      expect(result).toBe(nextResponse)
      expect(originalMethod).toHaveBeenCalledWith('arg1', 'arg2')
      // Ensure NextResponse.json was NOT called since we're returning a NextResponse directly
      expect(MockedNextResponse.json).not.toHaveBeenCalled()
    })

    it('should return NextResponse as-is if original method returns NextResponse', async () => {
      const nextResponse = new MockedNextResponse()
      // Make the mock object pass instanceof check by setting its constructor
      Object.setPrototypeOf(nextResponse, MockedNextResponse.prototype)

      const originalMethod = jest.fn().mockResolvedValue(nextResponse)
      const descriptor = { value: originalMethod }

      // No handler setup needed - route decorator no longer calls handlers

      const decorator = Route(GET_KEY, '/test')
      decorator(TestController.prototype, 'testMethod', descriptor)

      const result = await descriptor.value()

      expect(result).toBe(nextResponse)
      expect(MockedNextResponse.json).not.toHaveBeenCalled()
    })

    it('should wrap non-NextResponse return values in NextResponse.json', async () => {
      const responseData = { message: 'test response' }
      const wrappedResponse = new MockedNextResponse()

      const originalMethod = jest.fn().mockResolvedValue(responseData)
      const descriptor = { value: originalMethod }

      // No handler setup needed - route decorator no longer calls handlers
      MockedNextResponse.json.mockReturnValue(wrappedResponse)

      const decorator = Route(GET_KEY, '/test')
      decorator(TestController.prototype, 'testMethod', descriptor)

      const result = await descriptor.value()

      expect(MockedNextResponse.json).toHaveBeenCalledWith(responseData)
      expect(result).toBe(wrappedResponse)
    })

    it('should handle async original methods', async () => {
      const responseData = { message: 'async response' }
      const originalMethod = jest.fn().mockResolvedValue(responseData)
      const descriptor = { value: originalMethod }
      const wrappedResponse = new MockedNextResponse()

      // No handler setup needed - route decorator no longer calls handlers
      MockedNextResponse.json.mockReturnValue(wrappedResponse)

      const decorator = Route(GET_KEY, '/test')
      decorator(TestController.prototype, 'testMethod', descriptor)

      const result = await descriptor.value()

      expect(originalMethod).toHaveBeenCalled()
      expect(MockedNextResponse.json).toHaveBeenCalledWith(responseData)
    })

    it('should preserve method context (this)', async () => {
      const instance = new TestController()
      let capturedThis: any = null

      const originalMethod = function (this: any) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        capturedThis = this
        return { success: true }
      }
      const descriptor = { value: originalMethod }

      // No handler setup needed - route decorator no longer calls handlers
      MockedNextResponse.json.mockReturnValue(new MockedNextResponse())

      const decorator = Route(GET_KEY, '/test')
      decorator(TestController.prototype, 'testMethod', descriptor)

      await descriptor.value.call(instance)

      expect(capturedThis).toBe(instance)
    })
  })

  describe('HTTP Method Decorators', () => {
    it('should create GET decorator with correct key and path', () => {
      const testPath = '/get-path'
      const decorator = Get(testPath)

      const descriptor = {
        value: TestController.prototype.testMethod
      }

      decorator(TestController.prototype, 'testMethod', descriptor)

      const metadata = Reflect.getMetadata(
        ROUTE_KEY,
        TestController.prototype,
        'testMethod'
      )
      expect(metadata).toEqual({
        methodName: 'testMethod',
        method: HttpMethods.GET,
        path: testPath,
        paramTypes: []
      })
    })

    it('should create GET decorator without path', () => {
      const decorator = Get()

      const descriptor = {
        value: TestController.prototype.testMethod
      }

      decorator(TestController.prototype, 'testMethod', descriptor)

      const metadata = Reflect.getMetadata(
        ROUTE_KEY,
        TestController.prototype,
        'testMethod'
      )
      expect(metadata).toEqual({
        methodName: 'testMethod',
        method: HttpMethods.GET,
        path: '',
        paramTypes: []
      })
    })

    it('should create POST decorator with correct key and path', () => {
      const testPath = '/post-path'
      const decorator = Post(testPath)

      const descriptor = {
        value: TestController.prototype.testMethod
      }

      decorator(TestController.prototype, 'testMethod', descriptor)

      const metadata = Reflect.getMetadata(
        ROUTE_KEY,
        TestController.prototype,
        'testMethod'
      )
      expect(metadata).toEqual({
        methodName: 'testMethod',
        method: HttpMethods.POST,
        path: testPath,
        paramTypes: []
      })
    })

    it('should create PUT decorator with correct key and path', () => {
      const testPath = '/put-path'
      const decorator = Put(testPath)

      const descriptor = {
        value: TestController.prototype.testMethod
      }

      decorator(TestController.prototype, 'testMethod', descriptor)

      const metadata = Reflect.getMetadata(
        ROUTE_KEY,
        TestController.prototype,
        'testMethod'
      )
      expect(metadata).toEqual({
        methodName: 'testMethod',
        method: HttpMethods.PUT,
        path: testPath,
        paramTypes: []
      })
    })

    it('should create PATCH decorator with correct key and path', () => {
      const testPath = '/patch-path'
      const decorator = Patch(testPath)

      const descriptor = {
        value: TestController.prototype.testMethod
      }

      decorator(TestController.prototype, 'testMethod', descriptor)

      const metadata = Reflect.getMetadata(
        ROUTE_KEY,
        TestController.prototype,
        'testMethod'
      )
      expect(metadata).toEqual({
        methodName: 'testMethod',
        method: HttpMethods.PATCH,
        path: testPath,
        paramTypes: []
      })
    })

    it('should create DELETE decorator with correct key and path', () => {
      const testPath = '/delete-path'
      const decorator = Delete(testPath)

      const descriptor = {
        value: TestController.prototype.testMethod
      }

      decorator(TestController.prototype, 'testMethod', descriptor)

      const metadata = Reflect.getMetadata(
        ROUTE_KEY,
        TestController.prototype,
        'testMethod'
      )
      expect(metadata).toEqual({
        methodName: 'testMethod',
        method: HttpMethods.DELETE,
        path: testPath,
        paramTypes: []
      })
    })
  })

  describe('Edge Cases', () => {
    it('should preserve argument order when calling original method', async () => {
      const originalMethod = jest.fn().mockResolvedValue({ success: true })
      const descriptor = { value: originalMethod }

      const decorator = Route(GET_KEY, '/test')
      decorator(TestController.prototype, 'testMethod', descriptor)

      // Call with multiple args
      await descriptor.value('arg1', 'arg2', 'arg3')

      // Should call original method with same args in same order
      expect(originalMethod).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')
    })

    it('should handle methods with no arguments', async () => {
      const originalMethod = jest.fn().mockResolvedValue({ success: true })
      const descriptor = { value: originalMethod }

      const decorator = Route(GET_KEY, '/health')
      decorator(TestController.prototype, 'healthCheck', descriptor)

      // Call with no args
      await descriptor.value()

      // Original method should be called with no parameters
      expect(originalMethod).toHaveBeenCalledWith()
    })

    it('should handle async operations correctly', async () => {
      const originalMethod = jest.fn().mockResolvedValue({ async: true })
      const descriptor = { value: originalMethod }

      const decorator = Route(GET_KEY, '/async')
      decorator(TestController.prototype, 'asyncMethod', descriptor)

      const result = await descriptor.value('test-data')

      expect(originalMethod).toHaveBeenCalledWith('test-data')
      expect(MockedNextResponse.json).toHaveBeenCalledWith({ async: true })
      expect(result).toBeDefined()
    })

    it('should handle original method throwing errors', async () => {
      const testError = new Error('Original method error')

      // No handler setup needed - route decorator no longer calls handlers

      const descriptor = {
        value: jest.fn().mockRejectedValue(testError)
      }

      const decorator = Route(GET_KEY, '/test')
      decorator(TestController.prototype, 'testMethod', descriptor)

      // Should propagate the error
      await expect(descriptor.value()).rejects.toThrow(testError)
    })
  })
})
