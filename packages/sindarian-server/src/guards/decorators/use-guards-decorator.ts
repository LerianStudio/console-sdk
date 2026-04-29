import { GUARD_KEY } from '@/constants/keys'
import { CanActivate } from '../can-activate'
import { ExecutionContext } from '@/context/execution-context'
import { Class } from '@/types/class'
import { getClassMethods } from '@/utils/class/get-class-methods'
import type { Container } from '@/dependency-injection'
import { ForbiddenApiException } from '@/exceptions/api-exception'

export type GuardMetadata = {
  guards: (CanActivate | Class<CanActivate>)[]
}

export class GuardHandler {
  static getClassMetadata(target: object): GuardMetadata | undefined {
    return Reflect.getOwnMetadata(GUARD_KEY, target)
  }

  static getMethodMetadata(
    target: object,
    propertyKey: string | symbol
  ): GuardMetadata | undefined {
    // First check if metadata exists directly on the target (method-level decorator)
    let metadata = Reflect.getOwnMetadata(GUARD_KEY, target, propertyKey)

    // If not found, check on the constructor prototype (class-level decorator)
    if (!metadata && target.constructor) {
      metadata = Reflect.getOwnMetadata(
        GUARD_KEY,
        target.constructor.prototype,
        propertyKey
      )
    }

    return metadata
  }

  static register(container: Container, target: Class) {
    const metadata = GuardHandler.getClassMetadata(target)

    if (metadata && metadata?.guards?.length !== 0) {
      const { guards } = metadata

      guards.forEach((guard) => {
        GuardHandler._register(container, guard)
      })
    }

    // Register method guards
    const methodNames = getClassMethods(target)

    methodNames.forEach((methodName) => {
      const methodMetadata: GuardMetadata = Reflect.getOwnMetadata(
        GUARD_KEY,
        target.prototype,
        methodName
      )
      if (methodMetadata) {
        methodMetadata.guards.forEach((guard) => {
          GuardHandler._register(container, guard)
        })
      }
    })
  }

  static async fetch(
    container: Container,
    target: object,
    methodName: string | symbol
  ): Promise<CanActivate[]> {
    const guards: CanActivate[] = []
    const metadata = GuardHandler.getClassMetadata(target.constructor)

    if (metadata && metadata.guards.length > 0) {
      guards.push(
        ...(await Promise.all(
          metadata.guards.map((guard) => GuardHandler._fetch(container, guard))
        ))
      )
    }

    const methodMetadata = GuardHandler.getMethodMetadata(target, methodName)

    if (methodMetadata) {
      guards.push(
        ...(await Promise.all(
          methodMetadata.guards.map((guard) =>
            GuardHandler._fetch(container, guard)
          )
        ))
      )
    }

    return guards
  }

  /**
   * Execute guards in sequence. If any guard returns false, throws ForbiddenApiException.
   * Guards execute in order: global guards -> class guards -> method guards
   */
  static async execute(
    executionContext: ExecutionContext,
    guards: CanActivate[]
  ): Promise<boolean> {
    for (const guard of guards) {
      const canActivate = await guard.canActivate(executionContext)

      if (!canActivate) {
        throw new ForbiddenApiException('Forbidden resource')
      }
    }

    return true
  }

  private static async _fetch(
    container: Container,
    guard: Class<CanActivate> | CanActivate
  ) {
    if (typeof guard === 'function') {
      return container.getAsync<CanActivate>(guard)
    }
    return container.getAsync<CanActivate>(guard.constructor as any)
  }

  private static _register(
    container: Container,
    guard: Class<CanActivate> | CanActivate
  ) {
    // If it's a class constructor (function), register it in the container
    if (typeof guard === 'function') {
      if (!container.isBound(guard)) {
        container.bind(guard).toSelf().inSingletonScope()
      }
    } else {
      // If it's an instance, bind it to its constructor class as a constant value
      container.bind(guard.constructor).toConstantValue(guard)
    }
  }
}

/**
 * Decorator that binds guards to the scope of the controller or method,
 * depending on its context.
 *
 * When `@UseGuards` is used at the controller level, the guard will be
 * applied to every handler (method) in the controller.
 *
 * When `@UseGuards` is used at the individual handler level, the guard
 * will apply only to that specific method.
 *
 * @param guards a single guard instance or class, or a list of guard instances
 * or classes.
 *
 * @see [Guards](https://docs.nestjs.com/guards)
 *
 * @usageNotes
 * Guards can also be set up globally for all controllers and routes
 * using `app.useGlobalGuards()` or by registering via module providers
 * with the `APP_GUARD` token.
 *
 * @publicApi
 */
export function UseGuards(
  ...guards: (CanActivate | Class<CanActivate>)[]
): ClassDecorator & MethodDecorator {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) => {
    if (descriptor && propertyKey) {
      // Method decorator
      Reflect.defineMetadata(GUARD_KEY, { guards }, target, propertyKey)
      return descriptor
    } else {
      // Class decorator
      const methodNames = getClassMethods(target)

      // Store class-level guards metadata
      Reflect.defineMetadata(GUARD_KEY, { guards }, target)

      // Process each method and store guards metadata
      methodNames.forEach((methodName) => {
        Reflect.defineMetadata(
          GUARD_KEY,
          { guards },
          target.prototype,
          methodName
        )
      })

      return target
    }
  }
}
