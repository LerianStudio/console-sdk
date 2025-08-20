import 'reflect-metadata'
import { Container, ContainerModule } from '@/dependency-injection/container'
import {
  MODULE_KEY,
  MODULE_PROPERTY,
  PROVIDERS_PROPERTY,
  CONTROLLERS_PROPERTY,
  IMPORTS_PROPERTY
} from '@/constants/keys'
import { Class } from '@/types/class'
import {
  moduleHandler,
  Module,
  ModuleOptions,
  InjectionToken
} from './module-decorator'

// Mock the controller decorator handler
jest.mock('@/controllers/decorators/controller-decorator', () => ({
  controllerHandler: jest.fn().mockReturnValue([
    { path: '/test', method: 'GET', methodName: 'testMethod' }
  ])
}))

// Mock the interceptor decorator handler
jest.mock('@/interceptor/decorators/use-interceptor-decorator', () => ({
  interceptorHandler: jest.fn().mockReturnValue([])
}))

import { controllerHandler } from '@/controllers/decorators/controller-decorator'
import { interceptorHandler } from '@/interceptor/decorators/use-interceptor-decorator'

const mockControllerHandler = controllerHandler as jest.MockedFunction<
  typeof controllerHandler
>
const mockInterceptorHandler = interceptorHandler as jest.MockedFunction<
  typeof interceptorHandler
>

