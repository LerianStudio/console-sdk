import {
  BindToFluentSyntax,
  GetAllOptions,
  GetOptions,
  Container as InversifyContainer,
  OptionalGetOptions,
  ServiceIdentifier
} from 'inversify'

/**
 * A Wrapper class for the Inversify Container.
 * Allows the container into a N depth hierarchy module system.
 */
export class Container {
  public container: InversifyContainer
  private loadedModules: Set<ContainerModule> = new Set()

  constructor() {
    this.container = new InversifyContainer({
      defaultScope: 'Singleton'
    })
  }

  /**
   * Loads a module into the container.
   * Internally calls the registry method of the module.
   * All child modules are registered in the parent container.
   * @param module ContainerModule
   */
  load(module: ContainerModule) {
    if (!Object.prototype.hasOwnProperty.call(module, 'registry')) {
      throw new Error(
        `Container: module ${module} does not have a registry method`
      )
    }

    // Prevent infinite recursion by tracking loaded modules
    if (this.loadedModules.has(module)) {
      return
    }
    this.loadedModules.add(module)

    module.registry(this)
  }

  bind<T>(serviceIdentifier: ServiceIdentifier<T>): BindToFluentSyntax<T> {
    return this.container.bind(serviceIdentifier)
  }

  get<T>(
    serviceIdentifier: ServiceIdentifier<T>,
    options?: OptionalGetOptions
  ): T {
    if (options !== undefined) {
      return this.container.get(serviceIdentifier, options) as T
    }
    return this.container.get(serviceIdentifier) as T
  }

  getAsync<T>(
    serviceIdentifier: ServiceIdentifier<T>,
    options?: GetOptions
  ): Promise<T> {
    if (options !== undefined) {
      return this.container.getAsync(serviceIdentifier, options)
    }
    return this.container.getAsync(serviceIdentifier) as Promise<T>
  }

  getAllAsync<T>(
    serviceIdentifier: ServiceIdentifier<T>,
    options?: GetAllOptions
  ): Promise<T[]> {
    return this.container.getAllAsync(serviceIdentifier, options)
  }

  isBound<T>(serviceIdentifier: ServiceIdentifier<T>): boolean {
    return this.container.isBound(serviceIdentifier)
  }

  unbind<T>(serviceIdentifier: ServiceIdentifier<T>): void {
    this.container.unbind(serviceIdentifier)
  }
}

export type ContainerModuleRegistry = (container: Container) => void

/**
 * Child module container.
 * Receives a registry method to allow child bindings.
 * @param registry ContainerModuleRegistry
 */
export class ContainerModule {
  public registry: ContainerModuleRegistry

  constructor(registry: ContainerModuleRegistry) {
    this.registry = registry
  }
}
