import { ExecutionContext } from './execution-context'
import { ArgumentsHost } from './arguments-host'
import { Class } from '@/types/class'

// Mock ArgumentsHost
jest.mock('./arguments-host')
const MockedArgumentsHost = ArgumentsHost as jest.MockedClass<
  typeof ArgumentsHost
>

describe('ExecutionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with provided parameters and default http type', () => {
      class TestClass {
        testMethod() {}
      }
      const handler = function testHandler() {}
      const args = ['arg1', 'arg2']

      const context = new ExecutionContext(TestClass, handler, args)

      expect(MockedArgumentsHost).toHaveBeenCalledWith(args, 'http')
      expect(context.getClass()).toBe(TestClass)
      expect(context.getHandler()).toBe(handler)
    })

    it('should initialize with explicit type parameter', () => {
      class CustomClass {}
      const handler = () => 'test'
      const args = ['request', 'response']

      const context = new ExecutionContext(CustomClass, handler, args, 'http')

      expect(MockedArgumentsHost).toHaveBeenCalledWith(args, 'http')
      expect(context.getClass()).toBe(CustomClass)
      expect(context.getHandler()).toBe(handler)
    })

    it('should handle empty arguments array', () => {
      class EmptyArgsClass {}
      const handler = function emptyHandler() {}
      const args: any[] = []

      const context = new ExecutionContext(EmptyArgsClass, handler, args)

      expect(MockedArgumentsHost).toHaveBeenCalledWith([], 'http')
      expect(context.getClass()).toBe(EmptyArgsClass)
      expect(context.getHandler()).toBe(handler)
    })
  })

  describe('getClass', () => {
    it('should return the class type passed to constructor', () => {
      class UserController {
        getUsers() {}
        createUser() {}
      }
      const handler = UserController.prototype.getUsers
      const args = ['request']

      const context = new ExecutionContext(UserController, handler, args)

      expect(context.getClass()).toBe(UserController)
    })

    it('should return class with correct type inference', () => {
      class TypedController {
        method(): string {
          return 'test'
        }
      }
      const handler = TypedController.prototype.method
      const args = []

      const context = new ExecutionContext(TypedController, handler, args)
      const classRef = context.getClass<TypedController>()

      expect(classRef).toBe(TypedController)
      // TypeScript should infer the correct type
      expect(typeof classRef).toBe('function')
    })

    it('should handle abstract classes', () => {
      abstract class AbstractController {
        abstract process(): void
      }
      class ConcreteController extends AbstractController {
        process() {}
      }
      const handler = ConcreteController.prototype.process
      const args = ['data']

      const context = new ExecutionContext(ConcreteController, handler, args)

      expect(context.getClass()).toBe(ConcreteController)
    })

    it('should handle classes with static methods', () => {
      class StaticMethodClass {
        static staticMethod() {
          return 'static'
        }
        instanceMethod() {
          return 'instance'
        }
      }
      const handler = StaticMethodClass.staticMethod
      const args = []

      const context = new ExecutionContext(StaticMethodClass, handler, args)

      expect(context.getClass()).toBe(StaticMethodClass)
    })
  })

  describe('getHandler', () => {
    it('should return the handler function passed to constructor', () => {
      class HandlerTestClass {}
      const handlerFunction = function namedHandler() {
        return 'handled'
      }
      const args = ['arg']

      const context = new ExecutionContext(
        HandlerTestClass,
        handlerFunction,
        args
      )

      expect(context.getHandler()).toBe(handlerFunction)
    })

    it('should return arrow function handlers', () => {
      class ArrowClass {}
      const arrowHandler = () => 'arrow result'
      const args = []

      const context = new ExecutionContext(ArrowClass, arrowHandler, args)

      expect(context.getHandler()).toBe(arrowHandler)
    })

    it('should return method references', () => {
      class MethodClass {
        testMethod() {
          return 'method result'
        }
      }
      const methodRef = MethodClass.prototype.testMethod
      const args = ['test']

      const context = new ExecutionContext(MethodClass, methodRef, args)

      expect(context.getHandler()).toBe(methodRef)
    })

    it('should return async function handlers', () => {
      class AsyncClass {}
      const asyncHandler = async () => 'async result'
      const args = ['async']

      const context = new ExecutionContext(AsyncClass, asyncHandler, args)

      expect(context.getHandler()).toBe(asyncHandler)
    })

    it('should return generator function handlers', () => {
      class GeneratorClass {}
      const generatorHandler = function* () {
        yield 'generator result'
      }
      const args = []

      const context = new ExecutionContext(
        GeneratorClass,
        generatorHandler,
        args
      )

      expect(context.getHandler()).toBe(generatorHandler)
    })
  })

  describe('inheritance from ArgumentsHost', () => {
    it('should inherit all ArgumentsHost functionality', () => {
      class InheritanceTestClass {}
      const handler = () => {}
      const args = ['inherit', 'test']

      const context = new ExecutionContext(InheritanceTestClass, handler, args)

      // ExecutionContext should be an instance of ArgumentsHost
      expect(context).toBeInstanceOf(ExecutionContext)
      // Mock verification that parent constructor was called
      expect(MockedArgumentsHost).toHaveBeenCalledWith(args, 'http')
    })

    it('should be able to access parent methods through prototype chain', () => {
      // Mock the parent methods
      const mockGetType = jest.fn().mockReturnValue('http')
      const mockGetArgs = jest.fn().mockReturnValue(['test'])
      const mockGetArgsByIndex = jest.fn().mockReturnValue('test')
      const mockSwitchToHttp = jest.fn().mockReturnValue({})

      MockedArgumentsHost.prototype.getType = mockGetType
      MockedArgumentsHost.prototype.getArgs = mockGetArgs
      MockedArgumentsHost.prototype.getArgsByIndex = mockGetArgsByIndex
      MockedArgumentsHost.prototype.switchToHttp = mockSwitchToHttp

      class ParentMethodsClass {}
      const handler = () => {}
      const args = ['parent']

      const context = new ExecutionContext(ParentMethodsClass, handler, args)

      // These methods should be available through inheritance
      expect(typeof context.getType).toBe('function')
      expect(typeof context.getArgs).toBe('function')
      expect(typeof context.getArgsByIndex).toBe('function')
      expect(typeof context.switchToHttp).toBe('function')
    })
  })

  describe('complex scenarios', () => {
    it('should handle decorators and metadata', () => {
      @Reflect.metadata('custom', 'value')
      class DecoratedClass {
        @Reflect.metadata('method', 'data')
        decoratedMethod() {}
      }
      const handler = DecoratedClass.prototype.decoratedMethod
      const args = ['decorated']

      const context = new ExecutionContext(DecoratedClass, handler, args)

      expect(context.getClass()).toBe(DecoratedClass)
      expect(context.getHandler()).toBe(handler)
    })

    it('should handle dependency injection scenarios', () => {
      interface IService {
        process(): string
      }

      class ServiceImplementation implements IService {
        process(): string {
          return 'processed'
        }
      }

      class DIController {
        constructor(private service: IService) {}

        handleRequest() {
          return this.service.process()
        }
      }

      const handler = DIController.prototype.handleRequest
      const args = ['di-request']

      const context = new ExecutionContext(DIController, handler, args)

      expect(context.getClass()).toBe(DIController)
      expect(context.getHandler()).toBe(handler)
    })

    it('should handle generic classes', () => {
      class GenericController<T> {
        data: T[] = []

        process(item: T): T {
          this.data.push(item)
          return item
        }
      }

      const handler = GenericController.prototype.process
      const args = ['generic']

      const context = new ExecutionContext(GenericController, handler, args)

      expect(context.getClass()).toBe(GenericController)
      expect(context.getHandler()).toBe(handler)
    })
  })

  describe('edge cases', () => {
    it('should handle null/undefined handlers gracefully', () => {
      class EdgeClass {}
      const args = ['edge']

      const contextWithNull = new ExecutionContext(EdgeClass, null as any, args)
      const contextWithUndefined = new ExecutionContext(
        EdgeClass,
        undefined as any,
        args
      )

      expect(contextWithNull.getHandler()).toBeNull()
      expect(contextWithUndefined.getHandler()).toBeUndefined()
    })

    it('should handle bound methods', () => {
      class BoundMethodClass {
        value = 'bound'

        getBoundValue() {
          return this.value
        }
      }

      const instance = new BoundMethodClass()
      const boundMethod = instance.getBoundValue.bind(instance)
      const args = ['bound']

      const context = new ExecutionContext(BoundMethodClass, boundMethod, args)

      expect(context.getHandler()).toBe(boundMethod)
      expect(context.getClass()).toBe(BoundMethodClass)
    })

    it('should handle very long argument lists', () => {
      class LongArgsClass {}
      const handler = () => {}
      const longArgs = Array.from({ length: 1000 }, (_, i) => `arg${i}`)

      const context = new ExecutionContext(LongArgsClass, handler, longArgs)

      expect(MockedArgumentsHost).toHaveBeenCalledWith(longArgs, 'http')
      expect(context.getClass()).toBe(LongArgsClass)
      expect(context.getHandler()).toBe(handler)
    })
  })

  describe('type safety', () => {
    it('should maintain type information for different class types', () => {
      class StringController {
        handleString(): string {
          return ''
        }
      }

      class NumberController {
        handleNumber(): number {
          return 0
        }
      }

      const stringContext = new ExecutionContext(
        StringController,
        StringController.prototype.handleString,
        []
      )
      const numberContext = new ExecutionContext(
        NumberController,
        NumberController.prototype.handleNumber,
        []
      )

      expect(stringContext.getClass()).toBe(StringController)
      expect(numberContext.getClass()).toBe(NumberController)
    })
  })
})