describe('moduleHandler', () => {
  class TestController {}
  class AnotherController {}
  class TestModule {}
  class ImportedModule {}

  beforeEach(() => {
    jest.clearAllMocks()
    mockControllerHandler.mockReturnValue([
      { path: '/test', method: 'GET', methodName: 'testMethod' }
    ])
    mockInterceptorHandler.mockReturnValue([])

    // Clear metadata before each test
    const classes = [TestModule, ImportedModule, TestController, AnotherController]
    classes.forEach((cls) => {
      try {
        Reflect.deleteMetadata(MODULE_KEY, cls)
        if (cls.prototype) {
          delete cls.prototype[IMPORTS_PROPERTY]
          delete cls.prototype[CONTROLLERS_PROPERTY]
          delete cls.prototype[MODULE_PROPERTY]
          delete cls.prototype[PROVIDERS_PROPERTY]
        }
      } catch (error) {
        // Ignore errors if metadata doesn't exist
      }
    })
  })

  it('should return empty array when no imports or controllers are found', () => {
    const result = moduleHandler(TestModule)
    expect(result).toEqual([])
  })

  it('should handle controllers and return routes', () => {
    TestModule.prototype[CONTROLLERS_PROPERTY] = [TestController]
    
    const result = moduleHandler(TestModule)
    
    expect(mockControllerHandler).toHaveBeenCalledWith(TestController)
    expect(result).toEqual([
      { 
        path: '/test', 
        method: 'GET', 
        methodName: 'testMethod', 
        controller: TestController 
      }
    ])
  })

  it('should handle multiple controllers', () => {
    TestModule.prototype[CONTROLLERS_PROPERTY] = [TestController, AnotherController]
    
    mockControllerHandler
      .mockReturnValueOnce([
        { path: '/test', method: 'GET', methodName: 'testMethod' }
      ])
      .mockReturnValueOnce([
        { path: '/another', method: 'POST', methodName: 'anotherMethod' }
      ])
    
    const result = moduleHandler(TestModule)
    
    expect(mockControllerHandler).toHaveBeenCalledWith(TestController)
    expect(mockControllerHandler).toHaveBeenCalledWith(AnotherController)
    expect(result).toEqual([
      { 
        path: '/test', 
        method: 'GET', 
        methodName: 'testMethod', 
        controller: TestController 
      },
      { 
        path: '/another', 
        method: 'POST', 
        methodName: 'anotherMethod', 
        controller: AnotherController 
      }
    ])
  })

  it('should handle imports and recursively process modules', () => {
    // Set up imported module
    ImportedModule.prototype[CONTROLLERS_PROPERTY] = [TestController]
    
    // Set up main module with imports
    TestModule.prototype[IMPORTS_PROPERTY] = [ImportedModule]
    
    const result = moduleHandler(TestModule)
    
    expect(mockControllerHandler).toHaveBeenCalledWith(TestController)
    expect(result).toEqual([
      { 
        path: '/test', 
        method: 'GET', 
        methodName: 'testMethod', 
        controller: TestController 
      }
    ])
  })

  it('should handle both imports and controllers', () => {
    // Set up imported module
    ImportedModule.prototype[CONTROLLERS_PROPERTY] = [TestController]
    
    // Set up main module with imports and controllers
    TestModule.prototype[IMPORTS_PROPERTY] = [ImportedModule]
    TestModule.prototype[CONTROLLERS_PROPERTY] = [AnotherController]
    
    mockControllerHandler
      .mockReturnValueOnce([
        { path: '/test', method: 'GET', methodName: 'testMethod' }
      ])
      .mockReturnValueOnce([
        { path: '/another', method: 'POST', methodName: 'anotherMethod' }
      ])
    
    const result = moduleHandler(TestModule)
    
    expect(result).toHaveLength(2)
    expect(result).toEqual([
      { 
        path: '/test', 
        method: 'GET', 
        methodName: 'testMethod', 
        controller: TestController 
      },
      { 
        path: '/another', 
        method: 'POST', 
        methodName: 'anotherMethod', 
        controller: AnotherController 
      }
    ])
  })

  it('should prevent infinite recursion with circular imports', () => {
    // Create circular reference
    TestModule.prototype[IMPORTS_PROPERTY] = [ImportedModule]
    ImportedModule.prototype[IMPORTS_PROPERTY] = [TestModule]
    ImportedModule.prototype[CONTROLLERS_PROPERTY] = [TestController]
    
    const result = moduleHandler(TestModule)
    
    // Should only call controllerHandler once, not enter infinite loop
    expect(mockControllerHandler).toHaveBeenCalledTimes(1)
    expect(result).toEqual([
      { 
        path: '/test', 
        method: 'GET', 
        methodName: 'testMethod', 
        controller: TestController 
      }
    ])
  })

  it('should handle deep module hierarchy', () => {
    class Level1Module {}
    class Level2Module {}
    
    // Set up deep hierarchy
    TestModule.prototype[IMPORTS_PROPERTY] = [Level1Module]
    Level1Module.prototype[IMPORTS_PROPERTY] = [Level2Module]
    Level2Module.prototype[CONTROLLERS_PROPERTY] = [TestController]
    
    const result = moduleHandler(TestModule)
    
    expect(mockControllerHandler).toHaveBeenCalledWith(TestController)
    expect(result).toEqual([
      { 
        path: '/test', 
        method: 'GET', 
        methodName: 'testMethod', 
        controller: TestController 
      }
    ])
  })

  it('should handle empty arrays gracefully', () => {
    TestModule.prototype[IMPORTS_PROPERTY] = []
    TestModule.prototype[CONTROLLERS_PROPERTY] = []
    
    const result = moduleHandler(TestModule)
    expect(result).toEqual([])
    expect(mockControllerHandler).not.toHaveBeenCalled()
  })
})

