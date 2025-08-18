import { Class, Constructor } from '@/types/class'
import { ContainerModule } from '@/dependency-injection/container'
import {
  MODULE_KEY,
  MODULE_PROPERTY,
  PROVIDERS_PROPERTY,
  CONTROLLERS_PROPERTY,
  IMPORTS_PROPERTY
} from '@/constants/keys'
import {
  controllerHandler,
  ControllerMetadata
} from '@/controllers/decorators/controller-decorator'
import { ResolutionContext } from 'inversify'

// Type for injection tokens - can be symbols, strings, or abstract classes
export type InjectionToken<T = any> = symbol | string | Constructor<T>

type Provider =
  | {
      provide: InjectionToken
      useClass?: Class
      useValue?: any
      useFactory?: (context: ResolutionContext) => any | Promise<any>
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

export function moduleHandler(target: Function, visited: Set<Function> = new Set()): ModuleMetadata[] {
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
      providers.forEach((providerEntity) => {
        if (typeof providerEntity === 'object') {
          if (providerEntity.useClass) {
            container.bind(providerEntity.provide).to(providerEntity.useClass)
          } else if (providerEntity.useFactory) {
            container
              .bind(providerEntity.provide)
              .toDynamicValue(async (context) => {
                return await providerEntity.useFactory!(context)
              })
          } else if (providerEntity.useValue) {
            container
              .bind(providerEntity.provide)
              .toConstantValue(providerEntity.useValue)
          }
        } else {
          container.bind(providerEntity).to(providerEntity)
        }
      })
    }

    if (controllers) {
      controllers.forEach((controller) => {
        container.bind(controller).to(controller)
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
