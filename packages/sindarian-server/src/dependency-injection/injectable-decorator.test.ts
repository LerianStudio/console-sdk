import 'reflect-metadata'
import { INJECTABLE_KEY } from '@/constants/keys'
import { Scope } from '@/constants/scopes'
import { injectableHandler, Injectable } from './injectable-decorator'
import { injectable } from 'inversify'

// Mock inversify
jest.mock('inversify', () => ({
  injectable: jest.fn(() => jest.fn())
}))

const mockInjectableDecorator = injectable as jest.MockedFunction<
  typeof injectable
>

describe('injectableHandler', () => {
  beforeEach(() => {
    // Clear metadata before each test to avoid interference
    ;[TestClass, AnotherTestClass].forEach((TestClassConstructor) => {
      try {
        Reflect.deleteMetadata(INJECTABLE_KEY, TestClassConstructor)
      } catch (error) {
        // Ignore errors if metadata doesn't exist
      }
    })
  })

  class TestClass {}
  class AnotherTestClass {}

  it('should return undefined when no metadata is found', () => {
    const result = injectableHandler(TestClass)

    expect(result).toBeUndefined()
  })

  it('should return metadata when it exists', () => {
    const expectedMetadata = { scope: Scope.DEFAULT }
    Reflect.defineMetadata(INJECTABLE_KEY, expectedMetadata, TestClass)

    const result = injectableHandler(TestClass)

    expect(result).toEqual(expectedMetadata)
    expect(result.scope).toBe(Scope.DEFAULT)
  })

  it('should return correct metadata for different classes', () => {
    const metadata1 = { scope: Scope.DEFAULT }
    const metadata2 = { scope: Scope.TRANSIENT }

    Reflect.defineMetadata(INJECTABLE_KEY, metadata1, TestClass)
    Reflect.defineMetadata(INJECTABLE_KEY, metadata2, AnotherTestClass)

    const result1 = injectableHandler(TestClass)
    const result2 = injectableHandler(AnotherTestClass)

    expect(result1).toEqual(metadata1)
    expect(result2).toEqual(metadata2)
    expect(result1.scope).toBe(Scope.DEFAULT)
    expect(result2.scope).toBe(Scope.TRANSIENT)
  })
})

