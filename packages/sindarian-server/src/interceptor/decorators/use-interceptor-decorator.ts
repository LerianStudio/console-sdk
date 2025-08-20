import { INTERCEPTOR_KEY } from '@/constants/keys'
import { Interceptor } from '../interceptor'
import { CallHandler } from '../call-handler'
import { ExecutionContext } from '@/context/execution-context'
import { Class } from '@/types/class'

export async function interceptorExecute(
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

export type InterceptorMetadata = Interceptor | Class<Interceptor>

export function interceptorHandler(target: object): InterceptorMetadata[] {
  return Reflect.getOwnMetadata(INTERCEPTOR_KEY, target) || []
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
