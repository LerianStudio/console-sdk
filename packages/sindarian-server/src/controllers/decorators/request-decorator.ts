import { REQUEST_KEY } from '@/constants/keys'
import { getNextRequestArgument } from '@/utils/nextjs/get-next-arguments'

export type RequestMetadata = {
  propertyKey: string | symbol
  parameterIndex: number
}

export class RequestHandler {
  static getMetadata(
    target: object,
    propertyKey: string | symbol
  ): RequestMetadata | undefined {
    let metadata: RequestMetadata = Reflect.getOwnMetadata(
      REQUEST_KEY,
      target,
      propertyKey
    )

    // If not found on instance, try constructor prototype
    if (!metadata && target.constructor) {
      metadata = Reflect.getOwnMetadata(
        REQUEST_KEY,
        target.constructor.prototype,
        propertyKey
      )
    }

    return metadata
  }

  static handle(target: object, propertyKey: string | symbol, args: any[]) {
    const metadata = this.getMetadata(target, propertyKey)

    if (metadata) {
      return {
        type: 'custom',
        parameter: getNextRequestArgument(args),
        parameterIndex: metadata.parameterIndex
      }
    }
    return null
  }
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
