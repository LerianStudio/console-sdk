import { BODY_KEY, ROUTE_KEY } from '@/constants/keys'
import {
  getMaxBodyBytesArgument,
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

/** The largest body a route reads, in bytes, when neither it nor the server sets one. */
export const DEFAULT_MAX_BODY_BYTES = 1024 * 1024

// A limit that cannot cap (NaN, Infinity, negative) falls through to the next one.
const byteLimit = (limit?: number) =>
  Number.isFinite(limit) && (limit as number) >= 0 ? limit : undefined

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
        // One cap for every content type: the caller's Content-Type never picks it.
        const maxBytes =
          byteLimit(metadata.maxBytes) ??
          byteLimit(getMaxBodyBytesArgument(args)) ??
          DEFAULT_MAX_BODY_BYTES

        try {
          const source = new Response(bounded(request.body, maxBytes), {
            headers: { 'Content-Type': contentType }
          })

          if (contentType.includes('multipart/form-data')) {
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
