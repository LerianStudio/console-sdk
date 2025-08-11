import 'reflect-metadata'
import z from 'zod'
import { QUERY_KEY } from '../../constants/keys'
import { queryDecoratorHandler, Query, QueryMetadata } from './query-decorator'
import { getNextRequestArgument } from '../../utils/nextjs/get-next-arguments'
import { ValidationApiException } from '../../exceptions'

// Mock the utility function
jest.mock('../../utils/nextjs/get-next-arguments')
const mockGetNextRequestArgument =
  getNextRequestArgument as jest.MockedFunction<typeof getNextRequestArgument>

describe('queryDecoratorHandler', () => {
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

      const result = queryDecoratorHandler(TestClass.prototype, 'testMethod', [
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

      const result = queryDecoratorHandler(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      expect(result).toEqual({
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

      const result = queryDecoratorHandler(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      expect(result).toEqual({
        parameter: {},
        parameterIndex: 0
      })
    })

    it('should handle multiple values for same parameter', () => {
      const mockRequest = {
        url: `${mockBaseUrl}?category=tech&category=news&tag=important`
      }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      const result = queryDecoratorHandler(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      // URL.searchParams.entries() returns last value for duplicate keys
      expect(result).toEqual({
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

      const result = queryDecoratorHandler(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      expect(result).toEqual({
        parameter: {
          message: 'hello world',
          symbol: '&#@'
        },
        parameterIndex: 0
      })
    })
  })

  describe('when metadata exists with schema', () => {
    const querySchema = z.object({
      name: z.string().min(1),
      age: z.coerce.number().min(0),
      active: z
        .string()
        .transform((val) => val === 'true')
        .optional()
    })

    beforeEach(() => {
      // Set up metadata with schema
      const metadata: QueryMetadata = {
        propertyKey: 'testMethod',
        parameterIndex: 1,
        schema: querySchema
      }
      Reflect.defineMetadata(
        QUERY_KEY,
        metadata,
        TestClass.prototype,
        'testMethod'
      )
    })

    it('should return validated and transformed query data when validation passes', () => {
      const mockRequest = {
        url: `${mockBaseUrl}?name=john&age=25&active=true`
      }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      const result = queryDecoratorHandler(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      expect(result).toEqual({
        parameter: {
          name: 'john',
          age: 25,
          active: true
        },
        parameterIndex: 1
      })
    })

    it('should handle optional parameters correctly', () => {
      const mockRequest = {
        url: `${mockBaseUrl}?name=jane&age=30`
      }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      const result = queryDecoratorHandler(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      expect(result).toEqual({
        parameter: {
          name: 'jane',
          age: 30
        },
        parameterIndex: 1
      })
    })

    it('should throw ValidationApiException when validation fails', () => {
      const mockRequest = {
        url: `${mockBaseUrl}?name=&age=invalid&active=maybe`
      }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      expect(() => {
        queryDecoratorHandler(TestClass.prototype, 'testMethod', [mockRequest])
      }).toThrow(ValidationApiException)
    })

    it('should throw ValidationApiException with detailed error message', () => {
      const mockRequest = {
        url: `${mockBaseUrl}?name=&age=invalid`
      }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      try {
        queryDecoratorHandler(TestClass.prototype, 'testMethod', [mockRequest])
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationApiException)
        const validationError = error as ValidationApiException
        expect(validationError.message).toContain('Invalid query parameters:')
        expect(validationError.message).toContain('name')
        expect(validationError.message).toContain('age')
      }
    })

    it('should throw ValidationApiException when required fields are missing', () => {
      const mockRequest = {
        url: `${mockBaseUrl}?active=true`
      }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      expect(() => {
        queryDecoratorHandler(TestClass.prototype, 'testMethod', [mockRequest])
      }).toThrow(ValidationApiException)
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
        queryDecoratorHandler(TestClass.prototype, 'testMethod', [mockRequest])
      }).toThrow()
    })

    it('should handle empty query string', () => {
      const mockRequest = { url: `${mockBaseUrl}?` }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      const result = queryDecoratorHandler(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      expect(result).toEqual({
        parameter: {},
        parameterIndex: 0
      })
    })

    it('should handle query parameters with empty values', () => {
      const mockRequest = { url: `${mockBaseUrl}?name=&age=&active=` }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      const result = queryDecoratorHandler(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      expect(result).toEqual({
        parameter: {
          name: '',
          age: '',
          active: ''
        },
        parameterIndex: 0
      })
    })
  })

  describe('complex schema validation', () => {
    const complexSchema = z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(10),
      sort: z.enum(['asc', 'desc']).default('asc'),
      search: z.string().optional(),
      tags: z
        .string()
        .transform((val) => val.split(',').filter(Boolean))
        .optional()
    })

    beforeEach(() => {
      const metadata: QueryMetadata = {
        propertyKey: 'testMethod',
        parameterIndex: 0,
        schema: complexSchema
      }
      Reflect.defineMetadata(
        QUERY_KEY,
        metadata,
        TestClass.prototype,
        'testMethod'
      )
    })

    it('should handle complex transformations and defaults', () => {
      const mockRequest = {
        url: `${mockBaseUrl}?page=2&limit=20&search=test&tags=tag1,tag2,tag3`
      }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      const result = queryDecoratorHandler(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      expect(result).toEqual({
        parameter: {
          page: 2,
          limit: 20,
          sort: 'asc', // default value
          search: 'test',
          tags: ['tag1', 'tag2', 'tag3']
        },
        parameterIndex: 0
      })
    })

    it('should apply defaults when parameters are missing', () => {
      const mockRequest = { url: `${mockBaseUrl}?search=minimal` }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      const result = queryDecoratorHandler(TestClass.prototype, 'testMethod', [
        mockRequest
      ])

      expect(result).toEqual({
        parameter: {
          page: 1,
          limit: 10,
          sort: 'asc',
          search: 'minimal'
        },
        parameterIndex: 0
      })
    })

    it('should validate enum values', () => {
      const mockRequest = {
        url: `${mockBaseUrl}?sort=invalid`
      }
      mockGetNextRequestArgument.mockReturnValue(mockRequest as any)

      expect(() => {
        queryDecoratorHandler(TestClass.prototype, 'testMethod', [mockRequest])
      }).toThrow(ValidationApiException)
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
        parameterIndex: 0,
        schema: undefined
      })
    })
  })

  describe('when used with schema', () => {
    it('should set metadata with schema correctly', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      })

      const decorator = Query(schema)
      decorator(TestClass.prototype, 'withSchema', 1)

      const metadata = Reflect.getOwnMetadata(
        QUERY_KEY,
        TestClass.prototype,
        'withSchema'
      ) as QueryMetadata

      expect(metadata).toEqual({
        propertyKey: 'withSchema',
        parameterIndex: 1,
        schema: schema
      })
    })
  })

  describe('when used on multiple parameters', () => {
    it('should handle different parameter indices correctly', () => {
      const schemaA = z.object({ filter: z.string() })
      const schemaB = z.object({ sort: z.string() })

      const decoratorA = Query(schemaA)
      const decoratorB = Query(schemaB)

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
      expect(metadataA.schema).toBe(schemaA)

      expect(metadataB.parameterIndex).toBe(2)
      expect(metadataB.schema).toBe(schemaB)
    })
  })

  describe('with symbol property keys', () => {
    it('should handle symbol property keys correctly', () => {
      const symbolKey = Symbol('testSymbol')
      const schema = z.object({ test: z.string() })

      const decorator = Query(schema)
      decorator(TestClass.prototype, symbolKey, 0)

      const metadata = Reflect.getOwnMetadata(
        QUERY_KEY,
        TestClass.prototype,
        symbolKey
      ) as QueryMetadata

      expect(metadata).toEqual({
        propertyKey: symbolKey,
        parameterIndex: 0,
        schema: schema
      })
    })
  })
})
