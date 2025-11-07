import 'reflect-metadata'
import { Container as InversifyContainer, ServiceIdentifier } from 'inversify'
import {
  Container,
  ContainerModule,
  ContainerModuleRegistry
} from './container'

// Mock the inversify Container
jest.mock('inversify', () => ({
  Container: jest.fn().mockImplementation(() => ({
    bind: jest.fn().mockReturnValue({
      to: jest.fn(),
      toSelf: jest.fn(),
      toConstantValue: jest.fn(),
      toDynamicValue: jest.fn()
    }),
    get: jest.fn(),
    getAsync: jest.fn(),
    isBound: jest.fn(),
    unbind: jest.fn()
  })),
  injectable: jest.fn(),
  inject: jest.fn()
}))

const MockInversifyContainer = InversifyContainer as jest.MockedClass<
  typeof InversifyContainer
>

describe('Container', () => {
  let container: Container
  let mockInversifyContainer: jest.Mocked<InversifyContainer>

  beforeEach(() => {
    jest.clearAllMocks()
    container = new Container()
    mockInversifyContainer =
      container.container as jest.Mocked<InversifyContainer>
  })

  describe('constructor', () => {
    it('should create a new InversifyContainer instance', () => {
      expect(MockInversifyContainer).toHaveBeenCalledTimes(1)
      expect(container.container).toBeInstanceOf(Object)
    })

    it('should initialize empty loadedModules set', () => {
      expect(container['loadedModules']).toBeInstanceOf(Set)
      expect(container['loadedModules'].size).toBe(0)
    })
  })

  describe('load', () => {
    let mockModule: ContainerModule
    let mockRegistry: jest.MockedFunction<ContainerModuleRegistry>

    beforeEach(() => {
      mockRegistry = jest.fn()
      mockModule = new ContainerModule(mockRegistry)
    })

    it('should throw error when module does not have registry property', () => {
      const invalidModule = {} as ContainerModule

      expect(() => container.load(invalidModule)).toThrow(
        'Container: module [object Object] does not have a registry method'
      )
    })

    it('should call module registry when module is valid', () => {
      container.load(mockModule)

      expect(mockRegistry).toHaveBeenCalledTimes(1)
      expect(mockRegistry).toHaveBeenCalledWith(container)
    })

    it('should add module to loadedModules set', () => {
      container.load(mockModule)

      expect(container['loadedModules'].has(mockModule)).toBe(true)
      expect(container['loadedModules'].size).toBe(1)
    })

    it('should prevent infinite recursion by not loading same module twice', () => {
      container.load(mockModule)
      container.load(mockModule) // Load same module again

      expect(mockRegistry).toHaveBeenCalledTimes(1) // Should only be called once
      expect(container['loadedModules'].size).toBe(1)
    })

    it('should handle multiple different modules', () => {
      const mockRegistry2 = jest.fn()
      const mockModule2 = new ContainerModule(mockRegistry2)

      container.load(mockModule)
      container.load(mockModule2)

      expect(mockRegistry).toHaveBeenCalledTimes(1)
      expect(mockRegistry2).toHaveBeenCalledTimes(1)
      expect(container['loadedModules'].size).toBe(2)
    })

    it('should handle module with custom registry property', () => {
      const customModule = { registry: mockRegistry } as ContainerModule

      container.load(customModule)

      expect(mockRegistry).toHaveBeenCalledWith(container)
    })

    it('should throw error with proper message format', () => {
      const invalidModule = {
        someOtherProperty: 'value'
      } as unknown as ContainerModule

      expect(() => container.load(invalidModule)).toThrow(
        /Container: module .* does not have a registry method/
      )
    })

    it('should not call registry when module was already loaded', () => {
      container.load(mockModule)
      mockRegistry.mockClear()

      container.load(mockModule)

      expect(mockRegistry).not.toHaveBeenCalled()
    })
  })

  describe('bind', () => {
    it('should delegate to inversify container bind method', () => {
      const serviceIdentifier = 'TestService'
      const mockBindResult = { to: jest.fn() }
      mockInversifyContainer.bind.mockReturnValue(mockBindResult as any)

      const result = container.bind(serviceIdentifier)

      expect(mockInversifyContainer.bind).toHaveBeenCalledTimes(1)
      expect(mockInversifyContainer.bind).toHaveBeenCalledWith(
        serviceIdentifier
      )
      expect(result).toBe(mockBindResult)
    })

    it('should work with symbol service identifiers', () => {
      const symbolIdentifier = Symbol('TestService')
      const mockBindResult = { to: jest.fn() }
      mockInversifyContainer.bind.mockReturnValue(mockBindResult as any)

      const result = container.bind(symbolIdentifier)

      expect(mockInversifyContainer.bind).toHaveBeenCalledWith(symbolIdentifier)
      expect(result).toBe(mockBindResult)
    })

    it('should work with class service identifiers', () => {
      class TestService {}
      const mockBindResult = { to: jest.fn() }
      mockInversifyContainer.bind.mockReturnValue(mockBindResult as any)

      const result = container.bind(TestService)

      expect(mockInversifyContainer.bind).toHaveBeenCalledWith(TestService)
      expect(result).toBe(mockBindResult)
    })
  })

  describe('get', () => {
    it('should delegate to inversify container get method', () => {
      const serviceIdentifier = 'TestService'
      const mockResult = { value: 'test' }
      mockInversifyContainer.get.mockReturnValue(mockResult)

      const result = container.get(serviceIdentifier)

      expect(mockInversifyContainer.get).toHaveBeenCalledTimes(1)
      expect(mockInversifyContainer.get).toHaveBeenCalledWith(serviceIdentifier)
      expect(result).toBe(mockResult)
    })

    it('should work with different service identifier types', () => {
      const symbolIdentifier = Symbol('TestService')
      const mockResult = { value: 'symbol test' }
      mockInversifyContainer.get.mockReturnValue(mockResult)

      const result = container.get(symbolIdentifier)

      expect(mockInversifyContainer.get).toHaveBeenCalledWith(symbolIdentifier)
      expect(result).toBe(mockResult)
    })

    it('should preserve generic type information', () => {
      interface TestInterface {
        test: string
      }
      const serviceIdentifier = Symbol('TestInterface')
      const mockResult: TestInterface = { test: 'value' }
      mockInversifyContainer.get.mockReturnValue(mockResult)

      const result = container.get<TestInterface>(serviceIdentifier)

      expect(result.test).toBe('value')
    })
  })

  describe('getAsync', () => {
    it('should delegate to inversify container getAsync method', async () => {
      const serviceIdentifier = 'TestService'
      const mockResult = { value: 'async test' }
      mockInversifyContainer.getAsync.mockResolvedValue(mockResult)

      const result = await container.getAsync(serviceIdentifier)

      expect(mockInversifyContainer.getAsync).toHaveBeenCalledTimes(1)
      expect(mockInversifyContainer.getAsync).toHaveBeenCalledWith(
        serviceIdentifier
      )
      expect(result).toBe(mockResult)
    })

    it('should handle async resolution errors', async () => {
      const serviceIdentifier = 'TestService'
      const mockError = new Error('Async resolution failed')
      mockInversifyContainer.getAsync.mockRejectedValue(mockError)

      await expect(container.getAsync(serviceIdentifier)).rejects.toThrow(
        'Async resolution failed'
      )
    })

    it('should preserve generic type information in async context', async () => {
      interface AsyncTestInterface {
        asyncTest: string
      }
      const serviceIdentifier = Symbol('AsyncTestInterface')
      const mockResult: AsyncTestInterface = { asyncTest: 'async value' }
      mockInversifyContainer.getAsync.mockResolvedValue(mockResult)

      const result =
        await container.getAsync<AsyncTestInterface>(serviceIdentifier)

      expect(result.asyncTest).toBe('async value')
    })
  })

  describe('isBound', () => {
    it('should delegate to inversify container isBound method', () => {
      const serviceIdentifier = 'TestService'
      mockInversifyContainer.isBound.mockReturnValue(true)

      const result = container.isBound(serviceIdentifier)

      expect(mockInversifyContainer.isBound).toHaveBeenCalledTimes(1)
      expect(mockInversifyContainer.isBound).toHaveBeenCalledWith(
        serviceIdentifier
      )
      expect(result).toBe(true)
    })

    it('should return false when service is not bound', () => {
      const serviceIdentifier = 'UnboundService'
      mockInversifyContainer.isBound.mockReturnValue(false)

      const result = container.isBound(serviceIdentifier)

      expect(result).toBe(false)
    })

    it('should work with different identifier types', () => {
      class TestClass {}
      mockInversifyContainer.isBound.mockReturnValue(true)

      const result = container.isBound(TestClass)

      expect(mockInversifyContainer.isBound).toHaveBeenCalledWith(TestClass)
      expect(result).toBe(true)
    })
  })

  describe('unbind', () => {
    it('should delegate to inversify container unbind method', () => {
      const serviceIdentifier = 'TestService'

      container.unbind(serviceIdentifier)

      expect(mockInversifyContainer.unbind).toHaveBeenCalledTimes(1)
      expect(mockInversifyContainer.unbind).toHaveBeenCalledWith(
        serviceIdentifier
      )
    })

    it('should work with symbol identifiers', () => {
      const symbolIdentifier = Symbol('TestService')

      container.unbind(symbolIdentifier)

      expect(mockInversifyContainer.unbind).toHaveBeenCalledWith(
        symbolIdentifier
      )
    })

    it('should not return a value', () => {
      const serviceIdentifier = 'TestService'

      const result = container.unbind(serviceIdentifier)

      expect(result).toBeUndefined()
    })
  })
})

