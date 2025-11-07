import 'reflect-metadata'
import { CATCH_KEY } from '../../constants/keys'
import { catchHandler, Catch } from './catch-decorator'

describe('catchHandler', () => {
  beforeEach(() => {
    // Clear metadata before each test to avoid interference
    ;[TestClass, AnotherTestClass].forEach((TestClassConstructor) => {
      try {
        Reflect.deleteMetadata(CATCH_KEY, TestClassConstructor)
      } catch (error) {
        // Ignore errors if metadata doesn't exist
      }
    })
  })

  class TestClass {}
  class AnotherTestClass {}
  class CustomErrorType extends Error {}
  class AnotherErrorType extends Error {}

  it('should return undefined when no metadata is found', () => {
    const result = catchHandler(TestClass)

    expect(result).toBeUndefined()
  })

  it('should return metadata when it exists', () => {
    // Set metadata directly
    const expectedMetadata = { type: CustomErrorType }
    Reflect.defineMetadata(CATCH_KEY, expectedMetadata, TestClass)

    const result = catchHandler(TestClass)

    expect(result).toEqual(expectedMetadata)
    expect(result.type).toBe(CustomErrorType)
  })

  it('should return correct metadata for different classes', () => {
    // Set different metadata for different classes
    const metadata1 = { type: CustomErrorType }
    const metadata2 = { type: AnotherErrorType }

    Reflect.defineMetadata(CATCH_KEY, metadata1, TestClass)
    Reflect.defineMetadata(CATCH_KEY, metadata2, AnotherTestClass)

    const result1 = catchHandler(TestClass)
    const result2 = catchHandler(AnotherTestClass)

    expect(result1).toEqual(metadata1)
    expect(result2).toEqual(metadata2)
    expect(result1.type).toBe(CustomErrorType)
    expect(result2.type).toBe(AnotherErrorType)
  })

  it('should return undefined metadata when type is undefined', () => {
    const metadata = { type: undefined }
    Reflect.defineMetadata(CATCH_KEY, metadata, TestClass)

    const result = catchHandler(TestClass)

    expect(result).toEqual(metadata)
    expect(result.type).toBeUndefined()
  })

  it('should handle class instances by using their constructor', () => {
    const instance = new TestClass()
    const metadata = { type: CustomErrorType }

    // Set metadata on the constructor
    Reflect.defineMetadata(CATCH_KEY, metadata, TestClass)

    // Call catchHandler with the constructor
    const result = catchHandler(instance.constructor)

    expect(result).toEqual(metadata)
    expect(result.type).toBe(CustomErrorType)
  })

  it('should return latest metadata when set multiple times', () => {
    const firstMetadata = { type: CustomErrorType }
    const secondMetadata = { type: AnotherErrorType }

    // Set first metadata
    Reflect.defineMetadata(CATCH_KEY, firstMetadata, TestClass)
    let result = catchHandler(TestClass)
    expect(result).toEqual(firstMetadata)

    // Overwrite with second metadata
    Reflect.defineMetadata(CATCH_KEY, secondMetadata, TestClass)
    result = catchHandler(TestClass)
    expect(result).toEqual(secondMetadata)
    expect(result.type).toBe(AnotherErrorType)
  })
})

