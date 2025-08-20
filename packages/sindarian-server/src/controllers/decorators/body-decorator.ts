import { z } from 'zod'
import { BODY_KEY } from '@/constants/keys'
import { getNextRequestArgument } from '@/utils/nextjs/get-next-arguments'
import { ValidationApiException } from '@/exceptions/api-exception'

export type BodyMetadata = {
  propertyIndex: number
  schema?: () => z.ZodSchema
}

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
    const request = getNextRequestArgument(args)

    let body
    try {
      body = await request.json()
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Handle missing or invalid body
      throw new ValidationApiException('Missing or invalid request body')
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
      parameter: parsedBody?.data || body,
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
export function Body(schema?: z.ZodSchema | (() => z.ZodSchema)) {
  return function (
    target: object,
    propertyKey: string | symbol,
    propertyIndex: number
  ) {
    // Wrap the schema in a function to prevent TypeScript from analyzing it during compilation
    const lazySchema = schema
      ? () => (typeof schema === 'function' ? schema() : schema)
      : undefined

    Reflect.defineMetadata(
      BODY_KEY,
      { propertyIndex, schema: lazySchema },
      target,
      propertyKey
    )
  }
}
