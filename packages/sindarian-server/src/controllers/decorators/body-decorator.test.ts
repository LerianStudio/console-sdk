import 'reflect-metadata'
import { z } from 'zod'
import { BODY_KEY } from '../../constants/keys'
import { bodyDecoratorHandler, Body, BodyMetadata } from './body-decorator'
import { getNextRequestArgument } from '../../utils/nextjs/get-next-arguments'
import { ValidationApiException } from '../../exceptions'

// Mock the utility function
jest.mock('../../utils/nextjs/get-next-arguments')
const mockGetNextRequestArgument =
  getNextRequestArgument as jest.MockedFunction<typeof getNextRequestArgument>

describe('bodyDecoratorHandler', () => {
  const mockRequest = {
    json: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
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
    const result = await bodyDecoratorHandler(
      TestClass.prototype,
      'testMethod',
      [mockRequest]
    )

    expect(result).toBeNull()
  })

  it('should return parsed body when metadata exists without schema', async () => {
    const mockBody = { name: 'John', age: 30 }
    mockRequest.json.mockResolvedValue(mockBody)

    // Set metadata without schema
    const metadata: BodyMetadata = {
      propertyIndex: 0
    }
    Reflect.defineMetadata(
      BODY_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    const result = await bodyDecoratorHandler(
      TestClass.prototype,
      'testMethod',
      [mockRequest]
    )

    expect(result).toEqual({
      parameter: mockBody,
      parameterIndex: 0
    })
    expect(mockRequest.json).toHaveBeenCalledTimes(1)
  })

  it('should return validated body when metadata exists with valid schema', async () => {
    const mockBody = { name: 'John', age: 30 }
    const schema = z.object({
      name: z.string(),
      age: z.number()
    })
    mockRequest.json.mockResolvedValue(mockBody)

    // Set metadata with schema
    const metadata: BodyMetadata = {
      propertyIndex: 1,
      schema: () => schema
    }
    Reflect.defineMetadata(
      BODY_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    const result = await bodyDecoratorHandler(
      TestClass.prototype,
      'testMethod',
      [mockRequest]
    )

    expect(result).toEqual({
      parameter: mockBody,
      parameterIndex: 1
    })
    expect(mockRequest.json).toHaveBeenCalledTimes(1)
  })

  it('should throw ValidationApiException when schema validation fails', async () => {
    const mockBody = { name: 'John', age: 'invalid' } // age should be number
    const schema = z.object({
      name: z.string(),
      age: z.number()
    })
    mockRequest.json.mockResolvedValue(mockBody)

    // Set metadata with schema
    const metadata: BodyMetadata = {
      propertyIndex: 0,
      schema: () => schema
    }
    Reflect.defineMetadata(
      BODY_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    await expect(
      bodyDecoratorHandler(TestClass.prototype, 'testMethod', [mockRequest])
    ).rejects.toThrow(ValidationApiException)

    expect(mockRequest.json).toHaveBeenCalledTimes(1)
  })

  it('should include validation error details in exception message', async () => {
    const mockBody = { name: 123, age: 'invalid' } // both fields invalid
    const schema = z.object({
      name: z.string(),
      age: z.number()
    })
    mockRequest.json.mockResolvedValue(mockBody)

    // Set metadata with schema
    const metadata: BodyMetadata = {
      propertyIndex: 0,
      schema: () => schema
    }
    Reflect.defineMetadata(
      BODY_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    try {
      await bodyDecoratorHandler(TestClass.prototype, 'testMethod', [
        mockRequest
      ])
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationApiException)
      const validationError = error as ValidationApiException
      expect(validationError.message).toContain('Invalid body:')
      expect(validationError.message).toContain('name')
      expect(validationError.message).toContain('age')
    }

    expect(mockRequest.json).toHaveBeenCalledTimes(1)
  })

  it('should handle request.json() rejection', async () => {
    const jsonError = new Error('Failed to parse JSON')
    mockRequest.json.mockRejectedValue(jsonError)

    // Set metadata without schema
    const metadata: BodyMetadata = {
      propertyIndex: 0
    }
    Reflect.defineMetadata(
      BODY_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    await expect(
      bodyDecoratorHandler(TestClass.prototype, 'testMethod', [mockRequest])
    ).rejects.toThrow('Missing or invalid request body')

    expect(mockRequest.json).toHaveBeenCalledTimes(1)
  })

  it('should work with complex nested schema validation', async () => {
    const mockBody = {
      user: {
        name: 'John',
        profile: {
          age: 30,
          email: 'john@example.com'
        }
      },
      tags: ['admin', 'user']
    }
    const schema = z.object({
      user: z.object({
        name: z.string(),
        profile: z.object({
          age: z.number().min(18),
          email: z.string().email()
        })
      }),
      tags: z.array(z.string())
    })
    mockRequest.json.mockResolvedValue(mockBody)

    // Set metadata with complex schema
    const metadata: BodyMetadata = {
      propertyIndex: 2,
      schema: () => schema
    }
    Reflect.defineMetadata(
      BODY_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    const result = await bodyDecoratorHandler(
      TestClass.prototype,
      'testMethod',
      [mockRequest]
    )

    expect(result).toEqual({
      parameter: mockBody,
      parameterIndex: 2
    })
    expect(mockRequest.json).toHaveBeenCalledTimes(1)
  })

  it('should handle empty body object', async () => {
    const mockBody = {}
    mockRequest.json.mockResolvedValue(mockBody)

    // Set metadata without schema
    const metadata: BodyMetadata = {
      propertyIndex: 0
    }
    Reflect.defineMetadata(
      BODY_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    const result = await bodyDecoratorHandler(
      TestClass.prototype,
      'testMethod',
      [mockRequest]
    )

    expect(result).toEqual({
      parameter: mockBody,
      parameterIndex: 0
    })
    expect(mockRequest.json).toHaveBeenCalledTimes(1)
  })

  it('should handle null body', async () => {
    const mockBody = null
    mockRequest.json.mockResolvedValue(mockBody)

    // Set metadata without schema
    const metadata: BodyMetadata = {
      propertyIndex: 0
    }
    Reflect.defineMetadata(
      BODY_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    const result = await bodyDecoratorHandler(
      TestClass.prototype,
      'testMethod',
      [mockRequest]
    )

    expect(result).toEqual({
      parameter: mockBody,
      parameterIndex: 0
    })
    expect(mockRequest.json).toHaveBeenCalledTimes(1)
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
      propertyIndex: 0,
      schema: undefined
    })
  })

  it('should set metadata with schema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number()
    })

    // Apply the decorator manually
    const decorator = Body(schema)
    decorator(TestClass.prototype, 'testMethodWithSchema', 1)

    const metadata = Reflect.getOwnMetadata(
      BODY_KEY,
      TestClass.prototype,
      'testMethodWithSchema'
    )

    expect(metadata.propertyIndex).toBe(1)
    expect(typeof metadata.schema).toBe('function')
    expect(metadata.schema()).toEqual(schema)
  })

  it('should set different metadata for different methods', () => {
    const schema1 = z.string()
    const schema2 = z.number()

    // Apply decorators to different methods
    const decorator1 = Body(schema1)
    const decorator2 = Body(schema2)

    decorator1(TestClass.prototype, 'testMethod', 0)
    decorator2(TestClass.prototype, 'testMethodWithSchema', 1)

    const metadata1 = Reflect.getOwnMetadata(
      BODY_KEY,
      TestClass.prototype,
      'testMethod'
    )
    const metadata2 = Reflect.getOwnMetadata(
      BODY_KEY,
      TestClass.prototype,
      'testMethodWithSchema'
    )

    expect(metadata1.propertyIndex).toBe(0)
    expect(typeof metadata1.schema).toBe('function')
    expect(metadata1.schema()).toEqual(schema1)

    expect(metadata2.propertyIndex).toBe(1)
    expect(typeof metadata2.schema).toBe('function')
    expect(metadata2.schema()).toEqual(schema2)
  })

  it('should handle multiple parameters with different indices', () => {
    const schema = z.string()

    // Apply decorator to different parameter indices
    const decorator1 = Body()
    const decorator2 = Body(schema)

    decorator1(TestClass.prototype, 'testMethod', 0)
    decorator2(TestClass.prototype, 'testMethod', 2) // Skip index 1

    // The second decorator should overwrite the first since they use the same metadata key
    const metadata = Reflect.getOwnMetadata(
      BODY_KEY,
      TestClass.prototype,
      'testMethod'
    )

    expect(metadata.propertyIndex).toBe(2)
    expect(typeof metadata.schema).toBe('function')
    expect(metadata.schema()).toEqual(schema)
  })

  it('should work with complex Zod schemas', () => {
    const complexSchema = z.object({
      user: z.object({
        id: z.string().uuid(),
        name: z.string().min(1),
        email: z.string().email(),
        age: z.number().min(18).max(120)
      }),
      preferences: z
        .object({
          theme: z.enum(['light', 'dark']),
          notifications: z.boolean(),
          tags: z.array(z.string()).optional()
        })
        .optional(),
      metadata: z.record(z.string(), z.any()).optional()
    })

    const decorator = Body(complexSchema)
    decorator(TestClass.prototype, 'testMethod', 0)

    const metadata = Reflect.getOwnMetadata(
      BODY_KEY,
      TestClass.prototype,
      'testMethod'
    )

    expect(metadata.propertyIndex).toBe(0)
    expect(typeof metadata.schema).toBe('function')
    expect(metadata.schema()).toEqual(complexSchema)
  })
})