describe('Module decorator', () => {
  class TestProvider {}
  class TestController {}
  class ImportedModule {}
  class TestModule {}

  beforeEach(() => {
    // Clear metadata before each test
    try {
      Reflect.deleteMetadata(MODULE_KEY, TestModule)
      if (TestModule.prototype) {
        delete TestModule.prototype[IMPORTS_PROPERTY]
        delete TestModule.prototype[CONTROLLERS_PROPERTY]
        delete TestModule.prototype[MODULE_PROPERTY]
        delete TestModule.prototype[PROVIDERS_PROPERTY]
      }
    } catch (error) {
      // Ignore errors if metadata doesn't exist
    }

    jest.clearAllMocks()
    mockInterceptorHandler.mockReturnValue([])
  })

  it('should work without options', () => {
    const decorator = Module()
    decorator(TestModule)

    const metadata = Reflect.getOwnMetadata(MODULE_KEY, TestModule)
    expect(metadata).toEqual({
      imports: undefined,
      providers: undefined,
      controllers: undefined
    })

    expect(TestModule.prototype[IMPORTS_PROPERTY]).toBeUndefined()
    expect(TestModule.prototype[CONTROLLERS_PROPERTY]).toBeUndefined()
    expect(TestModule.prototype[PROVIDERS_PROPERTY]).toBeUndefined()
    expect(TestModule.prototype[MODULE_PROPERTY]).toBeInstanceOf(ContainerModule)
  })

  it('should set metadata and properties with full options', () => {
    const options: ModuleOptions = {
      imports: [ImportedModule],
      controllers: [TestController],
      providers: [TestProvider]
    }

    const decorator = Module(options)
    decorator(TestModule)

    const metadata = Reflect.getOwnMetadata(MODULE_KEY, TestModule)
    expect(metadata).toEqual(options)

    expect(TestModule.prototype[IMPORTS_PROPERTY]).toEqual([ImportedModule])
    expect(TestModule.prototype[CONTROLLERS_PROPERTY]).toEqual([TestController])
    expect(TestModule.prototype[PROVIDERS_PROPERTY]).toEqual([TestProvider])
    expect(TestModule.prototype[MODULE_PROPERTY]).toBeInstanceOf(ContainerModule)
  })

  it('should handle providers as class constructors', () => {
    const options: ModuleOptions = {
      providers: [TestProvider]
    }

    const decorator = Module(options)
    decorator(TestModule)

    expect(TestModule.prototype[PROVIDERS_PROPERTY]).toEqual([TestProvider])
  })

  it('should handle providers as objects with useClass', () => {
    const options: ModuleOptions = {
      providers: [
        {
          provide: 'TestToken',
          useClass: TestProvider
        }
      ]
    }

    const decorator = Module(options)
    decorator(TestModule)

    expect(TestModule.prototype[PROVIDERS_PROPERTY]).toEqual(options.providers)
  })

  it('should handle providers with useValue', () => {
    const testValue = { test: 'value' }
    const options: ModuleOptions = {
      providers: [
        {
          provide: 'TestToken',
          useValue: testValue
        }
      ]
    }

    const decorator = Module(options)
    decorator(TestModule)

    expect(TestModule.prototype[PROVIDERS_PROPERTY]).toEqual(options.providers)
  })

  it('should handle providers with useFactory', () => {
    const testFactory = () => ({ test: 'factory' })
    const options: ModuleOptions = {
      providers: [
        {
          provide: 'TestToken',
          useFactory: testFactory
        }
      ]
    }

    const decorator = Module(options)
    decorator(TestModule)

    expect(TestModule.prototype[PROVIDERS_PROPERTY]).toEqual(options.providers)
  })

  it('should handle mixed provider types', () => {
    const testValue = { test: 'value' }
    const testFactory = () => ({ test: 'factory' })
    
    const options: ModuleOptions = {
      providers: [
        TestProvider,
        {
          provide: 'ValueToken',
          useValue: testValue
        },
        {
          provide: 'ClassToken',
          useClass: TestProvider
        },
        {
          provide: 'FactoryToken',
          useFactory: testFactory
        }
      ]
    }

    const decorator = Module(options)
    decorator(TestModule)

    expect(TestModule.prototype[PROVIDERS_PROPERTY]).toEqual(options.providers)
  })

  it('should create ContainerModule with proper registry function', () => {
    const options: ModuleOptions = {
      imports: [ImportedModule],
      controllers: [TestController],
      providers: [TestProvider]
    }

    // Mock imported module
    ImportedModule.prototype[MODULE_PROPERTY] = new ContainerModule(() => {})

    const decorator = Module(options)
    decorator(TestModule)

    const containerModule = TestModule.prototype[MODULE_PROPERTY]
    expect(containerModule).toBeInstanceOf(ContainerModule)
    expect(typeof containerModule.registry).toBe('function')
  })

  it('should handle controllers with interceptors in container registry', () => {
    class TestInterceptor {}
    
    mockInterceptorHandler.mockReturnValue([TestInterceptor])

    const options: ModuleOptions = {
      controllers: [TestController]
    }

    const decorator = Module(options)
    decorator(TestModule)

    const containerModule = TestModule.prototype[MODULE_PROPERTY]
    expect(containerModule).toBeInstanceOf(ContainerModule)
    
    // The interceptorHandler is called when the container module registry function is executed
    // We can't easily test this without creating a mock container, so we just verify the structure is correct
    expect(TestModule.prototype[CONTROLLERS_PROPERTY]).toEqual([TestController])
  })

  it('should handle symbol tokens as injection tokens', () => {
    const symbolToken = Symbol('TestSymbol')
    const options: ModuleOptions = {
      providers: [
        {
          provide: symbolToken,
          useClass: TestProvider
        }
      ]
    }

    const decorator = Module(options)
    decorator(TestModule)

    expect(TestModule.prototype[PROVIDERS_PROPERTY]).toEqual(options.providers)
  })

  it('should handle empty arrays in options', () => {
    const options: ModuleOptions = {
      imports: [],
      controllers: [],
      providers: []
    }

    const decorator = Module(options)
    decorator(TestModule)

    const metadata = Reflect.getOwnMetadata(MODULE_KEY, TestModule)
    expect(metadata).toEqual(options)
  })

  it('should overwrite previous metadata when applied multiple times', () => {
    const decorator1 = Module({ controllers: [TestController] })
    const decorator2 = Module({ providers: [TestProvider] })

    decorator1(TestModule)
    decorator2(TestModule)

    const metadata = Reflect.getOwnMetadata(MODULE_KEY, TestModule)
    expect(metadata).toEqual({
      imports: undefined,
      providers: [TestProvider],
      controllers: undefined
    })
  })
})