describe('ContainerModule', () => {
  describe('constructor', () => {
    it('should store the registry function', () => {
      const mockRegistry: ContainerModuleRegistry = jest.fn()
      const module = new ContainerModule(mockRegistry)

      expect(module.registry).toBe(mockRegistry)
    })

    it('should accept different registry function signatures', () => {
      const mockRegistry1: ContainerModuleRegistry = (container) => {
        container.bind('test').to(class {})
      }
      const mockRegistry2: ContainerModuleRegistry = (container) => {
        // Empty registry
      }

      const module1 = new ContainerModule(mockRegistry1)
      const module2 = new ContainerModule(mockRegistry2)

      expect(module1.registry).toBe(mockRegistry1)
      expect(module2.registry).toBe(mockRegistry2)
    })
  })

  describe('registry property', () => {
    it('should be callable', () => {
      const mockRegistry = jest.fn()
      const module = new ContainerModule(mockRegistry)
      const mockContainer = new Container()

      module.registry(mockContainer)

      expect(mockRegistry).toHaveBeenCalledTimes(1)
      expect(mockRegistry).toHaveBeenCalledWith(mockContainer)
    })

    it('should be replaceable', () => {
      const originalRegistry = jest.fn()
      const newRegistry = jest.fn()
      const module = new ContainerModule(originalRegistry)

      module.registry = newRegistry

      expect(module.registry).toBe(newRegistry)
      expect(module.registry).not.toBe(originalRegistry)
    })
  })
})

