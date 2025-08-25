import { BindInFluentSyntax, ResolutionContext } from 'inversify'
import { Class, Constructor } from '@/types/class'
import { Container, ContainerModule } from '@/dependency-injection/container'
import {
  MODULE_KEY,
  MODULE_PROPERTY,
  PROVIDERS_PROPERTY,
  CONTROLLERS_PROPERTY,
  IMPORTS_PROPERTY
} from '@/constants/keys'
import { Scope } from '@/constants/scopes'
import {
  controllerHandler,
  ControllerMetadata
} from '@/controllers/decorators/controller-decorator'
import { interceptorHandler } from '@/interceptor/decorators/use-interceptor-decorator'
import { Logger } from '@/logger/logger'

// Type for injection tokens - can be symbols, strings, or abstract classes
export type InjectionToken<T = any> = symbol | string | Constructor<T>

type Provider =
  | {
      provide: InjectionToken
      useClass?: Class
      useValue?: any
      useFactory?: (context: ResolutionContext) => any | Promise<any>
      scope?: Scope
    }
  | Class

export type ModuleOptions = {
  imports?: Class[]
  controllers?: Class[]
  providers?: Provider[]
}

export type ModuleMetadata = ControllerMetadata & {
  controller: Class
}

export function moduleHandler(
  target: Function,
  visited: Set<Function> = new Set()
): ModuleMetadata[] {
  // Prevent infinite recursion by tracking visited modules
  if (visited.has(target)) {
    return []
  }
  visited.add(target)

  const routes = []
  const imports = target.prototype[IMPORTS_PROPERTY]
  const controllers = target.prototype[CONTROLLERS_PROPERTY]

  if (imports) {
    for (const importEntity of imports) {
      routes.push(...moduleHandler(importEntity, visited))
    }
  }

  if (controllers) {
    for (const controller of controllers) {
      const controllerRoutes = controllerHandler(controller).map((route) => ({
        ...route,
        controller
      }))

      Logger.log(
        `Registered ${controllerRoutes.length} routes for controller ${controller.name}`
      )

      routes.push(...controllerRoutes)
    }
  }

  return routes
}

export function Module(options?: ModuleOptions): ClassDecorator {
  const { imports, providers, controllers } = options || {}

  const moduleContainer = new ContainerModule((container) => {
    if (imports) {
      imports.forEach((importEntity) => {
        if (importEntity.prototype[MODULE_PROPERTY]) {
          container.load(importEntity.prototype[MODULE_PROPERTY])
        }
      })
    }

    if (providers) {
      providers.forEach((provider) => registerProvider(container, provider))
    }

    if (controllers) {
      controllers.forEach((controller) => {
        // Bind the controller
        container.bind(controller).to(controller).inSingletonScope()

        // Check for interceptors and register class types
        const interceptors = interceptorHandler(controller)
        interceptors.forEach((interceptor) => {
          // If it's a class constructor (function), register it in the container
          if (typeof interceptor === 'function') {
            container.bind(interceptor).toSelf().inSingletonScope()
          } else {
            // If it's an instance, bind it to its constructor class as a constant value
            container.bind(interceptor.constructor).toConstantValue(interceptor)
          }
        })
      })
    }
  })

  return function (target: Function) {
    Reflect.defineMetadata(
      MODULE_KEY,
      {
        imports,
        providers,
        controllers
      },
      target
    )

    const prototype = target.prototype

    prototype[IMPORTS_PROPERTY] = imports
    prototype[MODULE_PROPERTY] = moduleContainer
    prototype[PROVIDERS_PROPERTY] = providers
    prototype[CONTROLLERS_PROPERTY] = controllers
  }
}

/**
 * Register a provider in the container
 * @param container
 * @param provider
 */
function registerProvider(container: Container, provider: Provider) {
  // Checks if provider is a object with options
  if (typeof provider === 'object') {
    registerProviderObject(container, provider)
  } else {
    // If not, it's a simple class type
    container.bind(provider).to(provider)
  }
}

/**
 * Registers a provider object in the container
 * @param container
 * @param provider
 * @returns
 */
function registerProviderObject(container: Container, provider: Provider) {
  // Protect the method by avoid non objects
  if (typeof provider !== 'object') {
    return
  }

  const { provide, useClass, useValue, useFactory, scope } = provider

  const bind = container.bind(provide)

  if (useClass) {
    registerScope(bind.to(useClass), scope)
    return
  }

  if (useFactory) {
    registerScope(
      bind.toDynamicValue(async (context) => {
        return await useFactory!(context)
      }),
      scope
    )
    return
  }

  if (useValue) {
    bind.toConstantValue(useValue)
    return
  }

  const message = `Module: Invalid provider ${provider.provide.toString()} configuration`
  Logger.error(message)
  throw new Error(message)
}

/**
 * Registers a scope for a binding
 * @param bind
 * @param scope
 * @returns
 */
function registerScope<T>(bind: BindInFluentSyntax<T>, scope?: Scope) {
  switch (scope) {
    case Scope.DEFAULT:
      return bind.inSingletonScope()
    case Scope.REQUEST:
      return bind.inRequestScope()
    case Scope.TRANSIENT:
      return bind.inTransientScope()
    default:
      return bind.inSingletonScope()
  }
}
