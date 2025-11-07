import { INTERCEPTOR_KEY } from '@/constants/keys'
import { Interceptor } from '../interceptor'
import { CallHandler } from '../call-handler'
import { ExecutionContext } from '@/context/execution-context'
import { Class } from '@/types/class'
import type { Container } from '@/dependency-injection'

export type InterceptorMetadata = {
  interceptors: (Interceptor | Class<Interceptor>)[]
}

export class InterceptorHandler {
  static getMetadata(target: object): InterceptorMetadata {
    const metadata = Reflect.getOwnMetadata(INTERCEPTOR_KEY, target)
    if (metadata) {
      return { interceptors: metadata }
    }
    return { interceptors: [] }
  }

  static async register(container: Container, target: object) {
    const metadata = InterceptorHandler.getMetadata(target)

    if (!metadata || metadata.interceptors.length === 0) {
      return
    }

    metadata.interceptors.forEach((interceptor) => {
      // If it's a class constructor (function), register it in the container
      if (typeof interceptor === 'function') {
        if (!container.isBound(interceptor)) {
          container.bind(interceptor).toSelf().inSingletonScope()
        }
      } else {
        // If it's an instance, bind it to its constructor class as a constant value
        container.bind(interceptor.constructor).toConstantValue(interceptor)
      }
    })
  }

  static async fetch(
    container: Container,
    target: object
  ): Promise<Interceptor[]> {
    const metadata = InterceptorHandler.getMetadata(target)

    if (metadata && metadata.interceptors.length > 0) {
      return await Promise.all(
        metadata.interceptors.map((interceptor) => {
          // If it's a class constructor (function), resolve from container
          if (typeof interceptor === 'function') {
            return container.getAsync<Interceptor>(interceptor)
          }
          // If it's an instance, resolve from container using its constructor
          return container.getAsync<Interceptor>(interceptor.constructor as any)
        })
      )
    }

    return []
  }

  static async execute(
    executionContext: ExecutionContext,
    middlewares: Interceptor[],
    action: () => Promise<any>
  ) {
    if (middlewares.length === 0) {
      return await action()
    }

    let i = 0

    const next: CallHandler = {
      handle: async () => {
        if (i >= middlewares.length) {
          return await action()
        }

        const layer = middlewares[i++]

        try {
          return await layer.intercept(executionContext, next)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error: any) {
          return await next.handle()
        }
      }
    }

    return await next.handle()
  }
}

export function UseInterceptors(
  ...interceptors: (Interceptor | Class<Interceptor>)[]
): ClassDecorator {
  return (target: any) => {
    const existingInterceptors =
      Reflect.getOwnMetadata(INTERCEPTOR_KEY, target) || []
    Reflect.defineMetadata(
      INTERCEPTOR_KEY,
      [...existingInterceptors, ...interceptors],
      target
    )
  }
}
