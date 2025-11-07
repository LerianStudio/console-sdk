import 'reflect-metadata'
import z from 'zod'
import { QUERY_KEY } from '../../constants/keys'
import { QueryHandler, Query, QueryMetadata } from './query-decorator'
import { getNextRequestArgument } from '../../utils/nextjs/get-next-arguments'
import { ValidationApiException } from '../../exceptions'

// Mock the utility function
jest.mock('../../utils/nextjs/get-next-arguments')
const mockGetNextRequestArgument =
  getNextRequestArgument as jest.MockedFunction<typeof getNextRequestArgument>

describe('QueryHandler.handle', () => {
  const mockBaseUrl = 'https://example.com/api/test'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    // Clear all metadata after each test to avoid interference
    const methods = ['testMethod', 'anotherMethod', 'multiQueryMethod']
    methods.forEach((method) => {
      try {
        Reflect.deleteMetadata(QUERY_KEY, TestClass.prototype, method)
      } catch (error) {
        // Ignore errors if metadata doesn't exist
      }
    })
  })

  class TestClass {
    testMethod() {}
    anotherMethod() {}
    multiQueryMethod() {}
  }

  describe('when no metadata is found', () => {
    it('should return null', () => {
      const mockRequest = { url: `${mockBaseUrl}?param1=value1` }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      const result = QueryHandler.handle(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      expect(result).toBeNull()
    })
  })

  describe('when metadata exists without schema', () => {
    beforeEach(() => {
      // Set up metadata without schema
      const metadata: QueryMetadata = {
        propertyKey: 'testMethod',
        parameterIndex: 0
      }
      Reflect.defineMetadata(
        QUERY_KEY,
        metadata,
        TestClass.prototype,
        'testMethod'
      )
    })

    it('should return query parameters as object without validation', () => {
      const mockRequest = {
        url: `${mockBaseUrl}?name=john&age=25&active=true`
      }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      const result = QueryHandler.handle(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      expect(result).toEqual({
        type: 'query',
        parameter: {
          name: 'john',
          age: '25',
          active: 'true'
        },
        parameterIndex: 0
      })
    })

    it('should return empty object when no query parameters are present', () => {
      const mockRequest = { url: mockBaseUrl }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      const result = QueryHandler.handle(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      expect(result).toEqual({
        type: 'query',
        parameter: {},
        parameterIndex: 0
      })
    })

    it('should handle multiple values for same parameter', () => {
      const mockRequest = {
        url: `${mockBaseUrl}?category=tech&category=news&tag=important`
      }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      const result = QueryHandler.handle(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      // URL.searchParams.entries() returns last value for duplicate keys
      expect(result).toEqual({
        type: 'query',
        parameter: {
          category: 'news',
          tag: 'important'
        },
        parameterIndex: 0
      })
    })

    it('should handle special characters in query parameters', () => {
      const mockRequest = {
        url: `${mockBaseUrl}?message=hello%20world&symbol=%26%23%40`
      }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      const result = QueryHandler.handle(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      expect(result).toEqual({
        type: 'query',
        parameter: {
          message: 'hello world',
          symbol: '&#@'
        },
        parameterIndex: 0
      })
    })
  })


  describe('edge cases', () => {
    beforeEach(() => {
      const metadata: QueryMetadata = {
        propertyKey: 'testMethod',
        parameterIndex: 0
      }
      Reflect.defineMetadata(
        QUERY_KEY,
        metadata,
        TestClass.prototype,
        'testMethod'
      )
    })

    it('should handle malformed URLs gracefully', () => {
      const mockRequest = { url: 'not-a-valid-url' }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      expect(() => {
        QueryHandler.handle(TestClass.prototype, 'testMethod', [mockRequest])
      }).toThrow()
    })

    it('should handle empty query string', () => {
      const mockRequest = { url: `${mockBaseUrl}?` }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      const result = QueryHandler.handle(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      expect(result).toEqual({
        type: 'query',
        parameter: {},
        parameterIndex: 0
      })
    })

    it('should handle query parameters with empty values', () => {
      const mockRequest = { url: `${mockBaseUrl}?name=&age=&active=` }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      const result = QueryHandler.handle(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      expect(result).toEqual({
        type: 'query',
        parameter: {
          name: '',
          age: '',
          active: ''
        },
        parameterIndex: 0
      })
    })
  })

})

describe('Query decorator', () => {
  afterEach(() => {
    // Clear all metadata after each test
    const methods = [
      'testMethod',
      'anotherMethod',
      'withSchema',
      'withoutSchema'
    ]
    methods.forEach((method) => {
      try {
        Reflect.deleteMetadata(QUERY_KEY, TestClass.prototype, method)
      } catch (error) {
        // Ignore errors if metadata doesn't exist
      }
    })
  })

  class TestClass {
    testMethod() {}
    anotherMethod() {}
    withSchema() {}
    withoutSchema() {}
  }

  describe('when used without schema', () => {
    it('should set metadata correctly', () => {
      const decorator = Query()
      decorator(TestClass.prototype, 'testMethod', 0)

      const metadata = Reflect.getOwnMetadata(
        QUERY_KEY,
        TestClass.prototype,
        'testMethod'
      ) as QueryMetadata

      expect(metadata).toEqual({
        propertyKey: 'testMethod',
        parameterIndex: 0
      })
    })
  })


  describe('when used on multiple parameters', () => {
    it('should handle different parameter indices correctly', () => {
      const decoratorA = Query()
      const decoratorB = Query()

      decoratorA(TestClass.prototype, 'testMethod', 0)
      decoratorB(TestClass.prototype, 'anotherMethod', 2)

      const metadataA = Reflect.getOwnMetadata(
        QUERY_KEY,
        TestClass.prototype,
        'testMethod'
      ) as QueryMetadata

      const metadataB = Reflect.getOwnMetadata(
        QUERY_KEY,
        TestClass.prototype,
        'anotherMethod'
      ) as QueryMetadata

      expect(metadataA.parameterIndex).toBe(0)
      expect(metadataB.parameterIndex).toBe(2)
    })
  })

  describe('with symbol property keys', () => {
    it('should handle symbol property keys correctly', () => {
      const symbolKey = Symbol('testSymbol')

      const decorator = Query()
      decorator(TestClass.prototype, symbolKey, 0)

      const metadata = Reflect.getOwnMetadata(
        QUERY_KEY,
        TestClass.prototype,
        symbolKey
      ) as QueryMetadata

      expect(metadata.propertyKey).toBe(symbolKey)
      expect(metadata.parameterIndex).toBe(0)
    })
  })
})
