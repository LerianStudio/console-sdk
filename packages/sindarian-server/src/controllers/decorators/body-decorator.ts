import { BODY_KEY } from '@/constants/keys'
import { getNextRequestArgument } from '@/utils/nextjs/get-next-arguments'
import { ValidationApiException } from '@/exceptions/api-exception'
import { NextRequest } from 'next/server'
import { getFormData } from '@/utils/form-data/get-form-data'

export type BodyMetadata = {
  propertyIndex: number
  schema?: () => any
}

// Cache to store parsed body to avoid reading it multiple times
const bodyCache = new WeakMap<NextRequest, any>()

/**
 * Handler to validate the body of the request.
 *
 * @param target - The target object.
 * @param propertyKey - The property key.
 * @param args - The arguments.
 * @returns The parameter and parameter index.
 */
export async function bodyDecoratorHandler(
  target: object,
  propertyKey: string | symbol,
  args: any[]
) {
  const metadata: BodyMetadata = Reflect.getOwnMetadata(
    BODY_KEY,
    target,
    propertyKey
  )

  // If the metadata is not found, return null.
  if (metadata) {
    const request: NextRequest = getNextRequestArgument(args)

    // Check if body is already cached
    let body = bodyCache.get(request)

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
        bodyCache.set(request, body)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error: any) {
        // Handle missing or invalid body
        throw new ValidationApiException('Missing or invalid request body')
      }
    }

    // If the schema is not provided, return the body.
    if (!metadata.schema) {
      return {
        parameter: body,
        parameterIndex: metadata.propertyIndex
      }
    }

    // Parse the body using the schema.
    const resolvedSchema = metadata.schema?.()
    const parsedBody = resolvedSchema?.safeParse(body)

    // If the body is not valid, throw a validation error.
    if (parsedBody && !parsedBody.success) {
      throw new ValidationApiException(
        `Invalid body: ${JSON.stringify(parsedBody.error.flatten().fieldErrors)}`
      )
    }

    return {
      parameter: body,
      parameterIndex: metadata.propertyIndex
    }
  }

  return null
}

/**
 * Decorator to validate the body of the request.
 *
 * @param schema - The Zod schema to validate the body against.
 * @returns A decorator function that can be used to decorate a controller method.
 */
export function Body(schema?: any) {
  return function (
    target: object,
    propertyKey: string | symbol,
    propertyIndex: number
  ) {
    const metadata: BodyMetadata = {
      propertyIndex,
      schema: schema ? () => schema : undefined
    }
    Reflect.defineMetadata(BODY_KEY, metadata, target, propertyKey)
  }
}
