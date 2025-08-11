import 'reflect-metadata'
import { PARAM_KEY } from '../../constants/keys'
import { paramDecoratorHandler, Param, ParamMetadata } from './param-decorator'
import { getNextParamArgument } from '../../utils/nextjs/get-next-arguments'
import { ValidationApiException } from '../../exceptions'

// Mock the utility function
jest.mock('../../utils/nextjs/get-next-arguments')
const mockGetNextParamArgument = getNextParamArgument as jest.MockedFunction<
  typeof getNextParamArgument
>

describe('paramDecoratorHandler', () => {
  const mockParams = {
    id: '123',
    slug: 'test-slug',
    category: 'electronics'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetNextParamArgument.mockResolvedValue(mockParams)
  })

  afterEach(() => {
    // Clear all metadata after each test to avoid interference
    const methods = ['testMethod', 'anotherMethod', 'multiParamMethod']
    methods.forEach((method) => {
      try {
        Reflect.deleteMetadata(PARAM_KEY, TestClass.prototype, method)
      } catch (error) {
        // Ignore errors if metadata doesn't exist
      }
    })
  })

  class TestClass {
    testMethod() {}
    anotherMethod() {}
    multiParamMethod() {}
  }

  it('should return null when no metadata is found', async () => {
    const result = await paramDecoratorHandler(
      TestClass.prototype,
      'testMethod',
      [null, { params: mockParams }]
    )

    expect(result).toBeNull()
  })

  it('should return parameter data when metadata exists for single param', async () => {
    // Set metadata for single parameter
    const metadata: ParamMetadata[] = [
      {
        name: 'id',
        parameterIndex: 0
      }
    ]
    Reflect.defineMetadata(
      PARAM_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    const result = await paramDecoratorHandler(
      TestClass.prototype,
      'testMethod',
      [null, { params: mockParams }]
    )

    expect(result).toEqual([
      {
        parameter: '123',
        parameterIndex: 0
      }
    ])
    expect(mockGetNextParamArgument).toHaveBeenCalledTimes(1)
    expect(mockGetNextParamArgument).toHaveBeenCalledWith([
      null,
      { params: mockParams }
    ])
  })

  it('should return parameter data for multiple params', async () => {
    // Set metadata for multiple parameters
    const metadata: ParamMetadata[] = [
      {
        name: 'id',
        parameterIndex: 0
      },
      {
        name: 'slug',
        parameterIndex: 2
      }
    ]
    Reflect.defineMetadata(
      PARAM_KEY,
      metadata,
      TestClass.prototype,
      'multiParamMethod'
    )

    const result = await paramDecoratorHandler(
      TestClass.prototype,
      'multiParamMethod',
      [null, { params: mockParams }]
    )

    expect(result).toEqual([
      {
        parameter: '123',
        parameterIndex: 0
      },
      {
        parameter: 'test-slug',
        parameterIndex: 2
      }
    ])
    expect(mockGetNextParamArgument).toHaveBeenCalledTimes(1)
  })

  it('should throw ValidationApiException when required param is missing', async () => {
    const incompleteParams = { id: '123' } // missing slug
    mockGetNextParamArgument.mockResolvedValue(incompleteParams)

    // Set metadata for parameter that doesn't exist in params
    const metadata: ParamMetadata[] = [
      {
        name: 'slug',
        parameterIndex: 0
      }
    ]
    Reflect.defineMetadata(
      PARAM_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    await expect(
      paramDecoratorHandler(TestClass.prototype, 'testMethod', [
        null,
        { params: incompleteParams }
      ])
    ).rejects.toThrow(ValidationApiException)

    await expect(
      paramDecoratorHandler(TestClass.prototype, 'testMethod', [
        null,
        { params: incompleteParams }
      ])
    ).rejects.toThrow('Invalid param: slug is required')
  })

  it('should throw ValidationApiException with correct message for missing param', async () => {
    const emptyParams = {}
    mockGetNextParamArgument.mockResolvedValue(emptyParams)

    const metadata: ParamMetadata[] = [
      {
        name: 'userId',
        parameterIndex: 0
      }
    ]
    Reflect.defineMetadata(
      PARAM_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    try {
      await paramDecoratorHandler(TestClass.prototype, 'testMethod', [
        null,
        { params: emptyParams }
      ])
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationApiException)
      const validationError = error as ValidationApiException
      expect(validationError.message).toBe('Invalid param: userId is required')
      expect(validationError.code).toBe('0007')
      expect(validationError.title).toBe('Validation Error')
    }
  })

  it('should throw for first missing param in multiple param scenario', async () => {
    const partialParams = { slug: 'test-slug' } // missing id
    mockGetNextParamArgument.mockResolvedValue(partialParams)

    const metadata: ParamMetadata[] = [
      {
        name: 'id',
        parameterIndex: 0
      },
      {
        name: 'slug',
        parameterIndex: 1
      }
    ]
    Reflect.defineMetadata(
      PARAM_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    await expect(
      paramDecoratorHandler(TestClass.prototype, 'testMethod', [
        null,
        { params: partialParams }
      ])
    ).rejects.toThrow('Invalid param: id is required')
  })

  it('should handle empty metadata array', async () => {
    // Set empty metadata array
    const metadata: ParamMetadata[] = []
    Reflect.defineMetadata(
      PARAM_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    const result = await paramDecoratorHandler(
      TestClass.prototype,
      'testMethod',
      [null, { params: mockParams }]
    )

    expect(result).toBeNull()
  })

  it('should handle params with falsy but valid values', async () => {
    const paramsWithFalsyValues = {
      id: '0', // string zero is valid
      flag: 'false', // string false is valid
      count: '0' // string zero is valid
    }
    mockGetNextParamArgument.mockResolvedValue(paramsWithFalsyValues)

    const metadata: ParamMetadata[] = [
      {
        name: 'id',
        parameterIndex: 0
      },
      {
        name: 'flag',
        parameterIndex: 1
      }
    ]
    Reflect.defineMetadata(
      PARAM_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    const result = await paramDecoratorHandler(
      TestClass.prototype,
      'testMethod',
      [null, { params: paramsWithFalsyValues }]
    )

    expect(result).toEqual([
      {
        parameter: '0',
        parameterIndex: 0
      },
      {
        parameter: 'false',
        parameterIndex: 1
      }
    ])
  })

  it('should reject truly falsy values (empty string, null, undefined)', async () => {
    const paramsWithTrulyFalsyValues = {
      id: '', // empty string should fail
      name: null, // null should fail
      category: undefined // undefined should fail
    }
    mockGetNextParamArgument.mockResolvedValue(paramsWithTrulyFalsyValues)

    const metadata: ParamMetadata[] = [
      {
        name: 'id',
        parameterIndex: 0
      }
    ]
    Reflect.defineMetadata(
      PARAM_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    await expect(
      paramDecoratorHandler(TestClass.prototype, 'testMethod', [
        null,
        { params: paramsWithTrulyFalsyValues }
      ])
    ).rejects.toThrow('Invalid param: id is required')
  })

  it('should work with symbol property keys', async () => {
    const symbolKey = Symbol('testSymbol')

    const metadata: ParamMetadata[] = [
      {
        name: 'id',
        parameterIndex: 0
      }
    ]
    Reflect.defineMetadata(PARAM_KEY, metadata, TestClass.prototype, symbolKey)

    const result = await paramDecoratorHandler(TestClass.prototype, symbolKey, [
      null,
      { params: mockParams }
    ])

    expect(result).toEqual([
      {
        parameter: '123',
        parameterIndex: 0
      }
    ])
  })

  it('should handle getNextParamArgument returning undefined', async () => {
    mockGetNextParamArgument.mockResolvedValue(undefined)

    const metadata: ParamMetadata[] = [
      {
        name: 'id',
        parameterIndex: 0
      }
    ]
    Reflect.defineMetadata(
      PARAM_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    await expect(
      paramDecoratorHandler(TestClass.prototype, 'testMethod', [])
    ).rejects.toThrow('Invalid param: id is required')
  })

  it('should handle different parameter indices correctly', async () => {
    const metadata: ParamMetadata[] = [
      {
        name: 'category',
        parameterIndex: 5
      },
      {
        name: 'id',
        parameterIndex: 1
      },
      {
        name: 'slug',
        parameterIndex: 10
      }
    ]
    Reflect.defineMetadata(
      PARAM_KEY,
      metadata,
      TestClass.prototype,
      'testMethod'
    )

    const result = await paramDecoratorHandler(
      TestClass.prototype,
      'testMethod',
      [null, { params: mockParams }]
    )

    expect(result).toEqual([
      {
        parameter: 'electronics',
        parameterIndex: 5
      },
      {
        parameter: '123',
        parameterIndex: 1
      },
      {
        parameter: 'test-slug',
        parameterIndex: 10
      }
    ])
  })
})

describe('Param decorator', () => {
  class TestClass {
    testMethod(id: string) {}
    multiParamMethod(id: string, slug: string, category: string) {}
    anotherMethod(userId: string) {}
  }

  beforeEach(() => {
    // Clear metadata before each test
    const methods = ['testMethod', 'multiParamMethod', 'anotherMethod']
    methods.forEach((method) => {
      try {
        Reflect.deleteMetadata(PARAM_KEY, TestClass.prototype, method)
      } catch (error) {
        // Ignore errors if metadata doesn't exist
      }
    })
  })

  it('should set metadata for single parameter', () => {
    // Apply the decorator manually
    const decorator = Param('id')
    decorator(TestClass.prototype, 'testMethod', 0)

    const metadata = Reflect.getOwnMetadata(
      PARAM_KEY,
      TestClass.prototype,
      'testMethod'
    )

    expect(metadata).toEqual([
      {
        name: 'id',
        parameterIndex: 0
      }
    ])
  })

  it('should accumulate metadata for multiple parameters', () => {
    // Apply multiple decorators to same method
    const decorator1 = Param('id')
    const decorator2 = Param('slug')
    const decorator3 = Param('category')

    decorator1(TestClass.prototype, 'multiParamMethod', 0)
    decorator2(TestClass.prototype, 'multiParamMethod', 1)
    decorator3(TestClass.prototype, 'multiParamMethod', 2)

    const metadata = Reflect.getOwnMetadata(
      PARAM_KEY,
      TestClass.prototype,
      'multiParamMethod'
    )

    expect(metadata).toEqual([
      {
        name: 'id',
        parameterIndex: 0
      },
      {
        name: 'slug',
        parameterIndex: 1
      },
      {
        name: 'category',
        parameterIndex: 2
      }
    ])
  })

  it('should set independent metadata for different methods', () => {
    const decorator1 = Param('id')
    const decorator2 = Param('userId')

    decorator1(TestClass.prototype, 'testMethod', 0)
    decorator2(TestClass.prototype, 'anotherMethod', 0)

    const metadata1 = Reflect.getOwnMetadata(
      PARAM_KEY,
      TestClass.prototype,
      'testMethod'
    )
    const metadata2 = Reflect.getOwnMetadata(
      PARAM_KEY,
      TestClass.prototype,
      'anotherMethod'
    )

    expect(metadata1).toEqual([
      {
        name: 'id',
        parameterIndex: 0
      }
    ])
    expect(metadata2).toEqual([
      {
        name: 'userId',
        parameterIndex: 0
      }
    ])

    // Verify they don't interfere with each other
    expect(metadata1).not.toEqual(metadata2)
  })

  it('should handle parameters at different indices', () => {
    const decorator1 = Param('category')
    const decorator2 = Param('id')

    // Apply decorators in reverse order of parameter indices
    decorator1(TestClass.prototype, 'testMethod', 2)
    decorator2(TestClass.prototype, 'testMethod', 0)

    const metadata = Reflect.getOwnMetadata(
      PARAM_KEY,
      TestClass.prototype,
      'testMethod'
    )

    expect(metadata).toEqual([
      {
        name: 'category',
        parameterIndex: 2
      },
      {
        name: 'id',
        parameterIndex: 0
      }
    ])
  })

  it('should work with symbol property keys', () => {
    const symbolKey = Symbol('testSymbol')

    const decorator = Param('id')
    decorator(TestClass.prototype, symbolKey, 0)

    const metadata = Reflect.getOwnMetadata(
      PARAM_KEY,
      TestClass.prototype,
      symbolKey
    )

    expect(metadata).toEqual([
      {
        name: 'id',
        parameterIndex: 0
      }
    ])
  })

  it('should handle empty parameter names', () => {
    const decorator = Param('')
    decorator(TestClass.prototype, 'testMethod', 0)

    const metadata = Reflect.getOwnMetadata(
      PARAM_KEY,
      TestClass.prototype,
      'testMethod'
    )

    expect(metadata).toEqual([
      {
        name: '',
        parameterIndex: 0
      }
    ])
  })

  it('should handle special characters in parameter names', () => {
    const decorator1 = Param('user-id')
    const decorator2 = Param('item_slug')
    const decorator3 = Param('category.name')

    decorator1(TestClass.prototype, 'testMethod', 0)
    decorator2(TestClass.prototype, 'testMethod', 1)
    decorator3(TestClass.prototype, 'testMethod', 2)

    const metadata = Reflect.getOwnMetadata(
      PARAM_KEY,
      TestClass.prototype,
      'testMethod'
    )

    expect(metadata).toEqual([
      {
        name: 'user-id',
        parameterIndex: 0
      },
      {
        name: 'item_slug',
        parameterIndex: 1
      },
      {
        name: 'category.name',
        parameterIndex: 2
      }
    ])
  })

  it('should accumulate parameters when applied multiple times', () => {
    const decorator1 = Param('first')
    const decorator2 = Param('second')
    const decorator3 = Param('third')

    // Apply decorators sequentially
    decorator1(TestClass.prototype, 'testMethod', 0)

    let metadata = Reflect.getOwnMetadata(
      PARAM_KEY,
      TestClass.prototype,
      'testMethod'
    )
    expect(metadata).toHaveLength(1)

    decorator2(TestClass.prototype, 'testMethod', 1)

    metadata = Reflect.getOwnMetadata(
      PARAM_KEY,
      TestClass.prototype,
      'testMethod'
    )
    expect(metadata).toHaveLength(2)

    decorator3(TestClass.prototype, 'testMethod', 2)

    metadata = Reflect.getOwnMetadata(
      PARAM_KEY,
      TestClass.prototype,
      'testMethod'
    )
    expect(metadata).toHaveLength(3)
    expect(metadata).toEqual([
      {
        name: 'first',
        parameterIndex: 0
      },
      {
        name: 'second',
        parameterIndex: 1
      },
      {
        name: 'third',
        parameterIndex: 2
      }
    ])
  })

  it('should handle edge case parameter indices', () => {
    const decorator1 = Param('param0')
    const decorator2 = Param('param100')

    decorator1(TestClass.prototype, 'testMethod', 0)
    decorator2(TestClass.prototype, 'testMethod', 100)

    const metadata = Reflect.getOwnMetadata(
      PARAM_KEY,
      TestClass.prototype,
      'testMethod'
    )

    expect(metadata).toEqual([
      {
        name: 'param0',
        parameterIndex: 0
      },
      {
        name: 'param100',
        parameterIndex: 100
      }
    ])
  })
})

describe('ParamMetadata type', () => {
  it('should allow valid metadata structure', () => {
    const metadata: ParamMetadata = {
      name: 'testParam',
      parameterIndex: 5
    }

    expect(typeof metadata.name).toBe('string')
    expect(typeof metadata.parameterIndex).toBe('number')
    expect(metadata.name).toBe('testParam')
    expect(metadata.parameterIndex).toBe(5)
  })

  it('should allow empty string as name', () => {
    const metadata: ParamMetadata = {
      name: '',
      parameterIndex: 0
    }

    expect(metadata.name).toBe('')
    expect(metadata.parameterIndex).toBe(0)
  })

  it('should allow special characters in name', () => {
    const metadata: ParamMetadata = {
      name: 'user-id_123.test',
      parameterIndex: 1
    }

    expect(metadata.name).toBe('user-id_123.test')
    expect(metadata.parameterIndex).toBe(1)
  })
})