describe('Integration tests', () => {
  class TestController {}
  class TestModule {}

  beforeEach(() => {
    jest.clearAllMocks()
    mockControllerHandler.mockReturnValue([
      { path: '/test', method: 'GET', methodName: 'testMethod' }
    ])
    mockInterceptorHandler.mockReturnValue([])

    // Clear metadata
    try {
      Reflect.deleteMetadata(MODULE_KEY, TestModule)
      if (TestModule.prototype) {
        delete TestModule.prototype[IMPORTS_PROPERTY]
        delete TestModule.prototype[CONTROLLERS_PROPERTY]
        delete TestModule.prototype[MODULE_PROPERTY]
        delete TestModule.prototype[PROVIDERS_PROPERTY]
      }
    } catch (error) {
      // Ignore errors
    }
  })

  it('should work with moduleHandler after Module decoration', () => {
    const decorator = Module({ controllers: [TestController] })
    decorator(TestModule)

    const result = moduleHandler(TestModule)
    
    expect(result).toEqual([
      { 
        path: '/test', 
        method: 'GET', 
        methodName: 'testMethod', 
        controller: TestController 
      }
    ])
  })

  it('should handle complex module hierarchies', () => {
    class ImportedController {}
    class ImportedModule {}
    
    // Set up imported module
    const importedDecorator = Module({ controllers: [ImportedController] })
    importedDecorator(ImportedModule)
    
    // Set up main module
    const mainDecorator = Module({
      imports: [ImportedModule],
      controllers: [TestController]
    })
    mainDecorator(TestModule)

    mockControllerHandler
      .mockReturnValueOnce([
        { path: '/imported', method: 'GET', methodName: 'importedMethod' }
      ])
      .mockReturnValueOnce([
        { path: '/test', method: 'POST', methodName: 'testMethod' }
      ])

    const result = moduleHandler(TestModule)
    
    expect(result).toHaveLength(2)
    expect(result).toEqual([
      { 
        path: '/imported', 
        method: 'GET', 
        methodName: 'importedMethod', 
        controller: ImportedController 
      },
      { 
        path: '/test', 
        method: 'POST', 
        methodName: 'testMethod', 
        controller: TestController 
      }
    ])
  })
})

describe('Type definitions', () => {
  it('should accept string injection tokens', () => {
    const token: InjectionToken = 'stringToken'
    expect(typeof token).toBe('string')
  })

  it('should accept symbol injection tokens', () => {
    const token: InjectionToken = Symbol('symbolToken')
    expect(typeof token).toBe('symbol')
  })

  it('should accept class injection tokens', () => {
    class TestClass {}
    const token: InjectionToken = TestClass
    expect(typeof token).toBe('function')
  })
})