describe('Injectable decorator', () => {
  let consoleWarnSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()

    // Spy on console.warn
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

    // Clear metadata before each test
    ;[TestClass, AnotherTestClass].forEach((TestClassConstructor) => {
      try {
        Reflect.deleteMetadata(INJECTABLE_KEY, TestClassConstructor)
      } catch (error) {
        // Ignore errors if metadata doesn't exist
      }
    })
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  class TestClass {}
  class AnotherTestClass {}

  it('should set metadata with default scope when no options provided', () => {
    const decorator = Injectable()
    decorator(TestClass as any)

    const metadata = Reflect.getOwnMetadata(INJECTABLE_KEY, TestClass)

    expect(metadata).toEqual({ scope: Scope.DEFAULT })
    expect(metadata.scope).toBe(Scope.DEFAULT)
  })

  it('should call inversify injectable decorator', () => {
    const mockInversifyDecorator = jest.fn()
    mockInjectableDecorator.mockReturnValue(mockInversifyDecorator)

    const decorator = Injectable()
    decorator(TestClass as any)

    expect(mockInjectableDecorator).toHaveBeenCalled()
    expect(mockInversifyDecorator).toHaveBeenCalledWith(TestClass)
  })

  it('should set metadata with custom scope', () => {
    const decorator = Injectable({ scope: Scope.TRANSIENT })
    decorator(TestClass as any)

    const metadata = Reflect.getOwnMetadata(INJECTABLE_KEY, TestClass)

    expect(metadata).toEqual({ scope: Scope.TRANSIENT })
    expect(metadata.scope).toBe(Scope.TRANSIENT)
  })

  it('should warn when scope option is provided', () => {
    const decorator = Injectable({ scope: Scope.TRANSIENT })
    decorator(TestClass as any)

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Injectable: Scope option is not implemented.'
    )
  })

  it('should not warn when no scope option is provided', () => {
    const decorator = Injectable()
    decorator(TestClass as any)

    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  it('should not warn when scope option is undefined', () => {
    const decorator = Injectable({ scope: undefined })
    decorator(TestClass as any)

    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })

  it('should set different metadata for different classes', () => {
    const decorator1 = Injectable({ scope: Scope.DEFAULT })
    const decorator2 = Injectable({ scope: Scope.REQUEST })

    decorator1(TestClass as any)
    decorator2(AnotherTestClass as any)

    const metadata1 = Reflect.getOwnMetadata(INJECTABLE_KEY, TestClass)
    const metadata2 = Reflect.getOwnMetadata(INJECTABLE_KEY, AnotherTestClass)

    expect(metadata1).toEqual({ scope: Scope.DEFAULT })
    expect(metadata2).toEqual({ scope: Scope.REQUEST })
    expect(metadata1.scope).toBe(Scope.DEFAULT)
    expect(metadata2.scope).toBe(Scope.REQUEST)
  })

  it('should overwrite metadata when applied multiple times to same class', () => {
    const decorator1 = Injectable({ scope: Scope.DEFAULT })
    const decorator2 = Injectable({ scope: Scope.TRANSIENT })

    // Apply first decorator
    decorator1(TestClass as any)
    let metadata = Reflect.getOwnMetadata(INJECTABLE_KEY, TestClass)
    expect(metadata.scope).toBe(Scope.DEFAULT)

    // Apply second decorator (should overwrite)
    decorator2(TestClass as any)
    metadata = Reflect.getOwnMetadata(INJECTABLE_KEY, TestClass)
    expect(metadata).toEqual({ scope: Scope.TRANSIENT })
    expect(metadata.scope).toBe(Scope.TRANSIENT)
  })

  it('should work with all scope types', () => {
    const defaultDecorator = Injectable({ scope: Scope.DEFAULT })
    const transientDecorator = Injectable({ scope: Scope.TRANSIENT })
    const requestDecorator = Injectable({ scope: Scope.REQUEST })

    class DefaultClass {}
    class TransientClass {}
    class RequestClass {}

    defaultDecorator(DefaultClass as any)
    transientDecorator(TransientClass as any)
    requestDecorator(RequestClass as any)

    expect(Reflect.getOwnMetadata(INJECTABLE_KEY, DefaultClass)).toEqual({
      scope: Scope.DEFAULT
    })
    expect(Reflect.getOwnMetadata(INJECTABLE_KEY, TransientClass)).toEqual({
      scope: Scope.TRANSIENT
    })
    expect(Reflect.getOwnMetadata(INJECTABLE_KEY, RequestClass)).toEqual({
      scope: Scope.REQUEST
    })
  })

  it('should maintain independent metadata across different classes', () => {
    const decorator1 = Injectable({ scope: Scope.DEFAULT })
    const decorator2 = Injectable({ scope: Scope.TRANSIENT })

    decorator1(TestClass as any)
    decorator2(AnotherTestClass as any)

    const metadata1 = Reflect.getOwnMetadata(INJECTABLE_KEY, TestClass)
    const metadata2 = Reflect.getOwnMetadata(INJECTABLE_KEY, AnotherTestClass)

    expect(metadata1).toEqual({ scope: Scope.DEFAULT })
    expect(metadata2).toEqual({ scope: Scope.TRANSIENT })

    // Verify they don't interfere with each other
    expect(metadata1).not.toEqual(metadata2)
    expect(metadata1.scope).not.toBe(metadata2.scope)
  })
})

describe('Injectable integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should maintain type consistency between decorator and handler', () => {
    class TestService {}

    // Apply decorator
    const decorator = Injectable({ scope: Scope.TRANSIENT })
    decorator(TestService as any)

    // Retrieve with handler
    const metadata = injectableHandler(TestService)

    expect(metadata).toBeDefined()
    expect(metadata!.scope).toBe(Scope.TRANSIENT)
  })

  it('should work with default options workflow', () => {
    class AppService {}

    // Apply the decorator with no options
    const InjectableDecorator = Injectable()
    InjectableDecorator(AppService as any)

    // Retrieve metadata
    const metadata = injectableHandler(AppService)

    expect(metadata).toBeDefined()
    expect(metadata!.scope).toBe(Scope.DEFAULT)
  })
})
