import 'reflect-metadata'
import { Route, Get, Post, Put, Patch, Delete } from './route-decorator'
import { GET_KEY, ROUTE_KEY } from '../../constants/keys'
import { HttpMethods } from '../../constants/http-methods'
import { bodyDecoratorHandler } from './body-decorator'
import { paramDecoratorHandler } from './param-decorator'
import { queryDecoratorHandler } from './query-decorator'
import { requestDecoratorHandler } from './request-decorator'

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

const mockBodyDecoratorHandler = bodyDecoratorHandler as any
const mockParamDecoratorHandler = paramDecoratorHandler as any
const mockQueryDecoratorHandler = queryDecoratorHandler as any
const mockRequestDecoratorHandler = requestDecoratorHandler as any

// Mock NextResponse
jest.mock('next/server', () => {
  const mockNextResponseJson = jest.fn()
  const MockedNextResponse: any = jest.fn().mockImplementation(() => ({
    json: mockNextResponseJson
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
        method: HttpMethods.GET,
        path: testPath
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
        method: HttpMethods.POST,
        path: ''
      })
    })

    it('should wrap original method and call all decorator handlers', async () => {
      // Setup mock responses from handlers
      mockRequestDecoratorHandler.mockResolvedValue({
        parameter: 'request',
        parameterIndex: 0
      })
      mockQueryDecoratorHandler.mockResolvedValue({
        parameter: 'query',
        parameterIndex: 1
      })
      mockParamDecoratorHandler.mockResolvedValue({
        parameter: 'param',
        parameterIndex: 2
      })
      mockBodyDecoratorHandler.mockResolvedValue({
        parameter: 'body',
        parameterIndex: 3
      })

      const descriptor = {
        value: jest.fn().mockResolvedValue({ success: true })
      }

      const decorator = Route(GET_KEY, '/test')
      decorator(TestController.prototype, 'testMethod', descriptor)

      const originalArgs = ['arg1', 'arg2']
      await descriptor.value(...originalArgs)

      // Verify all handlers were called
      expect(mockRequestDecoratorHandler).toHaveBeenCalledWith(
        TestController.prototype,
        'testMethod',
        originalArgs
      )
      expect(mockQueryDecoratorHandler).toHaveBeenCalledWith(
        TestController.prototype,
        'testMethod',
        originalArgs
      )
      expect(mockParamDecoratorHandler).toHaveBeenCalledWith(
        TestController.prototype,
        'testMethod',
        originalArgs
      )
      expect(mockBodyDecoratorHandler).toHaveBeenCalledWith(
        TestController.prototype,
        'testMethod',
        originalArgs
      )
    })

    it('should sort parameters by parameterIndex and pass to original method', async () => {
      // Setup mock responses with mixed order
      mockRequestDecoratorHandler.mockResolvedValue({
        parameter: 'request',
        parameterIndex: 3
      })
      mockQueryDecoratorHandler.mockResolvedValue({
        parameter: 'query',
        parameterIndex: 1
      })
      mockParamDecoratorHandler.mockResolvedValue({
        parameter: 'param',
        parameterIndex: 0
      })
      mockBodyDecoratorHandler.mockResolvedValue({
        parameter: 'body',
        parameterIndex: 2
      })

      const originalMethod = jest.fn().mockResolvedValue({ success: true })
      const descriptor = { value: originalMethod }

      const decorator = Route(GET_KEY, '/test')
      decorator(TestController.prototype, 'testMethod', descriptor)

      await descriptor.value('arg1', 'arg2')

      // Verify parameters were sorted correctly by parameterIndex
      expect(originalMethod).toHaveBeenCalledWith(
        'param',
        'query',
        'body',
        'request'
      )
    })

    it('should filter out null and undefined parameters', async () => {
      // Setup mock responses with some null/undefined values
      mockRequestDecoratorHandler.mockResolvedValue({
        parameter: 'request',
        parameterIndex: 0
      })
      mockQueryDecoratorHandler.mockResolvedValue(null)
      mockParamDecoratorHandler.mockResolvedValue(undefined)
      mockBodyDecoratorHandler.mockResolvedValue({
        parameter: 'body',
        parameterIndex: 1
      })

      const originalMethod = jest.fn().mockResolvedValue({ success: true })
      const descriptor = { value: originalMethod }

      const decorator = Route(GET_KEY, '/test')
      decorator(TestController.prototype, 'testMethod', descriptor)

      await descriptor.value('arg1', 'arg2')

      // Verify only non-null/undefined parameters were passed
      expect(originalMethod).toHaveBeenCalledWith('request', 'body')
    })

    it('should return NextResponse as-is if original method returns NextResponse', async () => {
      const nextResponse = new MockedNextResponse()
      // Make the mock object pass instanceof check by setting its constructor
      Object.setPrototypeOf(nextResponse, MockedNextResponse.prototype)

      const originalMethod = jest.fn().mockResolvedValue(nextResponse)
      const descriptor = { value: originalMethod }

      mockRequestDecoratorHandler.mockResolvedValue(null)
      mockQueryDecoratorHandler.mockResolvedValue(null)
      mockParamDecoratorHandler.mockResolvedValue(null)
      mockBodyDecoratorHandler.mockResolvedValue(null)

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

      mockRequestDecoratorHandler.mockResolvedValue(null)
      mockQueryDecoratorHandler.mockResolvedValue(null)
      mockParamDecoratorHandler.mockResolvedValue(null)
      mockBodyDecoratorHandler.mockResolvedValue(null)
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

      mockRequestDecoratorHandler.mockResolvedValue(null)
      mockQueryDecoratorHandler.mockResolvedValue(null)
      mockParamDecoratorHandler.mockResolvedValue(null)
      mockBodyDecoratorHandler.mockResolvedValue(null)
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

      mockRequestDecoratorHandler.mockResolvedValue(null)
      mockQueryDecoratorHandler.mockResolvedValue(null)
      mockParamDecoratorHandler.mockResolvedValue(null)
      mockBodyDecoratorHandler.mockResolvedValue(null)
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
        method: HttpMethods.GET,
        path: testPath
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
        method: HttpMethods.GET,
        path: ''
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
        method: HttpMethods.POST,
        path: testPath
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
        method: HttpMethods.PUT,
        path: testPath
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
        method: HttpMethods.PATCH,
        path: testPath
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
        method: HttpMethods.DELETE,
        path: testPath
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle handlers returning arrays', async () => {
      // Setup mock responses where some handlers return arrays
      mockRequestDecoratorHandler.mockResolvedValue([
        { parameter: 'request1', parameterIndex: 0 },
        { parameter: 'request2', parameterIndex: 1 }
      ])
      mockQueryDecoratorHandler.mockResolvedValue({
        parameter: 'query',
        parameterIndex: 2
      })
      mockParamDecoratorHandler.mockResolvedValue(null)
      mockBodyDecoratorHandler.mockResolvedValue(undefined)

      const originalMethod = jest.fn().mockResolvedValue({ success: true })
      const descriptor = { value: originalMethod }

      const decorator = Route(GET_KEY, '/test')
      decorator(TestController.prototype, 'testMethod', descriptor)

      await descriptor.value('arg1', 'arg2')

      // Verify flattened and sorted parameters
      expect(originalMethod).toHaveBeenCalledWith(
        'request1',
        'request2',
        'query'
      )
    })

    it('should handle empty handler responses', async () => {
      // All handlers return null/undefined
      mockRequestDecoratorHandler.mockResolvedValue(null)
      mockQueryDecoratorHandler.mockResolvedValue(undefined)
      mockParamDecoratorHandler.mockResolvedValue(null)
      mockBodyDecoratorHandler.mockResolvedValue(undefined)

      const originalMethod = jest.fn().mockResolvedValue({ success: true })
      const descriptor = { value: originalMethod }

      const decorator = Route(GET_KEY, '/test')
      decorator(TestController.prototype, 'testMethod', descriptor)

      await descriptor.value('arg1', 'arg2')

      // Original method should be called with no parameters
      expect(originalMethod).toHaveBeenCalledWith()
    })

    it('should handle handlers throwing errors', async () => {
      const testError = new Error('Handler error')
      mockRequestDecoratorHandler.mockRejectedValue(testError)
      mockQueryDecoratorHandler.mockResolvedValue(null)
      mockParamDecoratorHandler.mockResolvedValue(null)
      mockBodyDecoratorHandler.mockResolvedValue(null)

      const descriptor = {
        value: jest.fn().mockResolvedValue({ success: true })
      }

      const decorator = Route(GET_KEY, '/test')
      decorator(TestController.prototype, 'testMethod', descriptor)

      // Should propagate the error
      await expect(descriptor.value()).rejects.toThrow(testError)
    })

    it('should handle original method throwing errors', async () => {
      const testError = new Error('Original method error')

      mockRequestDecoratorHandler.mockResolvedValue(null)
      mockQueryDecoratorHandler.mockResolvedValue(null)
      mockParamDecoratorHandler.mockResolvedValue(null)
      mockBodyDecoratorHandler.mockResolvedValue(null)

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