describe('Integration tests', () => {
  let container: Container

  beforeEach(() => {
    container = new Container()
  })

  it('should work with complex module loading scenarios', () => {
    const registry1 = jest.fn()
    const registry2 = jest.fn()
    const module1 = new ContainerModule(registry1)
    const module2 = new ContainerModule(registry2)

    container.load(module1)
    container.load(module2)
    container.load(module1) // Try to load module1 again

    expect(registry1).toHaveBeenCalledTimes(1) // Should only be called once
    expect(registry2).toHaveBeenCalledTimes(1)
  })

  it('should handle circular module dependencies', () => {
    const registry1 = jest.fn()
    const registry2 = jest.fn()

    const module1 = new ContainerModule((container) => {
      registry1(container)
      // Module1 tries to load Module2
      container.load(module2)
    })

    const module2 = new ContainerModule((container) => {
      registry2(container)
      // Module2 tries to load Module1 (circular dependency)
      container.load(module1)
    })

    // This should not cause infinite recursion
    container.load(module1)

    expect(registry1).toHaveBeenCalledTimes(1)
    expect(registry2).toHaveBeenCalledTimes(1)
  })

  it('should maintain module loading state across different operations', () => {
    const registry = jest.fn()
    const module = new ContainerModule(registry)

    // Load the module
    container.load(module)
    expect(container['loadedModules'].has(module)).toBe(true)

    // Perform other operations
    container.bind('test')
    container.isBound('test')

    // Try to load again
    container.load(module)
    expect(registry).toHaveBeenCalledTimes(1) // Should still only be called once
  })

  it('should handle module with complex registry logic', () => {
    const mockBindResult = { to: jest.fn(), toSelf: jest.fn() }
    const mockContainer = container.container as jest.Mocked<InversifyContainer>
    mockContainer.bind.mockReturnValue(mockBindResult as any)

    const complexRegistry: ContainerModuleRegistry = (container) => {
      container.bind('service1')
      container.bind('service2')
      if (container.isBound('service1')) {
        container.bind('service3')
      }
    }

    const module = new ContainerModule(complexRegistry)
    container.load(module)

    expect(mockContainer.bind).toHaveBeenCalledWith('service1')
    expect(mockContainer.bind).toHaveBeenCalledWith('service2')
    expect(mockContainer.isBound).toHaveBeenCalledWith('service1')
  })
})

describe('Type definitions', () => {
  it('should accept proper ContainerModuleRegistry signature', () => {
    const validRegistry: ContainerModuleRegistry = (container: Container) => {
      container.bind('test')
    }

    expect(typeof validRegistry).toBe('function')
  })

  it('should work with different service identifier types', () => {
    const container = new Container()

    // String identifier
    const stringId: ServiceIdentifier<string> = 'string-service'
    container.bind(stringId)

    // Symbol identifier
    const symbolId: ServiceIdentifier<object> = Symbol('symbol-service')
    container.bind(symbolId)

    // Class identifier
    class TestClass {}
    const classId: ServiceIdentifier<TestClass> = TestClass
    container.bind(classId)

    expect(true).toBe(true) // Type compilation test
  })
})
