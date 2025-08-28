import { QUERY_KEY } from '@/constants/keys'
import { getNextRequestArgument } from '@/utils/nextjs/get-next-arguments'

export type QueryMetadata = {
  propertyKey: string | symbol
  parameterIndex: number
}

export class QueryHandler {
  static getMetadata(
    target: object,
    propertyKey: string | symbol
  ): QueryMetadata | undefined {
    let metadata: QueryMetadata = Reflect.getOwnMetadata(
      QUERY_KEY,
      target,
      propertyKey
    )

    // If not found on instance, try constructor prototype
    if (!metadata && target.constructor) {
      metadata = Reflect.getOwnMetadata(
        QUERY_KEY,
        target.constructor.prototype,
        propertyKey
      )
    }

    return metadata
  }

  static handle(target: object, propertyKey: string | symbol, args: any[]) {
    const metadata = this.getMetadata(target, propertyKey)

    // If the metadata is found, validate the query.
    if (metadata) {
      const request = getNextRequestArgument(args)
      const { searchParams } = new URL(request.url)

      const query = Object.fromEntries(searchParams.entries())

      return {
        type: 'query',
        parameter: query,
        parameterIndex: metadata.parameterIndex
      }
    }

    return null
  }
}

/**
 * Decorator to validate the query of the request.
 *
 * @param schema - The Zod schema to validate the query against.
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Query() {
  return function (
    target: object,
    propertyKey: string | symbol,
    propertyIndex: number
  ) {
    // Get the parameter type from design:paramtypes
    Reflect.defineMetadata(
      QUERY_KEY,
      {
        propertyKey,
        parameterIndex: propertyIndex
      },
      target,
      propertyKey
    )
  }
}
