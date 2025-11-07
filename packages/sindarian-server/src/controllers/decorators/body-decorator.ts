import { BODY_KEY, ROUTE_KEY } from '@/constants/keys'
import { getNextRequestArgument } from '@/utils/nextjs/get-next-arguments'
import { ValidationApiException } from '@/exceptions/api-exception'
import { NextRequest } from 'next/server'
import { getFormData } from '@/utils/form-data/get-form-data'

export type BodyMetadata = {
  parameterIndex: number
}

export class BodyHandler {
  // Cache to store parsed body to avoid reading it multiple times
  private static bodyCache = new WeakMap<NextRequest, any>()

  static getMetadata(
    target: object,
    propertyKey: string | symbol
  ): BodyMetadata | undefined {
    let metadata: BodyMetadata = Reflect.getOwnMetadata(
      BODY_KEY,
      target,
      propertyKey
    )

    // If not found on instance, try constructor prototype
    if (!metadata && target.constructor) {
      metadata = Reflect.getOwnMetadata(
        BODY_KEY,
        target.constructor.prototype,
        propertyKey
      )
    }

    return metadata
  }

  static async handle(
    target: object,
    propertyKey: string | symbol,
    args: any[]
  ) {
    const metadata = this.getMetadata(target, propertyKey)

    // If the metadata is not found, return null.
    if (metadata) {
      // Get the route metadata to access paramTypes (check both target and prototype)
      let routeMetadata = Reflect.getOwnMetadata(ROUTE_KEY, target, propertyKey)
      if (!routeMetadata && target.constructor) {
        routeMetadata = Reflect.getOwnMetadata(
          ROUTE_KEY,
          target.constructor.prototype,
          propertyKey
        )
      }

      const paramTypes = routeMetadata?.paramTypes || []

      const request: NextRequest = getNextRequestArgument(args)

      // Check if body is already cached
      let body = this.bodyCache.get(request)

      if (!body) {
        const contentType = request.headers.get('Content-Type')
        try {
          if (contentType?.includes('multipart/form-data')) {
            body = getFormData(await request.formData())
          } else if (contentType?.includes('application/json')) {
            body = await request.json()
          } else {
            body = await request.text()
          }

          // Cache the parsed body
          this.bodyCache.set(request, body)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error: any) {
          // Handle missing or invalid body
          throw new ValidationApiException('Missing or invalid request body')
        }
      }

      return {
        type: 'body',
        parameter: body,
        parameterIndex: metadata.parameterIndex,
        paramType: paramTypes[metadata.parameterIndex]
      }
    }

    return null
  }
}

/**
 * Decorator to validate the body of the request.
 *
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Body() {
  return function (
    target: object,
    propertyKey: string | symbol,
    propertyIndex: number
  ) {
    Reflect.defineMetadata(
      BODY_KEY,
      {
        parameterIndex: propertyIndex
      },
      target,
      propertyKey
    )
  }
}