describe('Catch decorator', () => {
  beforeEach(() => {
    // Clear metadata before each test
    ;[TestClass, AnotherTestClass].forEach((TestClassConstructor) => {
      try {
        Reflect.deleteMetadata(CATCH_KEY, TestClassConstructor)
      } catch (error) {
        // Ignore errors if metadata doesn't exist
      }
    })
  })

  class TestClass {}
  class AnotherTestClass {}
  class CustomErrorType extends Error {}
  class AnotherErrorType extends Error {}

  it('should set metadata with specific error type', () => {
    const decorator = Catch(CustomErrorType)
    decorator(TestClass as any)

    const metadata = Reflect.getOwnMetadata(CATCH_KEY, TestClass)

    expect(metadata).toEqual({ type: CustomErrorType })
    expect(metadata.type).toBe(CustomErrorType)
  })

  it('should set metadata with undefined when no error type provided', () => {
    const decorator = Catch()
    decorator(TestClass as any)

    const metadata = Reflect.getOwnMetadata(CATCH_KEY, TestClass)

    expect(metadata).toEqual({ type: undefined })
    expect(metadata.type).toBeUndefined()
  })

  it('should set different metadata for different classes', () => {
    const decorator1 = Catch(CustomErrorType)
    const decorator2 = Catch(AnotherErrorType)

    decorator1(TestClass as any)
    decorator2(AnotherTestClass as any)

    const metadata1 = Reflect.getOwnMetadata(CATCH_KEY, TestClass)
    const metadata2 = Reflect.getOwnMetadata(CATCH_KEY, AnotherTestClass)

    expect(metadata1).toEqual({ type: CustomErrorType })
    expect(metadata2).toEqual({ type: AnotherErrorType })
    expect(metadata1.type).toBe(CustomErrorType)
    expect(metadata2.type).toBe(AnotherErrorType)
  })

  it('should overwrite metadata when applied multiple times to same class', () => {
    const decorator1 = Catch(CustomErrorType)
    const decorator2 = Catch(AnotherErrorType)

    // Apply first decorator
    decorator1(TestClass as any)
    let metadata = Reflect.getOwnMetadata(CATCH_KEY, TestClass)
    expect(metadata.type).toBe(CustomErrorType)

    // Apply second decorator (should overwrite)
    decorator2(TestClass as any)
    metadata = Reflect.getOwnMetadata(CATCH_KEY, TestClass)
    expect(metadata).toEqual({ type: AnotherErrorType })
    expect(metadata.type).toBe(AnotherErrorType)
  })

  it('should work with built-in error types', () => {
    const decorator1 = Catch(Error)
    const decorator2 = Catch(TypeError)
    const decorator3 = Catch(ReferenceError)

    decorator1(TestClass as any)

    const metadata = Reflect.getOwnMetadata(CATCH_KEY, TestClass)

    expect(metadata).toEqual({ type: Error })
    expect(metadata.type).toBe(Error)
  })

  it('should handle edge case with null error type', () => {
    const decorator = Catch(null as any)
    decorator(TestClass as any)

    const metadata = Reflect.getOwnMetadata(CATCH_KEY, TestClass)

    expect(metadata).toEqual({ type: null })
    expect(metadata.type).toBeNull()
  })

  it('should maintain independent metadata across different classes', () => {
    const decorator1 = Catch(CustomErrorType)
    const decorator2 = Catch(AnotherErrorType)
    const decorator3 = Catch()

    decorator1(TestClass as any)
    decorator2(AnotherTestClass as any)

    const metadata1 = Reflect.getOwnMetadata(CATCH_KEY, TestClass)
    const metadata2 = Reflect.getOwnMetadata(CATCH_KEY, AnotherTestClass)

    expect(metadata1).toEqual({ type: CustomErrorType })
    expect(metadata2).toEqual({ type: AnotherErrorType })

    // Verify they don't interfere with each other
    expect(metadata1).not.toEqual(metadata2)
    expect(metadata1.type).not.toBe(metadata2.type)
  })
})

describe('CatchMetadata type integration', () => {
  class CustomError extends Error {}

  it('should maintain type consistency between decorator and handler', () => {
    class TestFilter {}

    // Apply decorator
    const decorator = Catch(CustomError)
    decorator(TestFilter as any)

    // Retrieve with handler
    const metadata = catchHandler(TestFilter)

    expect(metadata).toBeDefined()
    expect(metadata!.type).toBe(CustomError)
    expect(metadata!.type).toEqual(CustomError)
  })

  it('should work with the actual exception filter workflow', () => {
    // Simulate how it would be used in the server factory
    class AppExceptionFilter {}

    // Apply the decorator (as would be done in real code)
    const CatchDecorator = Catch(Error)
    CatchDecorator(AppExceptionFilter as any)

    // Retrieve metadata (as done in server factory)
    const metadata = catchHandler(AppExceptionFilter)

    expect(metadata).toBeDefined()
    expect(metadata!.type).toBe(Error)

    // Test the conditional logic that would be used
    const error = new Error('test error')
    const shouldCatch = !metadata!.type || error instanceof metadata!.type

    expect(shouldCatch).toBe(true)
  })

  it('should support catch-all filters when no error type specified', () => {
    class CatchAllFilter {}

    // Apply decorator without specific error type
    const CatchDecorator = Catch()
    CatchDecorator(CatchAllFilter as any)

    // Retrieve metadata
    const metadata = catchHandler(CatchAllFilter)

    expect(metadata).toBeDefined()
    expect(metadata!.type).toBeUndefined()

    // Test that it catches all errors when type is undefined
    const error = new Error('any error')
    const shouldCatch = !metadata!.type || error instanceof metadata!.type

    expect(shouldCatch).toBe(true) // Should catch because type is undefined
  })
})
