import { REQUEST_KEY } from '@/constants/keys'
import { getNextRequestArgument } from '@/utils/nextjs/get-next-arguments'

export type RequestMetadata = {
  propertyKey: string | symbol
  parameterIndex: number
}

/**
 * Handler to fetch the request object.
 *
 * @param target - The target object.
 * @param propertyKey - The property key.
 * @param args - The arguments.
 * @returns The parameter and parameter index.
 */
export function requestDecoratorHandler(
  target: object,
  propertyKey: string | symbol,
  args: any[]
) {
  const metadata: RequestMetadata = Reflect.getOwnMetadata(
    REQUEST_KEY,
    target,
    propertyKey
  )
  if (metadata) {
    return {
      parameter: getNextRequestArgument(args),
      parameterIndex: metadata.parameterIndex
    }
  }
  return null
}

/**
 * Decorator to fetch the request object.
 *
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Request() {
  return function (
    target: object,
    propertyKey: string | symbol,
    parameterIndex: number
  ) {
    Reflect.defineMetadata(
      REQUEST_KEY,
      {
        propertyKey,
        parameterIndex
      },
      target,
      propertyKey
    )
  }
}

export { Request as Req }
