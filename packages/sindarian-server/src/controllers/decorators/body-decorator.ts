import { BODY_KEY, ROUTE_KEY } from '@/constants/keys'
import {
  getBodyLimitsArgument,
  getNextRequestArgument
} from '@/utils/nextjs/get-next-arguments'
import {
  PayloadTooLargeApiException,
  ValidationApiException
} from '@/exceptions/api-exception'
import { NextRequest } from 'next/server'
import { getFormData } from '@/utils/form-data/get-form-data'

export type BodyOptions = {
  /** The largest body this route reads, in bytes, over the server's default. */
  maxBytes?: number
}

/** The largest body any route reads, in bytes; multipart has its own ceiling. */
export type BodyLimits = {
  maxBytes: number
  maxMultipartBytes: number
}

export const DEFAULT_BODY_LIMITS: BodyLimits = {
  maxBytes: 1024 * 1024,
  maxMultipartBytes: 10 * 1024 * 1024
}

export type BodyMetadata = {
  parameterIndex: number
  maxBytes?: number
}

/** `body`, erroring with 413 once it passes `maxBytes`, which cancels the source. */
function bounded(body: ReadableStream<Uint8Array> | null, maxBytes: number) {
  let size = 0

  return body?.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        size += chunk.byteLength
        if (size > maxBytes) {
          controller.error(
            new PayloadTooLargeApiException(
              `Request body is larger than ${maxBytes} bytes`
            )
          )
        } else {
          controller.enqueue(chunk)
        }
      }
    })
  )
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
        const contentType = request.headers.get('Content-Type') ?? ''
        const multipart = contentType.includes('multipart/form-data')
        const limits = {
          ...DEFAULT_BODY_LIMITS,
          ...getBodyLimitsArgument(args)
        }
        const source = new Response(
          bounded(
            request.body,
            metadata.maxBytes ??
              (multipart ? limits.maxMultipartBytes : limits.maxBytes)
          ),
          { headers: { 'Content-Type': contentType } }
        )

        try {
          if (multipart) {
            body = getFormData(await source.formData())
          } else if (contentType.includes('application/json')) {
            body = await source.json()
          } else {
            body = await source.text()
          }

          // Cache the parsed body
          this.bodyCache.set(request, body)
        } catch (error: unknown) {
          if (error instanceof PayloadTooLargeApiException) {
            throw error
          }
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
 * @param options - `maxBytes` overrides the server's body limit for this route
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Body(options: BodyOptions = {}) {
  return function (
    target: object,
    propertyKey: string | symbol,
    propertyIndex: number
  ) {
    Reflect.defineMetadata(
      BODY_KEY,
      { parameterIndex: propertyIndex, ...options },
      target,
      propertyKey
    )
  }
}
